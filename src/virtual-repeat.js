import {inject} from 'aurelia-dependency-injection';
import {ObserverLocator, calcSplices, getChangeRecords, createOverrideContext} from 'aurelia-binding';
import {BoundViewFactory, ViewSlot, customAttribute, bindable, templateController} from 'aurelia-templating';
import {updateOverrideContext, createFullOverrideContext, updateOverrideContexts} from 'aurelia-templating-resources/repeat-utilities';
import {ScrollHandler} from './scroll-handler';
import {calcScrollHeight, calcOuterHeight, getNthNode, moveViewFirst, moveViewLast} from './utilities';

@customAttribute('virtual-repeat')
@templateController
@inject(Element, BoundViewFactory, ViewSlot, ObserverLocator, ScrollHandler)
export class VirtualRepeat {
  @bindable items
  @bindable local
  constructor(element, viewFactory, viewSlot, observerLocator, scrollHandler){
    this.element = element;
    this.viewFactory = viewFactory;
    this.viewSlot = viewSlot;
    this.observerLocator = observerLocator;
    this.scrollHandler = scrollHandler;
    this.local = 'item';
    this.useEase = false;
    this.targetY = 0;
    this.currentY = 0;
    this.previousY = 0;
    this.first = 0;
    this.previousFirst = 0;
    this.numberOfDomElements = 0;
    this.indicatorMinHeight = 15;
  }

  bind(bindingContext, overrideContext){
    this.scope = { bindingContext, overrideContext };
    this.virtualScrollInner = this.element.parentNode;
    this.virtualScroll = this.virtualScrollInner.parentElement;
    this.createScrollIndicator();
    this.virtualScroll.style.overflow = 'hidden';
    this.virtualScroll.tabIndex = '-1';

    this.virtualScroll.addEventListener('touchmove', function(e) { e.preventDefault(); });

    this.scrollHandler.initialize(this.virtualScroll,  (deltaY, useEase) => {
      this.useEase = useEase;
      this.targetY += deltaY;
      this.targetY = Math.max(-this.scrollViewHeight, this.targetY);
      this.targetY = Math.min(0, this.targetY);
      return this.targetY;
    });

    // TODO Fix this
    window.onresize = () => { this.handleContainerResize(); };

    // create first item to get the heights
    var overrideContext = createFullOverrideContext(this, this.items[0], 0, 1);
    var view = this.viewFactory.create();
    view.bind(overrideContext.bindingContext, overrideContext);
    this.viewSlot.add(view);
  }

  unbind(){
    this.scrollHandler.dispose();

    if(this.disposeSubscription){
      this.disposeSubscription();
      this.disposeSubscription = null;
    }

    // TODO Null out properties
  }

  attached(){
    var items = this.items,
      observer, overrideContext, view, node;

    this.listItems = this.virtualScrollInner.children;
    this.itemHeight = calcOuterHeight(this.listItems[0]);
    this.virtualScrollHeight = calcScrollHeight(this.virtualScroll);
    this.numberOfDomElements = Math.ceil(this.virtualScrollHeight / this.itemHeight) + 1;

    for(var i = 1, ii = this.numberOfDomElements; i < ii; ++i){
      overrideContext = createFullOverrideContext(this, this.items[i], i, ii);
      view = this.viewFactory.create();
      view.bind(overrideContext.bindingContext, overrideContext);
      this.viewSlot.add(view);
    }

    this.calcScrollViewHeight();
    this.calcIndicatorHeight();

    observer = this.observerLocator.getArrayObserver(items);

    for(i = 0, ii = this.virtualScrollInner.children.length; i < ii; ++i){
      node  = this.virtualScrollInner.children[i];
      // fix weird rendering behavior in Chrome on some Android devices
      node.style['-webkit-backface-visibility'] = 'hidden';
    }

    this.disposeSubscription = observer.subscribe(splices => {
      this.instanceMutated(items, splices);
    });

    this.scroll();
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

    this.calcScrollViewHeight();
  }

  scroll() {
    var scrollView = this.virtualScrollInner,
      childNodes = scrollView.childNodes,
      itemHeight = this.itemHeight,
      items = this.items,
      viewSlot = this.viewSlot,
      numberOfDomElements =  this.numberOfDomElements,
      ease = this.useEase ? 0.1 : 1,
      element, viewStart, viewEnd, marginTop, translateStyle, view, first;

    this.currentY += (this.targetY - this.currentY) * ease;
    this.currentY = Math.round(this.currentY);

    if(this.currentY === this.previousY){
      requestAnimationFrame(() => this.scroll());
      return;
    }

    this.previousY = this.currentY;
    this.first = Math.ceil(this.currentY / itemHeight) * -1;
    first = this.first;

    if(first > this.previousFirst && first + numberOfDomElements - 1 <= items.length){
      this.previousFirst = first;

      view = viewSlot.children[0];
      updateOverrideContext(view.overrideContext, first + numberOfDomElements - 1, items.length);
      view.bindingContext[this.local] = items[first + numberOfDomElements - 1];
      viewSlot.children.push(viewSlot.children.shift());

      moveViewLast(view, scrollView, numberOfDomElements);

      marginTop = itemHeight * first + "px";
      scrollView.style.marginTop = marginTop;
    }else if (first < this.previousFirst){
      this.previousFirst = first;

      view = viewSlot.children[numberOfDomElements - 1];
      if(view) {
        view.bindingContext[this.local] = items[first];
        updateOverrideContext(view.overrideContext, first, items.length);
        viewSlot.children.unshift(viewSlot.children.splice(-1,1)[0]);

        moveViewFirst(view, scrollView);

        marginTop = itemHeight * first + "px";
        scrollView.style.marginTop = marginTop;
      }
    }

    translateStyle = "translate3d(0px," + this.currentY + "px,0px)";
    scrollView.style.webkitTransform = translateStyle;
    scrollView.style.msTransform = translateStyle;
    scrollView.style.transform = translateStyle;

    // TODO make scroll indicator optional
    this.scrollIndicator();
    requestAnimationFrame(() => this.scroll());
  }

  scrollIndicator(){
    var scrolledPercentage, indicatorTranslateStyle;

    scrolledPercentage = (-this.currentY) / ((this.items.length * this.itemHeight) - this.virtualScrollHeight);
    this.indicatorY = (this.virtualScrollHeight - this.indicatorHeight) * scrolledPercentage;

    indicatorTranslateStyle = "translate3d(0px," + this.indicatorY  + "px,0px)";
    this.indicator.style.webkitTransform = indicatorTranslateStyle;
    this.indicator.style.msTransform = indicatorTranslateStyle;
    this.indicator.style.transform = indicatorTranslateStyle;
  }

  instanceMutated(array, splices) {
    let removeDelta = 0;
    let viewSlot = this.viewSlot;
    let rmPromises = [];

    for (let i = 0, ii = splices.length; i < ii; ++i) {
      let splice = splices[i];
      let removed = splice.removed;

      if (this._isIndexInDom(splice.index)) {
        for (let j = 0, jj = removed.length; j < jj; ++j) {
          let viewOrPromise = viewSlot.removeAt(splice.index + removeDelta + rmPromises.length, true);

          // TODO Create view without trigger view lifecycle
          let length = viewSlot.children.length;
          let overrideContext = createFullOverrideContext(this, this.items[length], length, this.items.length);
          let view = this.viewFactory.create();
          view.bind(overrideContext.bindingContext, overrideContext);
          this.viewSlot.isAttached = false;
          this.viewSlot.add(view);
          this.viewSlot.isAttached = true;

          if (viewOrPromise instanceof Promise) {
            rmPromises.push(viewOrPromise);
          }
        }
        removeDelta -= splice.addedCount;
      }
    }

    if (rmPromises.length > 0) {
      Promise.all(rmPromises).then(() => {
        this._handleAddedSplices(array, splices);
        this._updateViews(array, splices);
        this._updateSizes();
      });
    } else {
      this._handleAddedSplices(array, splices);
      this._updateViews(array, splices);
      this._updateSizes();
    }
  }

  _handleAddedSplices(array, splices) {
    let spliceIndex;
    let spliceIndexLow;
    let arrayLength = array.length;
    let viewSlot = this.viewSlot;

    for (let i = 0, ii = splices.length; i < ii; ++i) {
      let splice = splices[i];
      let addIndex = spliceIndex = splice.index;
      let end = splice.index + splice.addedCount;

      if (this._isIndexInDom(spliceIndex)) {
        for (; addIndex < end; ++addIndex) {
          let overrideContext = createFullOverrideContext(this, array[addIndex], addIndex, arrayLength);
          let view = this.viewFactory.create();
          view.bind(overrideContext.bindingContext, overrideContext);
          this.viewSlot.insert(addIndex, view);

          // TODO Remove view without trigger view lifecycle
          viewSlot.removeAt(0, true, true);
        }
      }
    }
  }

  _isIndexInDom(index: number) {
    let viewSlot = this.viewSlot;
    let indexLow = viewSlot.children[0].overrideContext.$index;
    let indexHi = viewSlot.children[viewSlot.children.length - 1].overrideContext.$index;

    return index >= indexLow && index <= indexHi;
  }

  _updateSizes() {
    this.calcScrollViewHeight();
    this.calcIndicatorHeight();
    this.scrollIndicator();
  }

  _updateViews(items, splices) {
    var numberOfDomElements = this.numberOfDomElements,
      viewSlot = this.viewSlot,
      first = this.first,
      totalAdded = 0,
      view, i, ii, j, marginTop, addIndex, splice, end, atBottom;
    this.items = items;

    for(i = 0, ii = viewSlot.children.length; i < ii; ++i){
      view = viewSlot.children[i];
      view.bindingContext[this.local] = items[this.first + i];
      updateOverrideContext(view.overrideContext, this.first + i, items.length);
    }

    for(i = 0, ii = splices.length; i < ii; ++i){
      splice = splices[0];
      addIndex = splices[i].index;
      end = splice.index + splice.addedCount;
      totalAdded += splice.addedCount;

      for (; addIndex < end; ++addIndex) {
        if(addIndex < first + numberOfDomElements && !atBottom){
          marginTop = this.itemHeight * first + "px";
          this.virtualScrollInner.style.marginTop = marginTop;
        }
      }
    }

    if(items.length < numberOfDomElements){
      var limit = numberOfDomElements - (numberOfDomElements - items.length) - 1;
      for(j = 0; j < numberOfDomElements; ++j){
        this.virtualScrollInner.children[j].style.display = j >= limit ? 'none' : 'block';
      }
    }

    this.calcScrollViewHeight();
    this.calcIndicatorHeight();
    this.scrollIndicator();
  }

  calcScrollViewHeight(){
    this.scrollViewHeight = (this.items.length * this.itemHeight) - this.virtualScrollHeight;
  }

  calcIndicatorHeight(){
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

  createScrollIndicator(){
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
}
