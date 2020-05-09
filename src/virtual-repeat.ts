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
  IStaticResourceConfig,
  ElementEvents
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
import {
  rebindAndMoveView
} from './utilities';
import {
  calcOuterHeight,
  getElementDistanceToTopOfDocument,
  hasOverflowScroll,
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
  IScrollerInfo,
  VirtualizationCalculation,
  VirtualizationEvents,
  IElement,
  IVirtualRepeater,
  ScrollingState
} from './interfaces';
import {
  getResizeObserverClass,
  ResizeObserver,
  DOMRectReadOnly
} from './resize-observer';
import { htmlElement, $raf } from './constants';

const enum VirtualRepeatCallContext {
  handleCollectionMutated = 'handleCollectionMutated',
  handleInnerCollectionMutated = 'handleInnerCollectionMutated'
}

export class VirtualRepeat extends AbstractRepeater implements IVirtualRepeater {

  /**@internal */
  static inject() {
    return [
      DOM.Element,
      BoundViewFactory,
      TargetInstruction,
      ViewSlot,
      ViewResources,
      ObserverLocator,
      VirtualRepeatStrategyLocator,
      TemplateStrategyLocator
    ];
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
   */
  $first: number = 0;

  /**
   * Height of top buffer to properly push the visible rendered list items into right position
   * Usually determined by `_first` visible index * `itemHeight`
   */
  topBufferHeight: number;

  /**
   * Height of bottom buffer to properly push the visible rendered list items into right position
   */
  bottomBufferHeight: number;

  /**@internal*/
  _isAttached = false;

  /**@internal*/
  _ticking = false;

  // /**
  //  * Indicates whether virtual repeat attribute is inside a fixed height container with overflow
  //  *
  //  * This helps identifies place to add scroll event listener
  //  * @internal
  //  */
  // fixedHeightContainer = false;

  /**@internal*/
  _calledGetMore = false;

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


  // Inherited properties declaration
  key: any;
  value: any;

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
  private taskQueue: TaskQueue;

  /**@internal */
  private strategyLocator: VirtualRepeatStrategyLocator;

  /**@internal */
  private templateStrategyLocator: TemplateStrategyLocator;

  /**@internal */
  private sourceExpression: Expression;

  /**@internal */
  private isOneTime: boolean;


  /**
   * Snapshot of current scroller info. Used to determine action against previous scroller info
   * @internal
   */
  _currScrollerInfo: IScrollerInfo;

  /**
   * Reference to scrolling container of this virtual repeat
   * Usually determined by template strategy.
   *
   * The scrolling container may vary based on different position of `virtual-repeat` attribute
   */
  scrollerEl: HTMLElement;

  /**@internal */
  _sizeInterval: any;

  /**
   * When there are no scroller defined, fallback to use `documentElement` as scroller
   * This has implication that distance to top always needs to be recalculated as it can be changed at any time
   * @internal
   */
  _calcDistanceToTopInterval: any;

  /**
   * Defines how many items there should be for a given index to be considered at edge
   */
  edgeDistance: number;

  /**
   * Used to revert all checks related to scroll handling guard
   * Employed for manually blocking scroll handling
   * @internal
   */
  revertScrollCheckGuard: () => void;

  /**
   * Template handling strategy for this repeat.
   */
  templateStrategy: ITemplateStrategy;

  /**
   * Top buffer element, used to reflect the visualization of amount of items `before` the first visible item
   */
  topBufferEl: HTMLElement;

  /**
   * Bot buffer element, used to reflect the visualization of amount of items `after` the first visible item
   */
  bottomBufferEl: HTMLElement;

  /**
   * Height of each item. Calculated based on first item
   */
  itemHeight: number;

  /**
   * Calculate current scrolltop position
   */
  distanceToTop: number;

  /**
   * Number indicating minimum elements required to render to fill up the visible viewport
   */
  minViewsRequired: number;

  /**
   * collection repeating strategy
   */
  strategy: IVirtualRepeatStrategy;

  /**
   * Flags to indicate whether to ignore next mutation handling
   * @internal
   */
  _ignoreMutation: boolean;

  /**
   * Observer for detecting changes on scroller element for proper recalculation
   * @internal
   */
  _scrollerResizeObserver: ResizeObserver;

  /**
   * Cache of last calculated content rect of scroller
   * @internal
   */
  _currScrollerContentRect: DOMRectReadOnly;

  /**
   * Event manager for
   * @internal
   */
  _scrollerEvents: ElementEvents;

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
    this.edgeDistance = 5;
    this.sourceExpression = getItemsSourceExpression(this.instruction, 'virtual-repeat.for');
    this.isOneTime = isOneTime(this.sourceExpression);
    this.topBufferHeight
      = this.bottomBufferHeight
      = this.itemHeight
      = this.distanceToTop
      = 0;
    this.revertScrollCheckGuard = () => {
      this._ticking = false;
    };
    this._onScroll = this._onScroll.bind(this);
  }

  /**@override */
  bind(bindingContext: any, overrideContext: OverrideContext): void {
    this.scope = { bindingContext, overrideContext };
  }

  /**@override */
  attached(): void {
    this._isAttached = true;

    const element = this.element;
    const templateStrategy = this.templateStrategy = this.templateStrategyLocator.getStrategy(element);
    const scrollerEl = this.scrollerEl = templateStrategy.getScrollContainer(element);
    const [topBufferEl, bottomBufferEl] = templateStrategy.createBuffers(element);
    const isFixedHeightContainer = scrollerEl !== htmlElement;
      // this.fixedHeightContainer = hasOverflowScroll(containerEl);
    // context bound listener
    const scrollListener = this._onScroll;

    this.topBufferEl = topBufferEl;
    this.bottomBufferEl = bottomBufferEl;
    this.itemsChanged();
    // take a snapshot of current scrolling information
    this._currScrollerInfo = this.getScrollerInfo();

    if (isFixedHeightContainer) {
      scrollerEl.addEventListener('scroll', scrollListener);
    } else {
      const firstElement = templateStrategy.getFirstElement(topBufferEl, bottomBufferEl);
      this.distanceToTop = firstElement === null ? 0 : getElementDistanceToTopOfDocument(topBufferEl);
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
          const currentScrollerInfo = this.getScrollerInfo();
          const prevScrollerInfo = this._currScrollerInfo;
          this._currScrollerInfo = currentScrollerInfo;
          this._handleScroll(currentScrollerInfo, prevScrollerInfo);
        }
      }, 500);
    }
    this.strategy.onAttached(this);
  }

  /**@override */
  call(context: 'handleCollectionMutated' | 'handleInnerCollectionMutated', changes: ICollectionObserverSplice[]): void {
    this[context](this.items, changes);
  }

  /**@override */
  detached(): void {
    const scrollCt = this.scrollerEl;
    const scrollListener = this._onScroll;
    if (hasOverflowScroll(scrollCt)) {
      scrollCt.removeEventListener('scroll', scrollListener);
    } else {
      DOM.removeEventListener('scroll', scrollListener, false);
    }
    this.unobserveScroller();
    this._currScrollerContentRect = undefined;
    this._isAttached
      // = this.fixedHeightContainer
      = false;
    this._unsubscribeCollection();
    this.resetCalculation();
    this.templateStrategy.removeBuffers(this.element, this.topBufferEl, this.bottomBufferEl);
    this.topBufferEl = this.bottomBufferEl = this.scrollerEl = null;
    this.removeAllViews(/*return to cache?*/true, /*skip animation?*/false);
    const $clearInterval = PLATFORM.global.clearInterval;
    $clearInterval(this._calcDistanceToTopInterval);
    $clearInterval(this._sizeInterval);
    this.distanceToTop
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
    const calculationSignals = strategy.initCalculation(this, items);
    strategy.instanceChanged(this, items, this.$first);

    if (calculationSignals & VirtualizationCalculation.reset) {
      this.resetCalculation();
    }

    // if initial size are non-caclulatable,
    // setup an interval as a naive strategy to observe size
    // this can comes from element is initialy hidden, or 0 height for animation
    // or any other reasons.
    // todo: proper API design for sizing observation
    if ((calculationSignals & VirtualizationCalculation.has_sizing) === 0) {
      const { setInterval: $setInterval, clearInterval: $clearInterval } = PLATFORM.global;
      $clearInterval(this._sizeInterval);
      this._sizeInterval = $setInterval(() => {
        if (this.items) {
          const firstView = this.firstView() || this.strategy.createFirstRow(this);
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

    if (calculationSignals & VirtualizationCalculation.observe_scroller) {
      this.observeScroller(this.scrollerEl);
    }
  }

  /**@override */
  handleCollectionMutated(collection: any[], changes: ICollectionObserverSplice[]): void {
    // guard against multiple mutation, or mutation combined with instance mutation
    if (this._ignoreMutation) {
      return;
    }
    this._handlingMutations = true;
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
    const newItems = this.sourceExpression.evaluate(this.scope, this.lookupFunctions);
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

  enableScroll(): void {
    this._ticking = false;
    this._handlingMutations = false;
    this._skipNextScrollHandle = false;
  }

  /**
   * Get the real scroller element of the DOM tree this repeat resides in
   */
  getScroller(): HTMLElement {
    return this.scrollerEl;
  }

  /**
   * Get scrolling information of the real scroller element of the DOM tree this repeat resides in
   */
  getScrollerInfo(): IScrollerInfo {
    const scroller = this.scrollerEl;
    return {
      scroller: scroller,
      // scrollHeight: scroller.scrollHeight,
      scrollTop: scroller.scrollTop,
      // height: calcScrollHeight(scroller)
      height: scroller === htmlElement
        ? innerHeight
        : calcScrollHeight(scroller)
    };
  }

  resetCalculation(): void {
    this.$first
      // = this._viewsLength
      = this.topBufferHeight
      = this.bottomBufferHeight
      = this.itemHeight
      = this.minViewsRequired = 0;
    this._ignoreMutation
      = this._handlingMutations
      = this._ticking = false;
    this.updateBufferElements(/*skip update?*/true);
  }

  /**@internal*/
  _onScroll(): void {
    const isHandlingMutations = this._handlingMutations;
    if (!this._ticking && !isHandlingMutations) {
      const prevScrollerInfo = this._currScrollerInfo;
      const currentScrollerInfo = this.getScrollerInfo();
      this._currScrollerInfo = currentScrollerInfo;
      this.taskQueue.queueMicroTask(() => {
        this._ticking = false;
        this._handleScroll(currentScrollerInfo, prevScrollerInfo);
      });
      this._ticking = true;
    }

    if (isHandlingMutations) {
      this._handlingMutations = false;
    }
  }

  /**@internal */
  _handleScroll(currentScrollerInfo: IScrollerInfo, prevScrollerInfo: IScrollerInfo): void {
    if (!this._isAttached) {
      return;
    }
    if (this._skipNextScrollHandle) {
      this._skipNextScrollHandle = false;
      return;
    }
    // todo: move this to repeat strategy
    const items = this.items;
    if (!items) {
      return;
    }

    const strategy = this.strategy;
    // todo: use _firstViewIndex()
    const old_range_start_index = this.$first;
    const old_range_end_index = this.lastViewIndex();
    const { 0: new_range_start_index, 1: new_range_end_index } = strategy.getViewRange(this, currentScrollerInfo);

    let scrolling_state: ScrollingState =
      new_range_start_index > old_range_start_index
        ? ScrollingState.isScrollingDown
        : new_range_start_index < old_range_start_index
          ? ScrollingState.isScrollingUp
          : ScrollingState.none;

    // treating scrollbar like an axis, we have a few intersection types for two ranges
    // there are 6 range intersection types (inclusive)
    // range-1: before scroll (old range)
    // range-2: after scroll (new range)
    //
    // 1: scrolling down not but havent reached bot
    // range 1: ====[==============]
    // range-2:     [==============]========
    //
    // 2: scrolling up but havent reached top
    // range-1:        [=======]=========
    // range-2: =======[=======]
    //
    // 3: scrolling down to bottom
    // range-1: =====[============]
    // range-2:      [============]
    //
    // 4: scrolling up to top
    // range-1: [===========]======
    // range-2: [===========]
    //
    // 5: jump
    // range-1: ========
    // range-2:            ==========
    //
    // 6: jump
    // range-1:            ==========
    // range-2: ========

    let didMovedViews = 0;
    let should_call_scroll_next: -1 | 0 | 1 = 0;

    // optimizable case: intersection type 3 & 4
    // nothing needs to be done. Check these 2 cases in advance to group other logic closer
    if (
      // scrolling down and reach bot
      new_range_start_index >= old_range_start_index && old_range_end_index === new_range_end_index
      // scrolling up and reach top
      || new_range_end_index === old_range_end_index && old_range_end_index >= new_range_end_index
    ) {
      // do nothing related to updating view. Whatever is going to be visible was already visible
      // and updated correctly
      //
      // start checking whether scrollnext should be invoked
      // jump down, check if is close to bottom
      if (new_range_start_index >= old_range_start_index && old_range_end_index === new_range_end_index) {
        if (strategy.isNearBottom(this, new_range_end_index)) {
          // should_call_scroll_next = 1;
          scrolling_state |= ScrollingState.isNearBottom;
        }
      }
      // jump up. check if near top
      else if (strategy.isNearTop(this, new_range_start_index)) {
        // should_call_scroll_next = -1;
        scrolling_state |= ScrollingState.isNearTop;
      }
      // todo: fix the issues related to scroll smoothly to bottom not triggering scroll-next
    } else {

      // intersection type 1: scrolling down but haven't reached bot
      // needs to move bottom views from old range (range-2) to new range (range-1)
      if (new_range_start_index > old_range_start_index
        && old_range_end_index >= new_range_start_index
        && new_range_end_index >= old_range_end_index
      ) {
        const views_to_move_count = new_range_start_index - old_range_start_index;
        this._moveViews(views_to_move_count, 1);
        didMovedViews = 1;
        // should_call_scroll_next = 1;
        if (strategy.isNearBottom(this, new_range_end_index)) {
          scrolling_state |= ScrollingState.isNearBottom;
        }
      }
      // intersection type 2: scrolling up but haven't reached top
      // this scenario requires move views from start of old range to end of new range
      else if (old_range_start_index > new_range_start_index
        && old_range_start_index <= new_range_end_index
        && old_range_end_index >= new_range_end_index
      ) {
        const views_to_move_count = old_range_end_index - new_range_end_index;
        this._moveViews(views_to_move_count, -1);
        didMovedViews = 1;
        // should_call_scroll_next = -1;
        if (strategy.isNearTop(this, new_range_start_index)) {
          scrolling_state |= ScrollingState.isNearTop;
        }
      }
      // intersection type 5 and type 6: scrolling with jumping behavior
      // this scenario requires only updating views
      else if (old_range_end_index < new_range_start_index || old_range_start_index > new_range_end_index) {
        strategy.remeasure(this);
        // jump down, check if is close to bottom
        if (old_range_end_index < new_range_start_index) {
          if (strategy.isNearBottom(this, new_range_end_index)) {
            // should_call_scroll_next = 1;
          scrolling_state |= ScrollingState.isNearBottom;
          }
        }
        // jump up. check if near top
        else if (strategy.isNearTop(this, new_range_start_index)) {
          // should_call_scroll_next = -1;
          scrolling_state |= ScrollingState.isNearTop;
        }
      }
      // catch invalid cases
      // these are cases that were not handled properly.
      // If happens, need to fix the above logic related to range check
      else {
        console.warn('Scroll intersection not handled');
        strategy.remeasure(this);
      }
    }

    if (didMovedViews === 1) {
      this.$first = new_range_start_index;
      strategy.updateBuffers(this, new_range_start_index);
    }
    // after updating views
    // check if infinite scrollnext should be invoked
    // the following block cannot be nested inside didMoveViews condition
    // since there could be jumpy scrolling behavior causing infinite scrollnext
    if (
      (scrolling_state & ScrollingState.isScrollingDownAndNearBottom) === ScrollingState.isScrollingDownAndNearBottom
      || (scrolling_state & ScrollingState.isScrollingUpAndNearTop) === ScrollingState.isScrollingUpAndNearTop
      // Are all items in range?
      // when all items are in range, and somehow scroll handle is triggered
      // but the scroll direction couldn't be derived from the view index
      //    (forcefully calling _handleScroll, scrolled too little, browser bug, touchpad sensitivity issues etc...)
      || strategy.count(items) <= this.minViewsRequired * 2
        // then do check further to see if it's appropriate to load more
        // via either:
        // all items in range + not scrolling up + is near bottom
        && ((scrolling_state & ScrollingState.isScrollingUp) === 0
            && (scrolling_state & ScrollingState.isNearBottom) === ScrollingState.isNearBottom
          // or
          // all items in range + not scrolling down + is near top
          || (scrolling_state & ScrollingState.isScrollingDown) === 0
            && (scrolling_state & ScrollingState.isNearTop) === ScrollingState.isNearTop
        )
    ) {
      this.getMore(
        new_range_start_index,
        (scrolling_state & ScrollingState.isNearTop) > 0,
        (scrolling_state & ScrollingState.isNearBottom) > 0
      );
    }
  }

  /**
   * Move views based on scrolling direction and number of views to move
   * Must only be invoked only to move views while scrolling
   * @internal
   */
  _moveViews(viewsCount: number, direction: /*up*/-1 | /*down*/1): void {
    const repeat = this;
    // move to top
    if (direction === -1) {
      let startIndex = repeat.firstViewIndex();
      while (viewsCount--) {
        const view = repeat.lastView();
        rebindAndMoveView(
          repeat,
          view,
          --startIndex,
          /*move to bottom?*/false
        );
      }
    }
    // move to bottom
    else {
      let lastIndex = repeat.lastViewIndex();
      while (viewsCount--) {
        const view = repeat.view(0);
        rebindAndMoveView(
          repeat,
          view,
          ++lastIndex,
          /*move to bottom?*/true
        );
      }
    }
  }

  /**
   * A guard to track time between getMore execution to ensure it's not called too often
   * Make it slightly more than an frame time for 60fps
   * @internal
   */
  _lastGetMore: number = 0;

  getMore(topIndex: number, isNearTop: boolean, isNearBottom: boolean, force?: boolean): void {
    if (isNearTop || isNearBottom || force) {
      // guard against too rapid fire when scrolling towards end/start
      if (!this._calledGetMore) {
        const executeGetMore = (time: number) => {
          if (time - this._lastGetMore < 16) {
            return;
          }
          this._lastGetMore = time;
          this._calledGetMore = true;
          const revertCalledGetMore = () => {
            this._calledGetMore = false;
          };
          const firstView = this.firstView();
          if (firstView === null) {
            revertCalledGetMore();
            return;
          }
          const firstViewElement = firstView.firstChild as IElement;
          const scrollNextAttrName = 'infinite-scroll-next';
          const func: string | (BindingExpression & { sourceExpression: Expression }) =
            firstViewElement
            && firstViewElement.au
            && firstViewElement.au[scrollNextAttrName]
              ? firstViewElement.au[scrollNextAttrName].instruction.attributes[scrollNextAttrName]
              : undefined;

          if (func === undefined) {
            // Still reset `_calledGetMore` flag as if it was invoked
            // though this should not happen as presence of infinite-scroll-next attribute
            // will make the value at least be an empty string
            // keeping this logic here for future enhancement/evolution
            revertCalledGetMore();
          } else {
            const scrollContext: IScrollNextScrollContext = {
              topIndex: topIndex,
              isAtBottom: isNearBottom,
              isAtTop: isNearTop
            };
            const overrideContext = this.scope.overrideContext;
            overrideContext.$scrollContext = scrollContext;
            if (typeof func === 'string') {
              const bindingContext = overrideContext.bindingContext;
              const getMoreFuncName = (firstView.firstChild as Element).getAttribute(scrollNextAttrName);
              const funcCall = bindingContext[getMoreFuncName];

              if (typeof funcCall === 'function') {
                revertCalledGetMore();
                const result = funcCall.call(bindingContext, topIndex, isNearBottom, isNearTop);
                if (result instanceof Promise) {
                  this._calledGetMore = true;
                  return result.then(() => {
                    // Reset for the next time
                    revertCalledGetMore();
                  });
                }
              } else {
                throw new Error(`'${scrollNextAttrName}' must be a function or evaluate to one`);
              }
            } else if (func.sourceExpression) {
              // Reset for the next time
              revertCalledGetMore();
              return func.sourceExpression.evaluate(this.scope);
            } else {
              throw new Error(`'${scrollNextAttrName}' must be a function or evaluate to one`);
            }
          }
        };

        $raf(executeGetMore);
      }
    }
  }

  updateBufferElements(skipUpdate?: boolean): void {
    this.topBufferEl.style.height = `${this.topBufferHeight}px`;
    this.bottomBufferEl.style.height = `${this.bottomBufferHeight}px`;
    if (skipUpdate) {
      this._ticking = true;
      $raf(this.revertScrollCheckGuard);
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

  firstView(): IView | null {
    return this.view(0);
  }

  lastView(): IView | null {
    return this.view(this.viewCount() - 1);
  }

  firstViewIndex(): number {
    const firstView = this.firstView();
    return firstView === null ? -1 : firstView.overrideContext.$index;
  }

  lastViewIndex(): number {
    const lastView = this.lastView();
    return lastView === null ? -1 : lastView.overrideContext.$index;
  }

  /**
   * Observe scroller element to react upon sizing changes
   */
  observeScroller(scrollerEl: HTMLElement): void {
    // using `newRect` paramter to check if this size change handler is still the most recent update
    // only invoke items changed if it is
    // this is to ensure items changed calls are not invoked unncessarily
    const sizeChangeHandler = (newRect: DOMRectReadOnly) => {
      $raf(() => {
        if (newRect === this._currScrollerContentRect) {
          // console.log('3. resize observer handler invoked')
          this.itemsChanged();
        }
      });
    };
    const ResizeObserverConstructor = getResizeObserverClass();
    if (typeof ResizeObserverConstructor === 'function') {
      let observer = this._scrollerResizeObserver;
      if (observer) {
        observer.disconnect();
      }
      // rebuild observer and reobserve scroller el,
      // for might-be-supported feature in future where scroller can be dynamically changed
      observer = this._scrollerResizeObserver = new ResizeObserverConstructor((entries) => {
        const oldRect = this._currScrollerContentRect;
        const newRect = entries[0].contentRect;
        this._currScrollerContentRect = newRect;
        // console.log('1. resize observer hit');
        if (oldRect === undefined || newRect.height !== oldRect.height || newRect.width !== oldRect.width) {
          // console.log('2. resize observer handler queued');
          // passing `newRect` paramter to later check if resize notification is the latest event
          // only invoke items changed if it is
          // this is to ensure items changed calls are not invoked unncessarily
          sizeChangeHandler(newRect);
        }
      });
      observer.observe(scrollerEl);
    }

    // subscribe to selected custom events
    // for manual notification, in case all native strategies fail (no support/buggy browser implementation)
    let elEvents = this._scrollerEvents;
    if (elEvents) {
      elEvents.disposeAll();
    }
    const sizeChangeEventsHandler = () => {
      $raf(() => {
        this.itemsChanged();
      });
    };
    // rebuild element events,
    // for might-be-supported feature in future where scroller can be dynamically changed
    elEvents = this._scrollerEvents = new ElementEvents(scrollerEl);
    elEvents.subscribe(VirtualizationEvents.scrollerSizeChange, sizeChangeEventsHandler, false);
    elEvents.subscribe(VirtualizationEvents.itemSizeChange, sizeChangeEventsHandler, false);
  }

  /**
   * Dispose scroller content size observer, if has
   * Dispose all event listeners related to sizing of scroller, if any
   */
  unobserveScroller(): void {
    const observer = this._scrollerResizeObserver;
    if (observer) {
      observer.disconnect();
    }
    const scrollerEvents = this._scrollerEvents;
    if (scrollerEvents) {
      scrollerEvents.disposeAll();
    }
    this._scrollerResizeObserver
      = this._scrollerEvents = undefined;
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

  /**@override */
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
