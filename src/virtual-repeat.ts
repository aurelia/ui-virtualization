import {
  ObserverLocator,
  Scope,
  Expression,
  ICollectionObserverSplice,
  OverrideContext,
  BindingExpression
} from 'aurelia-binding';
import {
  BoundViewFactory,
  ViewSlot,
  ViewResources,
  TargetInstruction,
  View,
  IStaticResourceConfig
} from 'aurelia-templating';
import {
  AbstractRepeater,
  getItemsSourceExpression,
  isOneTime,
  unwrapExpression,
  updateOneTimeBinding,
  viewsRequireLifecycle
} from 'aurelia-templating-resources';
import { DOM, PLATFORM } from 'aurelia-pal';
import { TaskQueue } from 'aurelia-task-queue';
import { Container } from 'aurelia-dependency-injection';
import {
  rebindAndMoveView,
  Math$ceil,
  Math$floor,
  Math$max,
  Math$abs
} from './utilities';
import {
  calcOuterHeight,
  getStyleValues,
  getElementDistanceToTopOfDocument,
  hasOverflowScroll,
  getDistanceToParent,
  calcScrollHeight
} from './utilities-dom';
import { VirtualRepeatStrategyLocator } from './virtual-repeat-strategy-locator';
import { TemplateStrategyLocator } from './template-strategy-locator';
import {
  IVirtualRepeatStrategy,
  ITemplateStrategy,
  IView,
  IScrollNextScrollContext,
  IViewSlot,
  IScrollerInfo
} from './interfaces';
import { getResizeObserverClass, ResizeObserver } from './resize-observer';
import { ArrayVirtualRepeatStrategy } from './array-virtual-repeat-strategy';

const enum VirtualRepeatCallContext {
  handleCollectionMutated = 'handleCollectionMutated',
  handleInnerCollectionMutated = 'handleInnerCollectionMutated'
}

export class VirtualRepeat extends AbstractRepeater {

  /**@internal */
  static inject() {
    // tslint:disable-next-line:max-line-length
    return [DOM.Element, BoundViewFactory, TargetInstruction, ViewSlot, ViewResources, ObserverLocator, VirtualRepeatStrategyLocator, TemplateStrategyLocator];
  }

  /**@internal */
  static $resource(): IStaticResourceConfig {
    return {
      type: 'attribute',
      name: 'virtual-repeat',
      templateController: true,
      // Wrong typings in templating
      bindables: ['items', 'local'] as any
    };
  }

  /**
   * First view index, for proper follow up calculations
   * @internal
   */
  _first: number = 0;

  /**
   * Preview first view index, for proper determination of delta
   * @internal
   */
  _previousFirst = 0;

  /**
   * Number of views required to fillup the viewport, and also enough to provide smooth scrolling
   * Without showing blank space
   * @internal
   */
  _viewsLength = 0;

  /**
   * @internal
   * Last rebound view index, user to determine first index of next task when scrolling/ changing viewport scroll position
   */
  _lastRebind = 0;

  /**
   * Height of top buffer to properly push the visible rendered list items into right position
   * Usually determined by `_first` visible index * `itemHeight`
   * @internal
   */
  _topBufferHeight = 0;

  /**
   * Height of bottom buffer to properly push the visible rendered list items into right position
   * @internal
   */
  _bottomBufferHeight = 0;

  /**@internal*/ _scrollingDown = false;
  /**@internal*/ _scrollingUp = false;
  /**@internal*/ _switchedDirection = false;
  /**@internal*/ _isAttached = false;
  /**@internal*/ _ticking = false;
  /**
   * Indicates whether virtual repeat attribute is inside a fixed height container with overflow
   *
   * This helps identifies place to add scroll event listener
   * @internal
   */
  _fixedHeightContainer = false;

  /**
   * Indicate current scrolltop of scroller is 0 or less
   * @internal
   */
  _isAtTop = true;
  /**@internal*/ _calledGetMore = false;

  /**
   * While handling consecutive scroll events, repeater and its strategies may need to do
   * some of work that will not finish immediately in order to figure out visible effective elements / views.
   * There are scenarios when doing this too quickly is unnecessary
   * as there could be still some effect on going from previous handler.
   *
   * This flag is away to ensure a scroll handler always has a chance to
   * finish all the work it starts, no matter how user interact via scrolling
   * @internal
   */
  _skipNextScrollHandle: boolean = false;

  /**
   * While handling mutation, repeater and its strategies could/should modify scroll position
   * to deliver a smooth user experience. This action may trigger a scroll event
   * which may disrupt the mutation handling or cause unwanted effects.
   *
   * This flag is a way to tell the scroll listener that there are scenarios that
   * scroll event should be ignored
   * @internal
   */
  _handlingMutations: boolean = false;

  /**@internal*/ _isScrolling: boolean = false;

  // Inherited properties declaration
  key: any;
  value: any;
  // Array repeat specific properties
  /**@internal*/ __queuedSplices: any[];
  /**@internal*/ __array: any[];

  /**
   * @bindable
   */
  items: any[];

  /**
   * @bindable
   */
  local: string;

  /**@internal */
  scope: Scope;

  /**@internal */
  viewSlot: IViewSlot;

  readonly viewFactory: BoundViewFactory;

  /**@internal */
  element: HTMLElement;

  /**@internal */
  private instruction: TargetInstruction;

  /**@internal */
  private lookupFunctions: any;

  /**@internal */
  private observerLocator: ObserverLocator;

  /**@internal */
  private strategyLocator: VirtualRepeatStrategyLocator;

  /**@internal */
  private templateStrategyLocator: TemplateStrategyLocator;

  /**@internal */
  private sourceExpression: Expression;

  /**@internal */
  private isOneTime: boolean;

  /**
   * Temporary snapshot of items list count. Updated regularly to determinate calculation need
   * @internal
   */
  _prevItemsCount: number;

  /**@internal */
  scrollerEl: HTMLElement;

  /**@internal */
  private scrollListener: () => any;

  /**@internal */
  private _sizeInterval: any;

  /**
   * When there are no scroller defined, fallback to use `documentElement` as scroller
   * This has implication that distance to top always needs to be recalculated as it can be changed at any time
   * @internal
   */
  private _calcDistanceToTopInterval: any;

  /**@internal */
  private taskQueue: TaskQueue;

  /**
   * Used to revert all checks related to scroll handling guard
   * Employed for manually blocking scroll handling
   * @internal
   */
  revertScrollCheckGuard: () => void;

  /**
   * Template handling strategy for this repeat.
   * @internal
   */
  templateStrategy: ITemplateStrategy;
  /**
   * Top buffer element, used to reflect the visualization of amount of items `before` the first visible item
   * @internal
   */
  topBufferEl: HTMLElement;
  /**
   * Bot buffer element, used to reflect the visualization of amount of items `after` the first visible item
   * @internal
   */
  bottomBufferEl: HTMLElement;

  /**
   * Height of each item. Calculated based on first item
   * @internal
   */
  itemHeight: number;
  /**
   * Calculate current scrolltop position
   */
  distanceToTop: number;

  /**
   * Indicates whether scroller is at the bottom of view range managed by this repeat
   * @internal
   */
  _isLastIndex: boolean;
  /**
   * Number indicating minimum elements required to render to fill up the visible viewport
   * @internal
   */
  elementsInView: number;
  /**
   * collection repeating strategy
   */
  strategy: IVirtualRepeatStrategy;
  /**
   * Flags to indicate whether to ignore next mutation handling
   * @internal
   */
  _ignoreMutation: boolean;

  /**@internal */
  callContext: VirtualRepeatCallContext;
  collectionObserver: any;

  constructor(
    element: HTMLElement,
    viewFactory: BoundViewFactory,
    instruction: TargetInstruction,
    viewSlot: ViewSlot,
    viewResources: ViewResources,
    observerLocator: ObserverLocator,
    collectionStrategyLocator: VirtualRepeatStrategyLocator,
    templateStrategyLocator: TemplateStrategyLocator
  ) {
    super({
      local: 'item',
      viewsRequireLifecycle: viewsRequireLifecycle(viewFactory)
    });

    this.element = element;
    this.viewFactory = viewFactory;
    this.instruction = instruction;
    this.viewSlot = viewSlot as IViewSlot;
    this.lookupFunctions = viewResources['lookupFunctions'];
    this.observerLocator = observerLocator;
    this.taskQueue = observerLocator.taskQueue;
    this.strategyLocator = collectionStrategyLocator;
    this.templateStrategyLocator = templateStrategyLocator;
    this.sourceExpression = getItemsSourceExpression(this.instruction, 'virtual-repeat.for');
    this.isOneTime = isOneTime(this.sourceExpression);
    this.itemHeight
      = this._prevItemsCount
      = this.distanceToTop
      = 0;
    this.revertScrollCheckGuard = () => {
      this._ticking = false;
    };
  }

  /**@override */
  bind(bindingContext: any, overrideContext: OverrideContext): void {
    this.scope = { bindingContext, overrideContext };
  }

  /**@override */
  attached(): void {
    this._isAttached = true;
    this._prevItemsCount = this.items.length;

    const element = this.element;
    const templateStrategy = this.templateStrategy = this.templateStrategyLocator.getStrategy(element);
    const scrollListener = this.scrollListener = () => {
      this._onScroll();
    };
    const containerEl = this.scrollerEl = templateStrategy.getScrollContainer(element);
    const [topBufferEl, bottomBufferEl] = templateStrategy.createBuffers(element);
    const isFixedHeightContainer = this._fixedHeightContainer = hasOverflowScroll(containerEl);

    this.topBufferEl = topBufferEl;
    this.bottomBufferEl = bottomBufferEl;
    this.itemsChanged();

    // When dealing with tables, there can be gaps between elements, causing distances to be messed up. Might need to handle this case here.
    const firstElement = templateStrategy.getFirstElement(topBufferEl, bottomBufferEl);
    this.distanceToTop = firstElement === null ? 0 : getElementDistanceToTopOfDocument(firstElement);

    if (isFixedHeightContainer) {
      containerEl.addEventListener('scroll', scrollListener);
    } else {
      DOM.addEventListener('scroll', scrollListener, false);
      // when there is no fixed height container (container with overflow scroll/auto)
      // it's assumed that the whole document will be scrollable
      // in this situation, distance from top buffer to top of the document/application
      // plays an important role and needs to be correct to correctly determine the real scrolltop of this virtual repeat
      // unfortunately, there is no easy way to observe this value without using dirty checking
      this._calcDistanceToTopInterval = PLATFORM.global.setInterval(() => {
        const prevDistanceToTop = this.distanceToTop;
        const currDistanceToTop = getElementDistanceToTopOfDocument(topBufferEl);
        this.distanceToTop = currDistanceToTop;
        if (prevDistanceToTop !== currDistanceToTop) {
          this._handleScroll();
        }
      }, 500);
    }
    if (this.items.length < this.elementsInView) {
      this._getMore(/*force?*/true);
    }
  }

  /**@override */
  call(context: 'handleCollectionMutated' | 'handleInnerCollectionMutated', changes: ICollectionObserverSplice[]): void {
    this[context](this.items, changes);
  }

  /**@override */
  detached(): void {
    const scrollCt = this.scrollerEl;
    const scrollListener = this.scrollListener;
    if (hasOverflowScroll(scrollCt)) {
      scrollCt.removeEventListener('scroll', scrollListener);
    } else {
      DOM.removeEventListener('scroll', scrollListener, false);
    }
    const observer = this._resizeObserver;
    if (observer) {
      observer.disconnect();
    }
    this._resizeObserver = undefined;
    this._isLastIndex = undefined;
    this._isAttached
      = this._fixedHeightContainer = false;
    this._unsubscribeCollection();
    this._resetCalculation();
    this.templateStrategy.removeBuffers(this.element, this.topBufferEl, this.bottomBufferEl);
    this.topBufferEl = this.bottomBufferEl = this.scrollerEl = this.scrollListener = null;
    this.removeAllViews(/*return to cache?*/true, /*skip animation?*/false);
    const $clearInterval = PLATFORM.global.clearInterval;
    $clearInterval(this._calcDistanceToTopInterval);
    $clearInterval(this._sizeInterval);
    this._prevItemsCount
      = this.distanceToTop
      = this._sizeInterval
      = this._calcDistanceToTopInterval = 0;
  }

  /**@override */
  unbind(): void {
    this.scope = null;
    this.items = null;
  }

  /**
   * @override
   *
   * If `items` is truthy, do the following calculation/work:
   *
   * - container fixed height flag
   * - necessary initial heights
   * - create new collection observer & observe for changes
   * - invoke `instanceChanged` on repeat strategy to create views / move views
   * - update indices
   * - update scrollbar position in special scenarios
   * - handle scroll as if scroll event happened
   */
  itemsChanged(): void {
    // the current collection subscription may be irrelevant
    // unsubscribe and resubscribe later
    this._unsubscribeCollection();
    // still bound? and still attached?
    if (!this.scope || !this._isAttached) {
      return;
    }

    const items = this.items;
    const strategy = this.strategy = this.strategyLocator.getStrategy(items);

    if (strategy === null) {
      throw new Error('Value is not iterateable for virtual repeat.');
    }

    // after calculating required variables
    // invoke like normal repeat attribute
    if (!this.isOneTime && !this._observeInnerCollection()) {
      this._observeCollection();
    }

    // sizing calculation result is used to setup a resize observer
    const isSizingCalculatable = strategy.initCalculation(this, items);
    strategy.instanceChanged(this, items, this._first);

    // if initial size are non-caclulatable,
    // setup an interval as a naive strategy to observe size
    // this can comes from element is initialy hidden, or 0 height for animation
    // or any other reasons.
    // todo: proper API design for sizing observation
    if (!isSizingCalculatable) {
      const { setInterval: $setInterval, clearInterval: $clearInterval } = PLATFORM.global;
      $clearInterval(this._sizeInterval);
      this._sizeInterval = $setInterval(() => {
        if (this.items) {
          const firstView = this._firstView() || this.strategy.createFirstItem(this);
          const newCalcSize = calcOuterHeight(firstView.firstChild as Element);
          if (newCalcSize > 0) {
            $clearInterval(this._sizeInterval);
            this.itemsChanged();
          }
        } else {
          $clearInterval(this._sizeInterval);
        }
      }, 500);
    }
  }

  /**@override */
  handleCollectionMutated(collection: any[], changes: ICollectionObserverSplice[]): void {
    // guard against multiple mutation, or mutation combined with instance mutation
    if (this._ignoreMutation) {
      return;
    }
    this._handlingMutations = true;
    this._prevItemsCount = collection.length;
    this.strategy.instanceMutated(this, collection, changes);
  }

  /**@override */
  handleInnerCollectionMutated(collection: any[], changes: ICollectionObserverSplice[]): void {
    // guard against source expressions that have observable side-effects that could
    // cause an infinite loop- eg a value converter that mutates the source array.
    if (this._ignoreMutation) {
      return;
    }
    this._ignoreMutation = true;
    let newItems = this.sourceExpression.evaluate(this.scope, this.lookupFunctions);
    this.taskQueue.queueMicroTask(() => this._ignoreMutation = false);

    // call itemsChanged...
    if (newItems === this.items) {
      // call itemsChanged directly.
      this.itemsChanged();
    } else {
      // call itemsChanged indirectly by assigning the new collection value to
      // the items property, which will trigger the self-subscriber to call itemsChanged.
      this.items = newItems;
    }
  }

  /**
   * Get the real scroller element of the DOM tree this repeat resides in
   */
  getScroller(): HTMLElement {
    return this._fixedHeightContainer
      ? this.scrollerEl
      : document.documentElement;
  }

  /**
   * Get scrolling information of the real scroller element of the DOM tree this repeat resides in
   */
  getScrollerInfo(): IScrollerInfo {
    const scroller = this.getScroller();
    return {
      scroller: scroller,
      scrollHeight: scroller.scrollHeight,
      scrollTop: scroller.scrollTop,
      height: calcScrollHeight(scroller)
    };
  }

  /**@internal */
  _resetCalculation(): void {
    this._first
      = this._previousFirst
      = this._viewsLength
      = this._lastRebind
      = this._topBufferHeight
      = this._bottomBufferHeight
      = this._prevItemsCount
      = this.elementsInView = 0;
    this._isScrolling
      = this._scrollingDown
      = this._scrollingUp
      = this._switchedDirection
      = this._ignoreMutation
      = this._handlingMutations
      = this._ticking
      = this._isLastIndex = false;
    this._isAtTop = true;
    this._updateBufferElements(true);
  }

  /**@internal*/
  _onScroll(): void {
    const isHandlingMutations = this._handlingMutations;
    if (!this._ticking && !isHandlingMutations) {
      requestAnimationFrame(() => {
        this._handleScroll();
        this._ticking = false;
      });
      this._ticking = true;
    }

    if (isHandlingMutations) {
      this._handlingMutations = false;
    }
  }

  /**@internal*/
  _handleScroll(): void {
    if (!this._isAttached) {
      return;
    }
    if (this._skipNextScrollHandle) {
      this._skipNextScrollHandle = false;
      return;
    }
    const items = this.items;
    if (!items) {
      return;
    }
    const topBufferEl = this.topBufferEl;
    const scrollerEl = this.scrollerEl;
    const itemHeight = this.itemHeight;
    /**
     * Real scroll top calculated based on current scroll top of scroller and top buffer {height + distance to top}
     * as there could be elements before top buffer and it affects real scroll top of the selected repeat
     *
     * Calculation are done differently based on the scroller:
     * - not document: the scroll top of this repeat is calculated based on current scroller.scrollTop and the distance to top of `top buffer`
     * - document: the scroll top is the substraction of `pageYOffset` and distance to top of current buffer element (logic needs revised)
     */
    let realScrollTop = 0;
    const isFixedHeightContainer = this._fixedHeightContainer;
    if (isFixedHeightContainer) {
      // If offset parent of top buffer is the scroll container
      //    its actual offsetTop is just the offset top itself
      // If not, then the offset top is calculated based on the parent offsetTop as well
      const topBufferDistance = getDistanceToParent(topBufferEl, scrollerEl);
      const scrollerScrollTop = scrollerEl.scrollTop;
      realScrollTop = Math$max(0, scrollerScrollTop - Math$abs(topBufferDistance));
    } else {
      realScrollTop = pageYOffset - this.distanceToTop;
    }
    const elementsInView = this.elementsInView;

    // Calculate the index of first view
    // Using Math floor to ensure it has correct space for both small and large calculation
    let firstIndex = Math$max(0, itemHeight > 0 ? Math$floor(realScrollTop / itemHeight) : 0);
    const currLastReboundIndex = this._lastRebind;
    // if first index starts somewhere after the last view
    // then readjust based on the delta
    if (firstIndex > items.length - elementsInView) {
      firstIndex = Math$max(0, items.length - elementsInView);
    }
    this._first = firstIndex;

    // Check scrolling states and adjust flags
    this._checkScrolling();

    const isSwitchedDirection = this._switchedDirection;
    // store buffers' heights into local variables
    const currentTopBufferHeight = this._topBufferHeight;
    const currentBottomBufferHeight = this._bottomBufferHeight;

    // TODO if and else paths do almost same thing, refactor?
    if (this._scrollingDown) {
      let viewsToMoveCount = firstIndex - currLastReboundIndex;
      if (isSwitchedDirection) {
        viewsToMoveCount = this._isAtTop
          ? firstIndex
          : (firstIndex - currLastReboundIndex);
      }
      this._isAtTop = false;
      this._lastRebind = firstIndex;
      const movedViewsCount = this._moveViews(viewsToMoveCount);
      const adjustHeight = movedViewsCount < viewsToMoveCount
        ? currentBottomBufferHeight
        : itemHeight * movedViewsCount;

      // when there is/are view/views to move
      // it could be because user has scrolled pass first index point that requires moving view
      if (viewsToMoveCount > 0) {
        this._getMore();
      }
      this._switchedDirection = false;
      this._topBufferHeight = currentTopBufferHeight + adjustHeight;
      this._bottomBufferHeight = Math$max(currentBottomBufferHeight - adjustHeight, 0);
      this._updateBufferElements(true);
    } else if (this._scrollingUp) {
      const isLastIndex = this._isLastIndex;
      let viewsToMoveCount = currLastReboundIndex - firstIndex;
      // Use for catching initial scroll state where a small page size might cause _getMore not to fire.
      const initialScrollState = isLastIndex === undefined;
      if (isSwitchedDirection) {
        if (isLastIndex) {
          viewsToMoveCount = items.length - firstIndex - elementsInView;
        } else {
          viewsToMoveCount = currLastReboundIndex - firstIndex;
        }
      }
      this._isLastIndex = false;
      this._lastRebind = firstIndex;
      const movedViewsCount = this._moveViews(viewsToMoveCount);
      const adjustHeight = movedViewsCount < viewsToMoveCount
        ? currentTopBufferHeight
        : itemHeight * movedViewsCount;
      if (viewsToMoveCount > 0) {
        const force = movedViewsCount === 0 && initialScrollState && firstIndex <= 0 ? true : false;
        this._getMore(force);
      }
      this._switchedDirection = false;
      this._topBufferHeight = Math$max(currentTopBufferHeight - adjustHeight, 0);
      this._bottomBufferHeight = currentBottomBufferHeight + adjustHeight;
      this._updateBufferElements(true);
    }
    this._previousFirst = firstIndex;
    this._isScrolling = false;
  }

  /**@internal*/
  _getMore(force?: boolean): void {
    if (this._isLastIndex || this._first === 0 || force === true) {
      if (!this._calledGetMore) {
        const executeGetMore = () => {
          this._calledGetMore = true;
          const firstView = this._firstView();
          const scrollNextAttrName = 'infinite-scroll-next';
          const func: string | (BindingExpression & { sourceExpression: Expression }) = (firstView
            && firstView.firstChild
            && firstView.firstChild.au
            && firstView.firstChild.au[scrollNextAttrName])
              ? firstView.firstChild.au[scrollNextAttrName].instruction.attributes[scrollNextAttrName]
              : undefined;
          const topIndex = this._first;
          const isAtBottom = this._bottomBufferHeight === 0;
          const isAtTop = this._isAtTop;
          const scrollContext: IScrollNextScrollContext = {
            topIndex: topIndex,
            isAtBottom: isAtBottom,
            isAtTop: isAtTop
          };

          const overrideContext = this.scope.overrideContext;
          overrideContext.$scrollContext = scrollContext;

          if (func === undefined) {
            // Still reset `_calledGetMore` flag as if it was invoked
            // though this should not happen as presence of infinite-scroll-next attribute
            // will make the value at least be an empty string
            // keeping this logic here for future enhancement/evolution
            this._calledGetMore = false;
            return null;
          } else if (typeof func === 'string') {
            const bindingContext = overrideContext.bindingContext;
            const getMoreFuncName = (firstView.firstChild as Element).getAttribute(scrollNextAttrName);
            const funcCall = bindingContext[getMoreFuncName];

            if (typeof funcCall === 'function') {
              let result = funcCall.call(bindingContext, topIndex, isAtBottom, isAtTop);
              if (!(result instanceof Promise)) {
                // Reset for the next time
                this._calledGetMore = false;
              } else {
                return result.then(() => {
                  // Reset for the next time
                  this._calledGetMore = false;
                });
              }
            } else {
              throw new Error(`'${scrollNextAttrName}' must be a function or evaluate to one`);
            }
          } else if (func.sourceExpression) {
            // Reset for the next time
            this._calledGetMore = false;
            return func.sourceExpression.evaluate(this.scope);
          } else {
            throw new Error(`'${scrollNextAttrName}' must be a function or evaluate to one`);
          }
          return null;
        };

        // use micro task so it will be executed before next frame
        // can help avoid doing double work for handling scroll
        // in case of mutation
        this.taskQueue.queueMicroTask(executeGetMore);
      }
    }
  }

  /**
   * On scroll event:
   * - Set flags based on internal values of first view index, previous view index
   * - Determines scrolling state, scroll direction, switching scroll direction
   * @internal
   */
  _checkScrolling(): void {
    const { _first, _scrollingUp, _scrollingDown, _previousFirst } = this;

    let isScrolling = false;
    let isScrollingDown = _scrollingDown;
    let isScrollingUp = _scrollingUp;
    let isSwitchedDirection = false;

    if (_first > _previousFirst
      // && (this._bottomBufferHeight > 0 || !this.isLastIndex)
    ) {
      if (!_scrollingDown) {
        isScrollingDown = true;
        isScrollingUp = false;
        isSwitchedDirection = true;
      } else {
        isSwitchedDirection = false;
      }
      isScrolling = true;
    }
    // todo: remove if
    // keep for checking old behavior
    else if (_first < _previousFirst
      // && (this._topBufferHeight >= 0 || !this._isAtTop)
    ) {
      if (!_scrollingUp) {
        isScrollingDown = false;
        isScrollingUp = true;
        isSwitchedDirection = true;
      } else {
        isSwitchedDirection = false;
      }
      isScrolling = true;
    }
    this._isScrolling = isScrolling;
    this._scrollingDown = isScrollingDown;
    this._scrollingUp = isScrollingUp;
    this._switchedDirection = isSwitchedDirection;
  }

  /**@internal */
  _updateBufferElements(skipUpdate?: boolean): void {
    this.topBufferEl.style.height = `${this._topBufferHeight}px`;
    this.bottomBufferEl.style.height = `${this._bottomBufferHeight}px`;
    if (skipUpdate) {
      this._ticking = true;
      requestAnimationFrame(this.revertScrollCheckGuard);
    }
  }

  /**@internal*/
  _unsubscribeCollection(): void {
    const collectionObserver = this.collectionObserver;
    if (collectionObserver) {
      collectionObserver.unsubscribe(this.callContext, this);
      this.collectionObserver = this.callContext = null;
    }
  }

  /**@internal */
  _firstView(): IView | null {
    return this.view(0);
  }

  /**@internal */
  _lastView(): IView | null {
    return this.view(this.viewCount() - 1);
  }

  /**
   * Move views based on scrolling direction and number of views to move
   * Must only be invoked only to move views while scrolling
   * @internal
   */
  _moveViews(viewsCount: number): number {
    const isScrollingDown = this._scrollingDown;
    const getNextIndex = isScrollingDown ? $plus : $minus;
    const childrenCount = this.viewCount();
    const viewIndex = isScrollingDown ? 0 : childrenCount - 1;
    const items = this.items;
    const currentIndex = isScrollingDown
      ? this._lastViewIndex() + 1
      : this._firstViewIndex() - 1;
    let i = 0;
    let nextIndex = 0;
    let view: IView;
    const viewToMoveLimit = viewsCount - (childrenCount * 2);
    while (i < viewsCount && !this._isAtFirstOrLastIndex) {
      view = this.view(viewIndex);
      nextIndex = getNextIndex(currentIndex, i);
      this._isLastIndex = nextIndex > items.length - 2;
      this._isAtTop = nextIndex < 1;
      if (!(this._isAtFirstOrLastIndex && childrenCount >= items.length)) {
        if (i > viewToMoveLimit) {
          rebindAndMoveView(this, view, nextIndex, isScrollingDown);
        }
        i++;
      }
    }
    return viewsCount - (viewsCount - i);
  }

  /**@internal */
  get _isAtFirstOrLastIndex(): boolean {
    return !this._isScrolling || this._scrollingDown ? this._isLastIndex : this._isAtTop;
  }

  /**@internal*/
  _firstViewIndex(): number {
    const firstView = this._firstView();
    return firstView === null ? -1 : firstView.overrideContext.$index;
  }

  /**@internal*/
  _lastViewIndex(): number {
    const lastView = this._lastView();
    return lastView === null ? -1 : lastView.overrideContext.$index;
  }

  /**
   * Observer for detecting changes on scroller element for proper recalculation
   * @internal
   */
  _resizeObserver: ResizeObserver;
  /**
   * Cache of last calculated height for signaling recalculation
   * @internal
   */
  _lastScrollerHeight: number;

  /**
   * @internal Calculate the necessary initial heights. Including:
   *
   * - item height
   * - scroll container height
   * - number of elements in view port
   * - first item index
   * - top/bottom buffers' height
   */
  _calcInitialHeights(itemsLength: number, force?: boolean): void {
    // there is no point doing any calculation if it's not in the live document
    // as nothing will have correct height
    if (!this._isAttached || !document.body.contains(this.element)) {
      return;
    }
    const isSameLength = this._viewsLength > 0 && this._prevItemsCount === itemsLength;
    if (isSameLength && !force) {
      return;
    }
    if (itemsLength < 1) {
      this._resetCalculation();
      return;
    }
    const firstViewElement = this.view(0).lastChild as Element;
    const itemHeight = this.itemHeight = calcOuterHeight(firstViewElement);
    if (itemHeight <= 0) {
      const global = PLATFORM.global;
      this._sizeInterval = global.setInterval(() => {
        const newCalcSize = calcOuterHeight(firstViewElement);
        if (newCalcSize > 0) {
          global.clearInterval(this._sizeInterval);
          this.itemsChanged();
        }
      }, 500);
      return;
    }

    this._prevItemsCount = itemsLength;
    const isFixedHeightContainer = this._fixedHeightContainer;
    const scrollerEl = isFixedHeightContainer ? this.scrollerEl : document.documentElement;
    const scroll_el_height = isFixedHeightContainer
      ? calcScrollHeight(scrollerEl)
      : document.documentElement.clientHeight;
    const elementsInView = this.elementsInView = Math$floor(scroll_el_height / itemHeight) + 1;
    const viewsCount = this._viewsLength = elementsInView * 2;

    // const ResizeObserverConstructor = getResizeObserverClass();
    // if (typeof ResizeObserverConstructor === 'function') {
    //   let observer = this._resizeObserver;
    //   if (observer) {
    //     observer.disconnect();
    //   }
    //   this._lastScrollerHeight = scroll_el_height;
    //   observer = this._resizeObserver = new ResizeObserverConstructor(() => {
    //     console.log('resize observer hit');
    //     requestAnimationFrame(() => {
    //       const newScrollHeight = calcScrollHeight(scrollerEl);
    //       // console.log({ newScrollHeight, last: this._lastScrollerHeight });
    //       if (newScrollHeight !== this._lastScrollerHeight) {
    //         this._lastScrollerHeight = newScrollHeight;
    //         const elementsInView = this.elementsInView = Math$floor(newScrollHeight / itemHeight) + 1;
    //         const viewsCount = this._viewsLength = elementsInView * 2;
    //         this._handleScroll();
    //         // if (this.items) {
    //         //   this._calcInitialHeights(this.items.length, true);
    //         // }
    //         // if (this.items) {
    //         //   this._calcInitialHeights(this.items.length, true);
    //         // }
    //         // requestAnimationFrame(() => this.itemsChanged());
    //         // this.itemsChanged();
    //       }
    //     });
    //   });
    //   observer.observe(scrollerEl);
    // }

    // Look at top buffer height (how far we've scrolled down)
    // If top buffer height is greater than the new bottom buffer height (how far we *can* scroll down)
    //    Then set top buffer height to max it can be (bottom buffer height - views in length?) and bottom buffer height to 0

    // Calc how much buffer room to the bottom if you were at the top
    // In case of small lists, ensure that we never set the buffer heights to impossible values
    const newBottomBufferHeight = Math$max(0, itemHeight * (itemsLength - viewsCount));

    // Use case when items are removed (we've scrolled past where we can)
    if (this._topBufferHeight >= newBottomBufferHeight) {
      this._topBufferHeight = newBottomBufferHeight;
      this._bottomBufferHeight = 0;
      // In case of small lists, ensure that we never set first to less than possible
      this._first = Math$max(0, itemsLength - viewsCount);
    }
    // Use case when items are added (we are adding scrollable space to the bottom)
    else {
      // We need to re-evaluate which is the true "first". If we've added items, then the previous "first" is actually too far down the list
      const firstIndex = this._firstViewIndex();
      this._first = firstIndex;
      // appropriate buffer height for top, might be 1 too long...
      const adjustedTopBufferHeight = firstIndex * itemHeight;
      this._topBufferHeight = adjustedTopBufferHeight;
      // But what about when we've only scrolled slightly down the list? We need to readjust the top buffer height then
      this._bottomBufferHeight = Math$max(0, newBottomBufferHeight - adjustedTopBufferHeight);
    }
    this._updateBufferElements();
  }

  /**
   * If repeat items is behind a binding behavior or value converter
   * the real array is "inner" part of the expression
   * which should be observed via this method
   * @internal
   */
  _observeInnerCollection(): boolean {
    const items = this._getInnerCollection();
    const strategy = this.strategyLocator.getStrategy(items);
    if (!strategy) {
      return false;
    }
    const collectionObserver = strategy.getCollectionObserver(this.observerLocator, items);
    if (!collectionObserver) {
      return false;
    }
    const context = VirtualRepeatCallContext.handleInnerCollectionMutated;
    this.collectionObserver = collectionObserver;
    this.callContext = context;
    collectionObserver.subscribe(context, this);
    return true;
  }

  /**@internal*/
  _getInnerCollection(): any {
    const expression = unwrapExpression(this.sourceExpression);
    if (!expression) {
      return null;
    }
    return expression.evaluate(this.scope, null);
  }

  /**@internal*/
  _observeCollection(): void {
    const collectionObserver = this.strategy.getCollectionObserver(this.observerLocator, this.items);
    if (collectionObserver) {
      this.callContext = VirtualRepeatCallContext.handleCollectionMutated;
      this.collectionObserver = collectionObserver;
      collectionObserver.subscribe(this.callContext, this);
    }
  }

  // @override AbstractRepeater
  // How will these behaviors need to change since we are in a virtual list instead?
  /**@override */
  viewCount(): number {
    return this.viewSlot.children.length;
  }

  /**@override */
  views(): IView[] {
    return this.viewSlot.children;
  }

  /**@override */
  view(index: number): IView | null {
    const viewSlot = this.viewSlot;
    return index < 0 || index > viewSlot.children.length - 1 ? null : viewSlot.children[index];
  }

  /**@override */
  addView(bindingContext: any, overrideContext: OverrideContext): IView {
    const view = this.viewFactory.create();
    view.bind(bindingContext, overrideContext);
    this.viewSlot.add(view);
    return view as IView;
  }

  /**@override */
  insertView(index: number, bindingContext: any, overrideContext: OverrideContext): void {
    const view = this.viewFactory.create();
    view.bind(bindingContext, overrideContext);
    this.viewSlot.insert(index, view);
  }

  /**@override */
  removeAllViews(returnToCache: boolean, skipAnimation: boolean): void | Promise<void> {
    return this.viewSlot.removeAll(returnToCache, skipAnimation);
  }

  /**@override */
  removeView(index: number, returnToCache: boolean, skipAnimation: boolean): IView | Promise<IView> {
    return this.viewSlot.removeAt(index, returnToCache, skipAnimation) as IView | Promise<IView>;
  }

  updateBindings(view: IView): void {
    const bindings = view.bindings;
    let j = bindings.length;
    while (j--) {
      updateOneTimeBinding(bindings[j]);
    }
    const controllers = view.controllers;
    j = controllers.length;
    while (j--) {
      const boundProperties = controllers[j].boundProperties;
      let k = boundProperties.length;
      while (k--) {
        let binding = boundProperties[k].binding;
        updateOneTimeBinding(binding);
      }
    }
  }
}

const $minus = (index: number, i: number) => index - i;
const $plus = (index: number, i: number) => index + i;
