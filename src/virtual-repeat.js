import {inject} from 'aurelia-dependency-injection';
import {
  ObserverLocator,
  calcSplices,
  getChangeRecords,
  createOverrideContext
} from 'aurelia-binding';
import {
  BoundViewFactory,
  ViewSlot,
  TargetInstruction,
  customAttribute,
  bindable,
  templateController
} from 'aurelia-templating';
import {
  updateOverrideContext,
  createFullOverrideContext,
  updateOverrideContexts,
  getItemsSourceExpression,
  isOneTime,
  unwrapExpression
} from 'aurelia-templating-resources/repeat-utilities';
import {viewsRequireLifecycle} from 'aurelia-templating-resources/analyze-view-factory';
import {
  calcScrollHeight,
  calcOuterHeight,
  getNthNode,
  moveViewFirst,
  moveViewLast
} from './utilities';
import {VirtualRepeatStrategyLocator} from './virtual-repeat-strategy-locator';
import {ViewStrategyLocator} from './view-strategy';

@customAttribute('virtual-repeat')
@templateController
@inject(Element, BoundViewFactory, TargetInstruction, ViewSlot, ObserverLocator, VirtualRepeatStrategyLocator, ViewStrategyLocator)
export class VirtualRepeat {
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

  @bindable items
  @bindable local
  constructor(element, viewFactory, instruction, viewSlot, observerLocator, strategyLocator, viewStrategyLocator){
    this.element = element;
    this.viewFactory = viewFactory;
    this.instruction = instruction;
    this.viewSlot = viewSlot;
    this.observerLocator = observerLocator;
    this.strategyLocator = strategyLocator;
    this.viewStrategyLocator = viewStrategyLocator;
    this.local = 'item';
    this.sourceExpression = getItemsSourceExpression(this.instruction, 'virtual-repeat.for');
    this.isOneTime = isOneTime(this.sourceExpression);
    this.viewsRequireLifecycle = viewsRequireLifecycle(viewFactory);
  }

  attached(){
    this._isAttached = true;
    let element = this.element;
    this.viewStrategy = this.viewStrategyLocator.getStrategy(element);
    this.scrollList = this.viewStrategy.getScrollList(element);
    this.scrollContainer = this.viewStrategy.getScrollContainer(element);
    this.topBuffer = this.viewStrategy.createTopBufferElement(this.scrollList, element);
    this.bottomBuffer = this.viewStrategy.createBottomBufferElement(this.scrollList, element);
    this.itemsChanged();
    this._handleScroll();
  }

  bind(bindingContext, overrideContext){
    this.scope = { bindingContext, overrideContext };

    // TODO Fix this
    window.onresize = () => { this._handleResize(); };
  }

  call(context, changes) {
    this[context](this.items, changes);
  }

  detached() {
    this.viewStrategy.removeBufferElements(this.scrollList, this.topBuffer, this.bottomBuffer);
    this._isAttached = false;
    this.scrollList = null;
    this.scrollContainer = null;
    this._viewsLength = null;
    this.scrollContainerHeight = null;
    this._first = null;
    this._previousFirst = null;
    this.viewSlot.removeAll(true);
    if(this.scrollHandler) {
      this.scrollHandler.dispose();
    }
    this._unsubscribeCollection();
  }

  itemsChanged() {
    this._unsubscribeCollection();

    // still bound?
    if (!this.scope) {
      return;
    }

    let items = this.items;
    this.strategy = this.strategyLocator.getStrategy(items);
    this.strategy.createFirstItem(this);
    this._calcInitialHeights();

    if (!this.isOneTime && !this._observeInnerCollection()) {
      this._observeCollection();
    }

    this.strategy.instanceChanged(this, items, this._viewsLength);
  }

  unbind(){
    this.scope = null;
    this.items = null;
  }

  handleCollectionMutated(collection, changes) {
    this.strategy.instanceMutated(this, collection, changes);
  }

  handleInnerCollectionMutated(collection, changes) {
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

  _handleScroll() {
    if (!this._isAttached) {
      return;
    }

    let itemHeight = this.itemHeight;
    let scrollTop = this.scrollContainer.scrollTop;
    this._first = Math.floor(scrollTop / itemHeight);
    this._checkScrolling();
    // TODO if and else paths do almost same thing, refactor?
    // move views down?
    if(this._isScrolling && this._scrollingDown && (this._hasScrolledDownTheBuffer() || (this._switchedDirection && this._hasScrolledDownTheBufferFromTop()))) {
      let viewsToMove = this._first - this._lastRebind;
      if(this._switchedDirection) {
        viewsToMove = this.isAtTop ? this._first : this._bufferSize - (this._lastRebind - this._first);
      }
      this.isAtTop = false;
      this._lastRebind = this._first;
      let movedViewsCount = this._moveViews(viewsToMove);
      let adjustHeight = movedViewsCount < viewsToMove ? this._bottomBufferHeight : itemHeight * movedViewsCount;
      this._switchedDirection = false;
      this._topBufferHeight = this._topBufferHeight + adjustHeight;
      this._bottomBufferHeight = this._bottomBufferHeight - adjustHeight;
      if (this._bottomBufferHeight >= 0) {
        this._adjustBufferHeights();
      }
    // move view up?
  } else if (this._isScrolling && this._scrollingUp && (this._hasScrolledUpTheBuffer() || (this._switchedDirection && this._hasScrolledUpTheBufferFromBottom()))) {
      let viewsToMove = this._lastRebind - this._first;
      if(this._switchedDirection) {
          if(this.isLastIndex) {
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

    requestAnimationFrame(() => this._handleScroll());
  }

  _handleResize() {
    var children = this.viewSlot.children,
      childrenLength = children.length,
      overrideContext, view, addIndex;

    this.scrollContainerHeight = calcScrollHeight(this.scrollContainer);
    this._viewsLength = Math.ceil(this.scrollContainerHeight / this.itemHeight) + 1;

    if(this._viewsLength > childrenLength){
      addIndex = children[childrenLength - 1].overrideContext.$index + 1;
      overrideContext = createFullOverrideContext(this, this.items[addIndex], addIndex, this.items.length);
      view = this.viewFactory.create();
      view.bind(overrideContext.bindingContext, overrideContext);
      this.viewSlot.insert(childrenLength, view);
    }else if (this._viewsLength < childrenLength){
      this._viewsLength = childrenLength;
    }
  }

  _checkScrolling() {
    if (this._first > this._previousFirst && (this._bottomBufferHeight > 0 || !this.isLastIndex)) {
      if (!this._scrollingDown) {
        this._scrollingDown = true;
        this._scrollingUp = false;
        this._switchedDirection = true;
      } else {
        this._switchedDirection = false;
      }
      this._isScrolling = true;
    } else if (this._first < this._previousFirst && (this._topBufferHeight >= 0 || !this.isAtTop)) {
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

  _hasScrolledDownTheBuffer() {
    return this._first - this._lastRebind >= this._bufferSize;
  }

  _hasScrolledDownTheBufferFromTop() {
    return this._first - this._bufferSize > 0;
  }

  _hasScrolledUpTheBuffer() {
    return this._lastRebind - this._first >= this._bufferSize;
  }

  _hasScrolledUpTheBufferFromBottom() {
    return this._first + this._bufferSize < this.items.length;
  }

  _adjustBufferHeights() {
    this.topBuffer.setAttribute('style', `height:  ${this._topBufferHeight}px`);
    this.bottomBuffer.setAttribute("style", `height: ${this._bottomBufferHeight}px`);
  }

  _unsubscribeCollection() {
    if (this.collectionObserver) {
      this.collectionObserver.unsubscribe(this.callContext, this);
      this.collectionObserver = null;
      this.callContext = null;
    }
  }

  _moveViews(length) {
    let getNextIndex = this._scrollingDown ? (index, i) =>  index + i : (index, i) =>  index - i;
    let isAtFirstOrLastIndex = () => this._scrollingDown ? this.isLastIndex : this.isAtTop;
    let viewSlot = this.viewSlot;
    let childrenLength = viewSlot.children.length;
    let viewIndex = this._scrollingDown ? 0 : childrenLength - 1;
    let items = this.items;
    let scrollList = this.scrollList;
    let index = this._scrollingDown ? this._getIndexOfLastView() + 1 : this._getIndexOfFirstView() - 1;
    let i = 0;
    while(i < length && !isAtFirstOrLastIndex()) {
      let view = viewSlot.children[viewIndex];
      let nextIndex = getNextIndex(index, i);
      updateOverrideContext(view.overrideContext, nextIndex, items.length);
      view.bindingContext[this.local] = items[nextIndex];
      if(this._scrollingDown) {
        viewSlot.children.push(viewSlot.children.shift());
        this.viewStrategy.moveViewLast(view, scrollList, childrenLength);
        this.isLastIndex = nextIndex >= items.length - 1;
      } else {
        viewSlot.children.unshift(viewSlot.children.splice(-1,1)[0]);
        this.viewStrategy.moveViewFirst(view, scrollList);
        this.isAtTop = nextIndex <= 0;
      }
      i++;
    }
    return length - (length - i);
  }

  _getIndexOfLastView(){
    let children = this.viewSlot.children;
    return children[children.length - 1].overrideContext.$index;
  }


  _getIndexOfFirstView(){
    let children = this.viewSlot.children;
    return children[0].overrideContext.$index;
  }

  _calcInitialHeights() {
    if (this._viewsLength > 0) {
      return;
    }
    let listItems = this.scrollList.children;
    this.itemHeight = calcOuterHeight(listItems[1]);
    this.scrollContainerHeight = calcScrollHeight(this.scrollContainer);
    this.elementsInView = Math.ceil(this.scrollContainerHeight / this.itemHeight) + 1;
    this._viewsLength = (this.elementsInView * 2) + this._bufferSize;
    this._bottomBufferHeight = this.itemHeight * this.items.length - this.itemHeight * this._viewsLength;
    this.bottomBuffer.setAttribute("style", `height: ${this._bottomBufferHeight}px`);
  }

  _observeInnerCollection() {
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

  _getInnerCollection() {
    let expression = unwrapExpression(this.sourceExpression);
    if (!expression) {
      return null;
    }
    return expression.evaluate(this.scope, null);
  }

  _observeCollection() {
    let items = this.items;
    this.collectionObserver = this.strategy.getCollectionObserver(this.observerLocator, items);
    if (this.collectionObserver) {
      this.callContext = 'handleCollectionMutated';
      this.collectionObserver.subscribe(this.callContext, this);
    }
  }
}
