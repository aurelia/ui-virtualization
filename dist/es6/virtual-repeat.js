import {inject} from 'aurelia-dependency-injection';
import {ObserverLocator, calcSplices, getChangeRecords, createOverrideContext} from 'aurelia-binding';
import {BoundViewFactory, ViewSlot, customAttribute, bindable, templateController} from 'aurelia-templating';
import {ScrollHandler} from './scroll-handler';

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
    this.bindingContext = bindingContext;
    this.overrideContext = overrideContext;
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
    var overrideContext = this.createFullOverrideContext(this.items[0], 0, 1);
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
  }

  attached(){
    var items = this.items,
      observer, overrideContext, view, node;

    this.listItems = this.virtualScrollInner.children;
    this.itemHeight = VirtualRepeat.calcOuterHeight(this.listItems[0]);
    this.virtualScrollHeight = VirtualRepeat.calcScrollHeight(this.virtualScroll);
    this.numberOfDomElements = Math.ceil(this.virtualScrollHeight / this.itemHeight) + 1;

    for(var i = 1, ii = this.numberOfDomElements; i < ii; ++i){
      overrideContext = this.createFullOverrideContext(this.items[i], i, ii);
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
      this.handleSplices(items, splices);
    });

    this.scroll();
  }

  handleContainerResize(){
    var children = this.viewSlot.children,
      childrenLength = children.length,
      overrideContext, view, addIndex;

    this.virtualScrollHeight = VirtualRepeat.calcScrollHeight(this.virtualScroll);
    this.numberOfDomElements = Math.ceil(this.virtualScrollHeight / this.itemHeight) + 1;

    if(this.numberOfDomElements > childrenLength){
      addIndex = children[childrenLength - 1].overrideContext.$index + 1;
      overrideContext = this.createFullOverrideContext(this.items[addIndex], addIndex, this.items.length);
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
      view.overrideContext = this.updateOverrideContext(view.overrideContext, first + numberOfDomElements - 1, items.length);
      view.bindingContext[this.local] = items[first + numberOfDomElements - 1];
      viewSlot.children.push(viewSlot.children.shift());

      viewStart = VirtualRepeat.getNthNode(childNodes, 1, 8);
      element = VirtualRepeat.getNthNode(childNodes, 1, 1);
      viewEnd = VirtualRepeat.getNthNode(childNodes, 2, 8);

      scrollView.insertBefore(viewEnd, scrollView.children[numberOfDomElements]);
      scrollView.insertBefore(element, viewEnd);
      scrollView.insertBefore(viewStart, element);

      marginTop = itemHeight * first + "px";
      scrollView.style.marginTop = marginTop;
    }else if (first < this.previousFirst){
      this.previousFirst = first;

      view = viewSlot.children[numberOfDomElements - 1];
      if(view) {
        view.bindingContext[this.local] = items[first];
        view.overrideContext = this.updateOverrideContext(view.overrideContext, first, items.length);
        viewSlot.children.unshift(viewSlot.children.splice(-1,1)[0]);

        viewStart = VirtualRepeat.getNthNode(childNodes, 1, 8, true);
        element = VirtualRepeat.getNthNode(childNodes, 1, 1, true);
        viewEnd = VirtualRepeat.getNthNode(childNodes, 2, 8, true);

        scrollView.insertBefore(viewEnd, scrollView.childNodes[1]);
        scrollView.insertBefore(element, viewEnd);
        scrollView.insertBefore(viewStart, element);

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

  createBaseOverrideContext(data){
    let bindingContext = {};
    let overrideContext = createOverrideContext(bindingContext, this.overrideContext);
    bindingContext[this.local] = data;
    return overrideContext;
  }

  createFullOverrideContext(data, index, length){
    var overrideContext = this.createBaseOverrideContext(data);
    this.updateOverrideContext(overrideContext, index, length);
    return overrideContext;
  }

  updateOverrideContext(overrideContext, index, length){
    var first = (index === 0),
      last = (index === length - 1),
      even = index % 2 === 0;

    overrideContext.$index = index;
    overrideContext.$first = first;
    overrideContext.$last = last;
    overrideContext.$middle = !(first || last);
    overrideContext.$odd = !even;
    overrideContext.$even = even;

    return overrideContext;
  }

  handleSplices(items, splices){
    var numberOfDomElements = this.numberOfDomElements,
      viewSlot = this.viewSlot,
      first = this.first,
      totalAdded = 0,
      view, i, ii, j, marginTop, addIndex, splice, end, atBottom;
    this.items = items;

    for(i = 0, ii = viewSlot.children.length; i < ii; ++i){
      view = viewSlot.children[i];
      view.bindingContext[this.local] = items[this.first + i];
      view.overrideContext = this.updateOverrideContext(view.overrideContext, this.first + i, items.length);
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

  static getStyleValue(element, style){
    var currentStyle, styleValue;
    currentStyle = element.currentStyle || window.getComputedStyle(element);
    styleValue = parseInt(currentStyle[style]);
    return Number.isNaN(styleValue) ? 0 : styleValue;
  }

  static calcOuterHeight(element){
    var height;
    height = element.getBoundingClientRect().height;
    height += VirtualRepeat.getStyleValue(element, 'marginTop');
    height += VirtualRepeat.getStyleValue(element, 'marginBottom');
    return height;
  }

  static calcScrollHeight(element){
    var height;
    height = element.getBoundingClientRect().height;
    height -= VirtualRepeat.getStyleValue(element, 'borderTopWidth');
    height -= VirtualRepeat.getStyleValue(element, 'borderBottomWidth');
    return height;
  }

  static getNthNode(nodes, n, nodeType, fromBottom) {
    var foundCount = 0, i = 0, found, node, lastIndex;

    lastIndex = nodes.length - 1;

    if(fromBottom){ i = lastIndex; }

    do{
      node = nodes[i];
      if(node.nodeType === nodeType){
        ++foundCount;
        if(foundCount === n){
          found = true;
        }
      }
      if(fromBottom){ --i; } else { ++i; }
    } while(!found || i === lastIndex || i === 0);

    return node;
  }
}
