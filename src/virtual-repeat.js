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
import {ScrollHandler} from './scroll-handler';
import {
  calcScrollHeight,
  calcOuterHeight,
  getNthNode,
  moveViewFirst,
  moveViewLast
} from './utilities';
import {VirtualRepeatStrategyLocator} from './virtual-repeat-strategy-locator';
import {DomStrategyLocator} from './dom-strategy';

@customAttribute('virtual-repeat')
@templateController
@inject(Element, BoundViewFactory, TargetInstruction, ViewSlot, ObserverLocator, ScrollHandler, VirtualRepeatStrategyLocator, DomStrategyLocator)
export class VirtualRepeat {
  @bindable items
  @bindable local
  constructor(element, viewFactory, instruction, viewSlot, observerLocator, scrollHandler, strategyLocator, domStrategyLocator){
    this.element = element;
    this.viewFactory = viewFactory;
    this.instruction = instruction;
    this.viewSlot = viewSlot;
    this.observerLocator = observerLocator;
    this.scrollHandler = scrollHandler;
    this.strategyLocator = strategyLocator;
    this.domStrategyLocator = domStrategyLocator;
    this.local = 'item';
    this.useEase = false;
    this.targetY = 0;
    this.currentY = 0;
    this.previousY = 0;
    this.first = 0;
    this.previousFirst = 0;
    this.numberOfDomElements = 0;
    this.indicatorMinHeight = 15;
    this.sourceExpression = getItemsSourceExpression(this.instruction, 'virtual-repeat.for');
    this.isOneTime = isOneTime(this.sourceExpression);
    this.viewsRequireLifecycle = viewsRequireLifecycle(viewFactory);
  }

  attached(){
    this.isAttached = true;

    let element = this.element;

    this.domStrategy = this.domStrategyLocator.getStrategy(element);
    this.virtualScrollInner = this.domStrategy.getScrollElement(element);

    this.virtualScroll = this.domStrategy.getWrapperElement(element);
    this.virtualScroll.style.overflow = 'hidden';
    this.virtualScroll.tabIndex = '-1';

    this.scrollHandler.initialize(this.virtualScroll,  (deltaY, useEase) => {
      this.useEase = useEase;
      this.targetY += deltaY;
      this.targetY = Math.max(-this.scrollViewHeight, this.targetY);
      this.targetY = Math.min(0, this.targetY);
      return this.targetY;
    });

    this.itemsChanged();
    this.scroll();
  }

  bind(bindingContext, overrideContext){
    this.scope = { bindingContext, overrideContext };

    // TODO Fix this
    window.onresize = () => { this.handleContainerResize(); };
  }

  call(context, changes) {
    this[context](this.items, changes);
  }

  detached() {
    this.isAttached = false;
    this._removeScrollIndicator();
    this.virtualScrollInner = null;
    this.virtualScroll = null;
    this.numberOfDomElements = null;
    this.virtualScrollHeight = null;
    this.targetY = null;
    this.previousY = null;
    this.itemHeight = null;
    this.first = null;
    this.previousFirst = null;
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

    this._createScrollIndicator();

    let items = this.items;
    this.strategy = this.strategyLocator.getStrategy(items);
    this.strategy.createFirstItem(this);
    this._calcInitialHeights();

    if (!this.isOneTime && !this._observeInnerCollection()) {
      this._observeCollection();
    }

    this.strategy.instanceChanged(this, items, this.numberOfDomElements);
    this._calcScrollViewHeight();
    this._calcIndicatorHeight();
  }

  unbind(){
    this.scope = null;
    this.items = null;
  }

  handleContainerResize(){
    var children = this.viewSlot.children,
      childrenLength = children.length,
      overrideContext, view, addIndex;

    this.virtualScrollHeight = calcScrollHeight(this.virtualScroll);
    this.numberOfDomElements = Math.ceil(this.virtualScrollHeight / this.itemHeight) + 1;

    if(this.numberOfDomElements > childrenLength){
      addIndex = children[childrenLength - 1].overrideContext.$index + 1;
      overrideContext = createFullOverrideContext(this, this.items[addIndex], addIndex, this.items.length);
      view = this.viewFactory.create();
      view.bind(overrideContext.bindingContext, overrideContext);
      this.viewSlot.insert(childrenLength, view);
    }else if (this.numberOfDomElements < childrenLength){
      this.numberOfDomElements = childrenLength;
    }

    this._calcScrollViewHeight();
  }

  scroll() {
    if (this.isAttached === false) {
      return;
    }

    let itemHeight = this.itemHeight;
    let items = this.items;
    let ease = this.useEase ? 0.1 : 1;
    let first;

    this.currentY += (this.targetY - this.currentY) * ease;
    this.currentY = Math.round(this.currentY);

    if(this.currentY === this.previousY){
      requestAnimationFrame(() => this.scroll());
      return;
    }
    this.previousY = this.currentY;
    first = this.first = Math.ceil(this.currentY / itemHeight) * -1;

    if (this._isScrollingDown(first, this.previousFirst, items)){
      if ((first - this.previousFirst) > 1) {
        first = this.first = this.previousFirst + 1;
        this.currentY = this.currentY + itemHeight;
      }
      this.previousFirst = first;
      this._rebindAndMoveToBottom();
    } else if (this._isScrollingUp(first, this.previousFirst)){
      if ((this.previousFirst - first) > 1) {
        first = this.first = this.previousFirst - 1;
        this.currentY = this.currentY - itemHeight;
      }
      this.previousFirst = first;
      this._rebindAndMoveToTop();
    }

    this._animateViews();
    this.scrollIndicator();
    requestAnimationFrame(() => this.scroll());
  }

  scrollIndicator(){
    if (!this.indicator) {
      return;
    }

    var scrolledPercentage, indicatorTranslateStyle;

    scrolledPercentage = -this.currentY / (this.items.length * this.itemHeight - this.virtualScrollHeight);
    this.indicatorY = (this.virtualScrollHeight - this.indicatorHeight) * scrolledPercentage;

    indicatorTranslateStyle = "translate3d(0px," + this.indicatorY + "px,0px)";
    this.indicator.style.webkitTransform = indicatorTranslateStyle;
    this.indicator.style.msTransform = indicatorTranslateStyle;
    this.indicator.style.transform = indicatorTranslateStyle;
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

  _animateViews() {
    let translateStyle = "translate3d(0px," + this.currentY + "px,0px)";
    let virtualScrollInner = this.virtualScrollInner;
    virtualScrollInner.style.webkitTransform = translateStyle;
    virtualScrollInner.style.msTransform = translateStyle;
    virtualScrollInner.style.transform = translateStyle;
  }

  _isScrollingDown(first, previousFirst, items) {
     return first > previousFirst && first + this.viewSlot.children.length - 1 <= items.length
  }

  _isScrollingUp(first, previousFirst) {
    return first < previousFirst;
  }

  _unsubscribeCollection() {
    if (this.collectionObserver) {
      this.collectionObserver.unsubscribe(this.callContext, this);
      this.collectionObserver = null;
      this.callContext = null;
    }
  }

  _updateSizes() {
    this._calcScrollViewHeight();
    this._calcIndicatorHeight();
    this.scrollIndicator();
  }

  _calcScrollViewHeight(){
    this.scrollViewHeight = (this.items.length * this.itemHeight) - this.virtualScrollHeight;
  }

  _calcIndicatorHeight(){
    if(!this.indicator) {
      return;
    }

    this.indicatorHeight = this.virtualScrollHeight * (this.virtualScrollHeight / this.scrollViewHeight);
    if(this.indicatorHeight < this.indicatorMinHeight){
      this.indicatorHeight = this.indicatorMinHeight;
    }

    if(this.indicatorHeight >= this.scrollViewHeight){
      this.indicator.style.visibility = 'hidden';
    }else{
      this.indicator.style.visibility = '';
    }

    this.indicator.style.height = this.indicatorHeight + 'px';
  }

  _createScrollIndicator(){
    if(this.indicator) {
      return;
    }
    var indicator;
    indicator = this.indicator = document.createElement('div');

    this.virtualScroll.appendChild(this.indicator);

    indicator.classList.add('au-scroll-indicator');
    indicator.style.backgroundColor = '#cccccc';
    indicator.style.top = '0px';
    indicator.style.right = '5px';
    indicator.style.width = '4px';
    indicator.style.position = 'absolute';
    indicator.style.opacity = '0.6'
  }

  _removeScrollIndicator() {
    if (this.virtualScroll && this.indicator) {
      this.virtualScroll.removeChild(this.indicator);
      this.indicator = null;
    }
  }

  _rebindAndMoveToBottom(){
    let first = this.first;
    let viewSlot = this.viewSlot;
    let childrenLength = viewSlot.children.length;
    let items = this.items;
    let virtualScrollInner = this.virtualScrollInner;
    let view = viewSlot.children[0];
    let index = first + childrenLength - 1;
    updateOverrideContext(view.overrideContext, index, items.length);
    view.bindingContext[this.local] = items[index];
    viewSlot.children.push(viewSlot.children.shift());
    this.domStrategy.moveViewLast(view, virtualScrollInner, childrenLength);
    let marginTop = -this.currentY + "px";
    virtualScrollInner.style.marginTop = marginTop;
  }

  _rebindAndMoveToTop() {
    let first = this.first;
    let viewSlot = this.viewSlot;
    let childrenLength = viewSlot.children.length;
    let items = this.items;
    let virtualScrollInner = this.virtualScrollInner;
    let view = viewSlot.children[childrenLength - 1];
    if(view) {
      view.bindingContext[this.local] = items[first];
      updateOverrideContext(view.overrideContext, first, items.length);
      viewSlot.children.unshift(viewSlot.children.splice(-1,1)[0]);
      this.domStrategy.moveViewFirst(view, virtualScrollInner);
      let marginTop = -this.currentY + "px";
      virtualScrollInner.style.marginTop = marginTop;
    }
  }

  _calcInitialHeights() {
    if (this.numberOfDomElements > 0) {
      return;
    }
    let listItems = this.virtualScrollInner.children;
    this.itemHeight = calcOuterHeight(listItems[0]);
    this.virtualScrollHeight = calcScrollHeight(this.virtualScroll);
    this.numberOfDomElements = Math.ceil(this.virtualScrollHeight / this.itemHeight) + 1;
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
