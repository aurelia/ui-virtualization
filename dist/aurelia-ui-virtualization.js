import {updateOverrideContext,ArrayRepeatStrategy,createFullOverrideContext,RepeatStrategyLocator,AbstractRepeater,getItemsSourceExpression,isOneTime,unwrapExpression,updateOneTimeBinding,viewsRequireLifecycle} from 'aurelia-templating-resources';
import {DOM} from 'aurelia-pal';
import {inject} from 'aurelia-dependency-injection';
import {ObserverLocator} from 'aurelia-binding';
import {BoundViewFactory,ViewSlot,ViewResources,TargetInstruction,customAttribute,bindable,templateController} from 'aurelia-templating';

export class DomHelper {
  getElementDistanceToTopOfDocument(element: Element): number {
    let box = element.getBoundingClientRect();
    let documentElement = document.documentElement;
    let scrollTop = window.pageYOffset;
    let clientTop = documentElement.clientTop;
    let top  = box.top +  scrollTop - clientTop;
    return  Math.round(top);
  }

  hasOverflowScroll(element: Element): boolean {
    let style = element.style;
    return style.overflowY === 'scroll' || style.overflow === 'scroll' || style.overflowY === 'auto' || style.overflow === 'auto';
  }
}

export function calcOuterHeight(element: Element): number {
  let height;
  height = element.getBoundingClientRect().height;
  height += getStyleValue(element, 'marginTop');
  height += getStyleValue(element, 'marginBottom');
  return height;
}

export function insertBeforeNode(view: View, bottomBuffer: number): void {
  let viewStart = view.firstChild;
  let element = viewStart.nextSibling;
  let viewEnd = view.lastChild;
  let parentElement;

  if (bottomBuffer.parentElement) {
    parentElement = bottomBuffer.parentElement;
  } else if (bottomBuffer.parentNode) {
    parentElement = bottomBuffer.parentNode;
  }

  parentElement.insertBefore(viewEnd, bottomBuffer);
  parentElement.insertBefore(element, viewEnd);
  parentElement.insertBefore(viewStart, element);
}

/**
* Update the override context.
* @param startIndex index in collection where to start updating.
*/
export function updateVirtualOverrideContexts(repeat: VirtualRepeat, startIndex: number): void {
  let views = repeat.viewSlot.children;
  let viewLength = views.length;
  let collectionLength = repeat.items.length;

  if (startIndex > 0) {
    startIndex = startIndex - 1;
  }

  let delta = repeat._topBufferHeight / repeat.itemHeight;

  for (; startIndex < viewLength; ++startIndex) {
    updateOverrideContext(views[startIndex].overrideContext, startIndex + delta, collectionLength);
  }
}

export function rebindAndMoveView(repeat: VirtualRepeat, view: View, index: number, moveToBottom: boolean): void {
  let items = repeat.items;
  let viewSlot = repeat.viewSlot;
  updateOverrideContext(view.overrideContext, index, items.length);
  view.bindingContext[repeat.local] = items[index];
  if (moveToBottom) {
    viewSlot.children.push(viewSlot.children.shift());
    repeat.viewStrategy.moveViewLast(view, repeat.bottomBuffer);
  } else {
    viewSlot.children.unshift(viewSlot.children.splice(-1, 1)[0]);
    repeat.viewStrategy.moveViewFirst(view, repeat.topBuffer);
  }
}

export function getStyleValue(element: Element, style: string): any {
  let currentStyle;
  let styleValue;
  currentStyle = element.currentStyle || window.getComputedStyle(element);
  styleValue = parseInt(currentStyle[style], 10);
  return Number.isNaN(styleValue) ? 0 : styleValue;
}

export function getElementDistanceToBottomViewPort(element: Element): number {
  return document.documentElement.clientHeight - element.getBoundingClientRect().bottom;
}

export function getElementDistanceToTopViewPort(element: Element): number {
  return element.getBoundingClientRect().top;
}

/**
* A strategy for repeating a template over an array.
*/
export class ArrayVirtualRepeatStrategy extends ArrayRepeatStrategy {
  // create first item to calculate the heights
  createFirstItem(repeat: VirtualRepeat): void {
    let overrideContext = createFullOverrideContext(repeat, repeat.items[0], 0, 1);
    repeat.addView(overrideContext.bindingContext, overrideContext);
  }
  /**
  * Handle the repeat's collection instance changing.
  * @param repeat The repeater instance.
  * @param items The new array instance.
  */
  instanceChanged(repeat: VirtualRepeat, items: Array<any>): void {
    this._inPlaceProcessItems(repeat, items);
  }

  _standardProcessInstanceChanged(repeat: VirtualRepeat, items: Array): void {
    for (let i = 1, ii = repeat._viewsLength; i < ii; ++i) {
      let overrideContext = createFullOverrideContext(repeat, items[i], i, ii);
      repeat.addView(overrideContext.bindingContext, overrideContext);
    }
  }

  _inPlaceProcessItems(repeat: VirtualRepeat, items: Array<any>): void {
    let itemsLength = items.length;
    let viewsLength = repeat.viewCount();
    let first = repeat._getIndexOfFirstView();
    // remove unneeded views.
    while (viewsLength > itemsLength) {
      viewsLength--;
      repeat.removeView(viewsLength, true);
    }
    // avoid repeated evaluating the property-getter for the "local" property.
    let local = repeat.local;
    // re-evaluate bindings on existing views.
    for (let i = 0; i < viewsLength; i++) {
      let view = repeat.view(i);
      let last = i === itemsLength - 1;
      let middle = i !== 0 && !last;
      // any changes to the binding context?
      if (view.bindingContext[local] === items[i + first] && view.overrideContext.$middle === middle && view.overrideContext.$last === last) {
        // no changes. continue...
        continue;
      }
      // update the binding context and refresh the bindings.
      view.bindingContext[local] = items[i + first];
      view.overrideContext.$middle = middle;
      view.overrideContext.$last = last;
      repeat.updateBindings(view);
    }
    // add new views
    let minLength = Math.min(repeat._viewsLength, items.length);
    for (let i = viewsLength; i < minLength; i++) {
      let overrideContext = createFullOverrideContext(repeat, items[i], i, itemsLength);
      repeat.addView(overrideContext.bindingContext, overrideContext);
    }
  }

  /**
  * Handle the repeat's collection instance mutating.
  * @param repeat The repeat instance.
  * @param array The modified array.
  * @param splices Records of array changes.
  */
  instanceMutated(repeat: VirtualRepeat, array: Array<any>, splices: any): void {
    this._standardProcessInstanceMutated(repeat, array, splices);
  }

  _standardProcessInstanceMutated(repeat: VirtualRepeat, array: Array<any>, splices: any): void {
    if (repeat.__queuedSplices) {
      for (let i = 0, ii = splices.length; i < ii; ++i) {
        let {index, removed, addedCount} = splices[i];
        mergeSplice(repeat.__queuedSplices, index, removed, addedCount);
      }
      repeat.__array = array.slice(0);
      return;
    }

    let maybePromise = this._runSplices(repeat, array.slice(0), splices);
    if (maybePromise instanceof Promise) {
      let queuedSplices = repeat.__queuedSplices = [];

      let runQueuedSplices = () => {
        if (! queuedSplices.length) {
          delete repeat.__queuedSplices;
          delete repeat.__array;
          return;
        }

        let nextPromise = this._runSplices(repeat, repeat.__array, queuedSplices) || Promise.resolve();
        nextPromise.then(runQueuedSplices);
      };

      maybePromise.then(runQueuedSplices);
    }
  }

  _runSplices(repeat: VirtualRepeat, array: Array, splices: any): any {
    let removeDelta = 0;
    let rmPromises = [];

    for (let i = 0, ii = splices.length; i < ii; ++i) {
      let splice = splices[i];
      let removed = splice.removed;
      let removedLength = removed.length;
      for (let j = 0, jj = removedLength; j < jj; ++j) {
        let viewOrPromise = this._removeViewAt(repeat, splice.index + removeDelta + rmPromises.length, true, j, removedLength);
        if (viewOrPromise instanceof Promise) {
          rmPromises.push(viewOrPromise);
        }
      }
      removeDelta -= splice.addedCount;
    }

    if (rmPromises.length > 0) {
      return Promise.all(rmPromises).then(() => {
        this._handleAddedSplices(repeat, array, splices);
        updateVirtualOverrideContexts(repeat, 0);
      });
    }
    this._handleAddedSplices(repeat, array, splices);
    updateVirtualOverrideContexts(repeat, 0);
  }

  _removeViewAt(repeat: VirtualRepeat, collectionIndex: number, returnToCache: boolean, j: number, removedLength: number): any {
    let viewOrPromise;
    let view;
    let viewSlot = repeat.viewSlot;
    let viewCount = repeat.viewCount();
    let viewAddIndex;
    let removeMoreThanInDom = removedLength > viewCount;
    if (repeat._viewsLength <= j) {
      repeat._bottomBufferHeight = repeat._bottomBufferHeight - (repeat.itemHeight);
      repeat._adjustBufferHeights();
      return;
    }

    // index in view slot?
    if (!this._isIndexBeforeViewSlot(repeat, viewSlot, collectionIndex) && !this._isIndexAfterViewSlot(repeat, viewSlot, collectionIndex)) {
      let viewIndex = this._getViewIndex(repeat, viewSlot, collectionIndex);
      viewOrPromise = repeat.removeView(viewIndex, returnToCache);
      if (repeat.items.length > viewCount) {
        // TODO: do not trigger view lifecycle here
        let collectionAddIndex;
        if (repeat._bottomBufferHeight > repeat.itemHeight) {
          viewAddIndex = viewCount;
          if (!removeMoreThanInDom) {
            let lastViewItem = repeat._getLastViewItem();
            collectionAddIndex = repeat.items.indexOf(lastViewItem) + 1;
          } else {
            collectionAddIndex = j;
          }
          repeat._bottomBufferHeight = repeat._bottomBufferHeight - (repeat.itemHeight);
        } else if (repeat._topBufferHeight > 0) {
          viewAddIndex = 0;
          collectionAddIndex = repeat._getIndexOfFirstView() - 1;
          repeat._topBufferHeight = repeat._topBufferHeight - (repeat.itemHeight);
        }
        let data = repeat.items[collectionAddIndex];
        if (data) {
          let overrideContext = createFullOverrideContext(repeat, data, collectionAddIndex, repeat.items.length);
          view = repeat.viewFactory.create();
          view.bind(overrideContext.bindingContext, overrideContext);
        }
      }
    } else if (this._isIndexBeforeViewSlot(repeat, viewSlot, collectionIndex)) {
      if (repeat._bottomBufferHeight > 0) {
        repeat._bottomBufferHeight = repeat._bottomBufferHeight - (repeat.itemHeight);
        rebindAndMoveView(repeat, repeat.view(0), repeat.view(0).overrideContext.$index, true);
      } else {
        repeat._topBufferHeight = repeat._topBufferHeight - (repeat.itemHeight);
      }
    } else if (this._isIndexAfterViewSlot(repeat, viewSlot, collectionIndex)) {
      repeat._bottomBufferHeight = repeat._bottomBufferHeight - (repeat.itemHeight);
    }

    if (viewOrPromise instanceof Promise) {
      viewOrPromise.then(() => {
        repeat.viewSlot.insert(viewAddIndex, view);
        repeat._adjustBufferHeights();
      });
    } else if (view) {
      repeat.viewSlot.insert(viewAddIndex, view);
    }
    repeat._adjustBufferHeights();
  }

  _isIndexBeforeViewSlot(repeat: VirtualRepeat, viewSlot: ViewSlot, index: number): number {
    let viewIndex = this._getViewIndex(repeat, viewSlot, index);
    return viewIndex < 0;
  }

  _isIndexAfterViewSlot(repeat: VirtualRepeat, viewSlot: ViewSlot, index: number): number {
    let viewIndex = this._getViewIndex(repeat, viewSlot, index);
    return viewIndex > repeat._viewsLength - 1;
  }

  _getViewIndex(repeat: VirtualRepeat, viewSlot: ViewSlot, index: number): number {
    if (repeat.viewCount() === 0) {
      return -1;
    }

    let topBufferItems = repeat._topBufferHeight / repeat.itemHeight;
    return index - topBufferItems;
  }

  _handleAddedSplices(repeat: VirtualRepeat, array: Array<any>, splices: any): void {
    let arrayLength = array.length;
    let viewSlot = repeat.viewSlot;
    for (let i = 0, ii = splices.length; i < ii; ++i) {
      let splice = splices[i];
      let addIndex = splice.index;
      let end = splice.index + splice.addedCount;
      for (; addIndex < end; ++addIndex) {
        let hasDistanceToBottomViewPort = getElementDistanceToBottomViewPort(repeat.viewStrategy.getLastElement(repeat.bottomBuffer)) > 0;
        if (repeat.viewCount() === 0 || (!this._isIndexBeforeViewSlot(repeat, viewSlot, addIndex) && !this._isIndexAfterViewSlot(repeat, viewSlot, addIndex)) || hasDistanceToBottomViewPort)  {
          let overrideContext = createFullOverrideContext(repeat, array[addIndex], addIndex, arrayLength);
          repeat.insertView(addIndex, overrideContext.bindingContext, overrideContext);
          if (!repeat._hasCalculatedSizes) {
            repeat._calcInitialHeights(1);
          } else if (repeat.viewCount() > repeat._viewsLength) {
            if (hasDistanceToBottomViewPort) {
              repeat.removeView(0, true, true);
              repeat._topBufferHeight = repeat._topBufferHeight + repeat.itemHeight;
              repeat._adjustBufferHeights();
            } else {
              repeat.removeView(repeat.viewCount() - 1, true, true);
              repeat._bottomBufferHeight = repeat._bottomBufferHeight + repeat.itemHeight;
            }
          }
        } else if (this._isIndexBeforeViewSlot(repeat, viewSlot, addIndex)) {
          repeat._topBufferHeight = repeat._topBufferHeight + repeat.itemHeight;
        } else if (this._isIndexAfterViewSlot(repeat, viewSlot, addIndex)) {
          repeat._bottomBufferHeight = repeat._bottomBufferHeight + repeat.itemHeight;
          repeat.isLastIndex = false;
        }
      }
    }
    repeat._adjustBufferHeights();
  }
}

interface ViewStrategy {
  getScrollContainer(element: Element): Element;
  moveViewFirst(view: View, topBuffer: Element): void;
  moveViewLast(view: View, bottomBuffer: Element): void;
  createTopBufferElement(element: Element): Element;
  createBottomBufferElement(element: Element): Element;
  removeBufferElements(element: Element, topBuffer: Element, bottomBuffer: Element): void;
  getFirstElement(topBuffer: Element): Element;
  getLastView(bottomBuffer: Element): Element;
}

export class ViewStrategyLocator {
  getStrategy(element: Element): ViewStrategy {
    if (element.parentNode && element.parentNode.localName === 'tbody') {
      return new TableStrategy();
    }
    return new DefaultViewStrategy();
  }
}

export class TableStrategy {
  tableCssReset = '\
    display: block;\
    width: auto;\
    height: auto;\
    margin: 0;\
    padding: 0;\
    border: none;\
    border-collapse: inherit;\
    border-spacing: 0;\
    background-color: transparent;\
    -webkit-border-horizontal-spacing: 0;\
    -webkit-border-vertical-spacing: 0;';

  getScrollContainer(element: Element): Element {
    return element.parentNode;
  }

  moveViewFirst(view: View, topBuffer: Element): void {
    insertBeforeNode(view, DOM.nextElementSibling(topBuffer.parentNode).previousSibling);
  }

  moveViewLast(view: View, bottomBuffer: Element): void {
    insertBeforeNode(view, bottomBuffer.parentNode);
  }

  createTopBufferElement(element: Element): Element {
    let tr = DOM.createElement('tr');
    tr.setAttribute('style', this.tableCssReset);
    let buffer = DOM.createElement('td');
    buffer.setAttribute('style', this.tableCssReset);
    tr.appendChild(buffer);
    element.parentNode.insertBefore(tr, element);
    return buffer;
  }

  createBottomBufferElement(element: Element): Element {
    let tr = DOM.createElement('tr');
    tr.setAttribute('style', this.tableCssReset);
    let buffer = DOM.createElement('td');
    buffer.setAttribute('style', this.tableCssReset);
    tr.appendChild(buffer);
    element.parentNode.insertBefore(tr, element.nextSibling);
    return buffer;
  }

  removeBufferElements(element: Element, topBuffer: Element, bottomBuffer: Element): void {
    element.parentNode.removeChild(topBuffer.parentNode);
    element.parentNode.removeChild(bottomBuffer.parentNode);
  }

  getFirstElement(topBuffer: Element): Element {
    let tr = topBuffer.parentNode;
    return DOM.nextElementSibling(tr);
  }

  getLastElement(bottomBuffer: Element): Element {
    return bottomBuffer.parentNode.previousElementSibling;
  }
}

export class DefaultViewStrategy {
  getScrollContainer(element: Element): Element {
    return element.parentNode;
  }

  moveViewFirst(view: View, topBuffer: Element): void {
    insertBeforeNode(view, DOM.nextElementSibling(topBuffer).previousSibling);
  }

  moveViewLast(view: View, bottomBuffer: Element): void {
    let previousSibling = bottomBuffer.previousSibling;
    let referenceNode = previousSibling.nodeType === 8 && previousSibling.data === 'anchor' ? previousSibling : bottomBuffer;
    insertBeforeNode(view, referenceNode);
  }

  createTopBufferElement(element: Element): Element {
    let elementName = element.parentNode.localName === 'ul' ? 'li' : 'div';
    let buffer = DOM.createElement(elementName);
    element.parentNode.insertBefore(buffer, element);
    return buffer;
  }

  createBottomBufferElement(element: Element): Element {
    let elementName = element.parentNode.localName === 'ul' ? 'li' : 'div';
    let buffer = DOM.createElement(elementName);
    element.parentNode.insertBefore(buffer, element.nextSibling);
    return buffer;
  }

  removeBufferElements(element: Element, topBuffer: Element, bottomBuffer: Element): void {
    element.parentNode.removeChild(topBuffer);
    element.parentNode.removeChild(bottomBuffer);
  }

  getFirstElement(topBuffer: Element): Element {
    return DOM.nextElementSibling(topBuffer);
  }

  getLastElement(bottomBuffer: Element): Element {
    return bottomBuffer.previousElementSibling;
  }
}

export class VirtualRepeatStrategyLocator extends RepeatStrategyLocator {
  constructor() {
    super();
    this.matchers = [];
    this.strategies = [];

    this.addStrategy(items => items instanceof Array, new ArrayVirtualRepeatStrategy());
  }
}

@customAttribute('virtual-repeat')
@templateController
@inject(DOM.Element, BoundViewFactory, TargetInstruction, ViewSlot, ViewResources, ObserverLocator, VirtualRepeatStrategyLocator, ViewStrategyLocator, DomHelper)
export class VirtualRepeat extends AbstractRepeater {
  _first = 0;
  _previousFirst = 0;
  _viewsLength = 0;
  _lastRebind = 0;
  _topBufferHeight = 0;
  _bottomBufferHeight = 0;
  _bufferSize = 5;
  _scrollingDown = false;
  _scrollingUp = false;
  _switchedDirection = false;
  _isAttached = false;
  _ticking = false;
  _fixedHeightContainer = false;
  _hasCalculatedSizes = false;
  _isAtTop = true;

  @bindable items
  @bindable local
  constructor(
    element: Element,
    viewFactory: BoundViewFactory,
    instruction: TargetInstruction,
    viewSlot: ViewSlot,
    viewResources: ViewResources,
    observerLocator: ObserverLocator,
    strategyLocator: VirtualRepeatStrategyLocator,
    viewStrategyLocator: ViewStrategyLocator,
    domHelper: DomHelper) {
    super({
      local: 'item',
      viewsRequireLifecycle: viewsRequireLifecycle(viewFactory)
    });

    this.element = element;
    this.viewFactory = viewFactory;
    this.instruction = instruction;
    this.viewSlot = viewSlot;
    this.lookupFunctions = viewResources.lookupFunctions;
    this.observerLocator = observerLocator;
    this.strategyLocator = strategyLocator;
    this.viewStrategyLocator = viewStrategyLocator;
    this.sourceExpression = getItemsSourceExpression(this.instruction, 'virtual-repeat.for');
    this.isOneTime = isOneTime(this.sourceExpression);
    this.domHelper = domHelper;
  }

  attached(): void {
    this._isAttached = true;
    let element = this.element;
    this._itemsLength = this.items.length;
    this.viewStrategy = this.viewStrategyLocator.getStrategy(element);
    this.scrollContainer = this.viewStrategy.getScrollContainer(element);
    this.topBuffer = this.viewStrategy.createTopBufferElement(element);
    this.bottomBuffer = this.viewStrategy.createBottomBufferElement(element);
    this.itemsChanged();
    this.scrollListener = () => this._onScroll();

    this.calcDistanceToTopInterval = setInterval(() => {
      let distanceToTop = this.distanceToTop;
      this.distanceToTop = this.domHelper.getElementDistanceToTopOfDocument(this.topBuffer);
      if (distanceToTop !== this.distanceToTop) {
        this._handleScroll();
      }
    }, 500);

    this.distanceToTop = this.domHelper.getElementDistanceToTopOfDocument(this.viewStrategy.getFirstElement(this.topBuffer));
    if (this.domHelper.hasOverflowScroll(this.scrollContainer)) {
      this._fixedHeightContainer = true;
      this.scrollContainer.addEventListener('scroll', this.scrollListener);
    } else {
      document.addEventListener('scroll', this.scrollListener);
    }
  }

  bind(bindingContext, overrideContext): void {
    this.scope = { bindingContext, overrideContext };
  }

  call(context, changes): void {
    this[context](this.items, changes);
  }

  detached(): void {
    this.scrollContainer.removeEventListener('scroll', this.scrollListener);
    this._first = 0;
    this._previousFirst = 0;
    this._viewsLength = 0;
    this._lastRebind = 0;
    this._topBufferHeight = 0;
    this._bottomBufferHeight = 0;
    this._scrollingDown = false;
    this._scrollingUp = false;
    this._switchedDirection = false;
    this._isAttached = false;
    this._ticking = false;
    this._hasCalculatedSizes = false;
    this.viewStrategy.removeBufferElements(this.element, this.topBuffer, this.bottomBuffer);
    this.isLastIndex = false;
    this.scrollContainer = null;
    this.scrollContainerHeight = null;
    this.distanceToTop = null;
    this.removeAllViews(true);
    if (this.scrollHandler) {
      this.scrollHandler.dispose();
    }
    this._unsubscribeCollection();
    clearInterval(this.calcDistanceToTopInterval);
  }

  itemsChanged(): void {
    this._unsubscribeCollection();
    // still bound?
    if (!this.scope) {
      return;
    }
    let items = this.items;
    this.strategy = this.strategyLocator.getStrategy(items);
    if (items.length > 0 && this.viewCount() === 0) {
      this.strategy.createFirstItem(this);
    }
    this._calcInitialHeights(items.length);
    if (!this.isOneTime && !this._observeInnerCollection()) {
      this._observeCollection();
    }

    this.strategy.instanceChanged(this, items, this._viewsLength);
  }

  unbind(): void {
    this.scope = null;
    this.items = null;
    this._itemsLength = null;
  }

  handleCollectionMutated(collection, changes): void {
    this._handlingMutations = true;
    this._itemsLength = collection.length;
    this.strategy.instanceMutated(this, collection, changes);
  }

  handleInnerCollectionMutated(collection, changes): void {
    // guard against source expressions that have observable side-effects that could
    // cause an infinite loop- eg a value converter that mutates the source array.
    if (this.ignoreMutation) {
      return;
    }
    this.ignoreMutation = true;
    let newItems = this.sourceExpression.evaluate(this.scope, this.lookupFunctions);
    this.observerLocator.taskQueue.queueMicroTask(() => this.ignoreMutation = false);

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

  _onScroll(): void {
    if (!this._ticking && !this._handlingMutations) {
      requestAnimationFrame(() => this._handleScroll());
      this._ticking = true;
    }

    if (this._handlingMutations) {
      this._handlingMutations = false;
    }
  }

  _handleScroll(): void {
    if (!this._isAttached) {
      return;
    }
    let itemHeight = this.itemHeight;
    let scrollTop = this._fixedHeightContainer ? this.scrollContainer.scrollTop : pageYOffset - this.distanceToTop;
    this._first = Math.floor(scrollTop / itemHeight);
    this._first = this._first < 0 ? 0 : this._first;
    if (this._first > this.items.length - this.elementsInView) {
      this._first = this.items.length - this.elementsInView;
    }
    this._checkScrolling();
    // TODO if and else paths do almost same thing, refactor?
    if (this._scrollingDown) {
      let viewsToMove = this._first - this._lastRebind;
      if (this._switchedDirection) {
        viewsToMove = this._isAtTop ? this._first : this._bufferSize - (this._lastRebind - this._first);
      }
      this._isAtTop = false;
      this._lastRebind = this._first;
      let movedViewsCount = this._moveViews(viewsToMove);
      let adjustHeight = movedViewsCount < viewsToMove ? this._bottomBufferHeight : itemHeight * movedViewsCount;
      this._switchedDirection = false;
      this._topBufferHeight = this._topBufferHeight + adjustHeight;
      this._bottomBufferHeight = this._bottomBufferHeight - adjustHeight;
      if (this._bottomBufferHeight >= 0) {
        this._adjustBufferHeights();
      }
    } else if (this._scrollingUp) {
      let viewsToMove = this._lastRebind - this._first;
      if (this._switchedDirection) {
        if (this.isLastIndex) {
          viewsToMove = this.items.length - this._first - this.elementsInView;
        } else {
          viewsToMove = this._bufferSize - (this._first - this._lastRebind);
        }
      }
      this.isLastIndex = false;
      this._lastRebind = this._first;
      let movedViewsCount = this._moveViews(viewsToMove);
      this.movedViewsCount = movedViewsCount;
      let adjustHeight = movedViewsCount < viewsToMove ? this._topBufferHeight : itemHeight * movedViewsCount;
      this._switchedDirection = false;
      this._topBufferHeight = this._topBufferHeight - adjustHeight;
      this._bottomBufferHeight = this._bottomBufferHeight + adjustHeight;
      if (this._topBufferHeight >= 0) {
        this._adjustBufferHeights();
      }
    }
    this._previousFirst = this._first;

    this._ticking = false;
  }

  _checkScrolling(): void {
    if (this._first > this._previousFirst && (this._bottomBufferHeight > 0 || !this.isLastIndex)) {
      if (!this._scrollingDown) {
        this._scrollingDown = true;
        this._scrollingUp = false;
        this._switchedDirection = true;
      } else {
        this._switchedDirection = false;
      }
      this._isScrolling = true;
    } else if (this._first < this._previousFirst && (this._topBufferHeight >= 0 || !this._isAtTop)) {
      if (!this._scrollingUp) {
        this._scrollingDown = false;
        this._scrollingUp = true;
        this._switchedDirection = true;
      } else {
        this._switchedDirection = false;
      }
      this._isScrolling = true;
    } else {
      this._isScrolling = false;
    }
  }

  _adjustBufferHeights(): void {
    this.topBuffer.style.height = `${this._topBufferHeight}px`;
    this.bottomBuffer.style.height = `${this._bottomBufferHeight}px`;
  }

  _unsubscribeCollection(): void {
    if (this.collectionObserver) {
      this.collectionObserver.unsubscribe(this.callContext, this);
      this.collectionObserver = null;
      this.callContext = null;
    }
  }

  _moveViews(length: number): number {
    let getNextIndex = this._scrollingDown ? (index, i) =>  index + i : (index, i) =>  index - i;
    let isAtFirstOrLastIndex = () => this._scrollingDown ? this.isLastIndex : this._isAtTop;
    let childrenLength = this.viewCount();
    let viewIndex = this._scrollingDown ? 0 : childrenLength - 1;
    let items = this.items;
    let index = this._scrollingDown ? this._getIndexOfLastView() + 1 : this._getIndexOfFirstView() - 1;
    let i = 0;
    let viewToMoveLimit = length - (childrenLength * 2);
    while (i < length && !isAtFirstOrLastIndex()) {
      let view = this.view(viewIndex);
      let nextIndex = getNextIndex(index, i);
      this.isLastIndex = nextIndex >= items.length - 1;
      this._isAtTop = nextIndex <= 0;
      if (!(isAtFirstOrLastIndex() && childrenLength >= items.length)) {
        if (i > viewToMoveLimit) {
          rebindAndMoveView(this, view, nextIndex, this._scrollingDown);
        }
        i++;
      }
    }
    return length - (length - i);
  }

  _getIndexOfLastView(): number {
    const view = this.view(this.viewCount() - 1);
    if (view) {
      return view.overrideContext.$index;
    }

    return -1;
  }

  _getLastViewItem() {
    let children = this.viewSlot.children;
    if (!children.length) {
      return undefined;
    }
    let lastViewItem = children[children.length - 1].bindingContext[this.local];
    return lastViewItem;
  }

  _getIndexOfFirstView(): number {
    return this.view(0) ? this.view(0).overrideContext.$index : -1;
  }

  _calcInitialHeights(itemsLength: number) {
    if (this._viewsLength > 0 && this._itemsLength === itemsLength || itemsLength <= 0) {
      return;
    }
    this._hasCalculatedSizes = true;
    this._itemsLength = itemsLength;
    let firstViewElement = DOM.nextElementSibling(this.view(0).firstChild);
    this.itemHeight = calcOuterHeight(firstViewElement);
    if (this.itemHeight <= 0) {
      throw new Error('Could not calculate item height');
    }
    this.scrollContainerHeight = this._fixedHeightContainer ? this._calcScrollHeight(this.scrollContainer) : document.documentElement.clientHeight;
    this.elementsInView = Math.ceil(this.scrollContainerHeight / this.itemHeight) + 1;
    this._viewsLength = (this.elementsInView * 2) + this._bufferSize;
    this._bottomBufferHeight = this.itemHeight * itemsLength - this.itemHeight * this._viewsLength;
    if (this._bottomBufferHeight < 0) {
      this._bottomBufferHeight = 0;
    }
    this.bottomBuffer.style.height = `${this._bottomBufferHeight}px`;
    this._topBufferHeight = 0;
    this.topBuffer.style.height = `${this._topBufferHeight}px`;
    // TODO This will cause scrolling back to top when swapping collection instances that have different lengths - instead should keep the scroll position
    this.scrollContainer.scrollTop = 0;
    this._first = 0;
  }

  _calcScrollHeight(element: Element): number {
    let height;
    height = element.getBoundingClientRect().height;
    height -= getStyleValue(element, 'borderTopWidth');
    height -= getStyleValue(element, 'borderBottomWidth');
    return height;
  }

  _observeInnerCollection(): boolean {
    let items = this._getInnerCollection();
    let strategy = this.strategyLocator.getStrategy(items);
    if (!strategy) {
      return false;
    }
    this.collectionObserver = strategy.getCollectionObserver(this.observerLocator, items);
    if (!this.collectionObserver) {
      return false;
    }
    this.callContext = 'handleInnerCollectionMutated';
    this.collectionObserver.subscribe(this.callContext, this);
    return true;
  }

  _getInnerCollection(): any {
    let expression = unwrapExpression(this.sourceExpression);
    if (!expression) {
      return null;
    }
    return expression.evaluate(this.scope, null);
  }

  _observeCollection(): void {
    let items = this.items;
    this.collectionObserver = this.strategy.getCollectionObserver(this.observerLocator, items);
    if (this.collectionObserver) {
      this.callContext = 'handleCollectionMutated';
      this.collectionObserver.subscribe(this.callContext, this);
    }
  }

  // @override AbstractRepeater
  viewCount() { return this.viewSlot.children.length; }
  views() { return this.viewSlot.children; }
  view(index) { return this.viewSlot.children[index]; }

  addView(bindingContext, overrideContext) {
    let view = this.viewFactory.create();
    view.bind(bindingContext, overrideContext);
    this.viewSlot.add(view);
  }

  insertView(index, bindingContext, overrideContext) {
    let view = this.viewFactory.create();
    view.bind(bindingContext, overrideContext);
    this.viewSlot.insert(index, view);
  }

  removeAllViews(returnToCache, skipAnimation) {
    return this.viewSlot.removeAll(returnToCache, skipAnimation);
  }

  removeView(index, returnToCache, skipAnimation) {
    return this.viewSlot.removeAt(index, returnToCache, skipAnimation);
  }

  updateBindings(view: View) {
    let j = view.bindings.length;
    while (j--) {
      updateOneTimeBinding(view.bindings[j]);
    }
    j = view.controllers.length;
    while (j--) {
      let k = view.controllers[j].boundProperties.length;
      while (k--) {
        let binding = view.controllers[j].boundProperties[k].binding;
        updateOneTimeBinding(binding);
      }
    }
  }
}
