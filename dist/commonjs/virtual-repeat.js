'use strict';

exports.__esModule = true;

var _createDecoratedClass = (function () { function defineProperties(target, descriptors, initializers) { for (var i = 0; i < descriptors.length; i++) { var descriptor = descriptors[i]; var decorators = descriptor.decorators; var key = descriptor.key; delete descriptor.key; delete descriptor.decorators; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor || descriptor.initializer) descriptor.writable = true; if (decorators) { for (var f = 0; f < decorators.length; f++) { var decorator = decorators[f]; if (typeof decorator === 'function') { descriptor = decorator(target, key, descriptor) || descriptor; } else { throw new TypeError('The decorator for method ' + descriptor.key + ' is of the invalid type ' + typeof decorator); } } if (descriptor.initializer !== undefined) { initializers[key] = descriptor; continue; } } Object.defineProperty(target, key, descriptor); } } return function (Constructor, protoProps, staticProps, protoInitializers, staticInitializers) { if (protoProps) defineProperties(Constructor.prototype, protoProps, protoInitializers); if (staticProps) defineProperties(Constructor, staticProps, staticInitializers); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _defineDecoratedPropertyDescriptor(target, key, descriptors) { var _descriptor = descriptors[key]; if (!_descriptor) return; var descriptor = {}; for (var _key in _descriptor) descriptor[_key] = _descriptor[_key]; descriptor.value = descriptor.initializer ? descriptor.initializer.call(target) : undefined; Object.defineProperty(target, key, descriptor); }

var _aureliaDependencyInjection = require('aurelia-dependency-injection');

var _aureliaBinding = require('aurelia-binding');

var _aureliaTemplating = require('aurelia-templating');

var _aureliaTemplatingResourcesRepeatUtilities = require('aurelia-templating-resources/repeat-utilities');

var _scrollHandler = require('./scroll-handler');

var _utilities = require('./utilities');

var VirtualRepeat = (function () {
  var _instanceInitializers = {};

  _createDecoratedClass(VirtualRepeat, [{
    key: 'items',
    decorators: [_aureliaTemplating.bindable],
    initializer: null,
    enumerable: true
  }, {
    key: 'local',
    decorators: [_aureliaTemplating.bindable],
    initializer: null,
    enumerable: true
  }], null, _instanceInitializers);

  function VirtualRepeat(element, viewFactory, viewSlot, observerLocator, scrollHandler) {
    _classCallCheck(this, _VirtualRepeat);

    _defineDecoratedPropertyDescriptor(this, 'items', _instanceInitializers);

    _defineDecoratedPropertyDescriptor(this, 'local', _instanceInitializers);

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

  VirtualRepeat.prototype.bind = function bind(bindingContext, overrideContext) {
    var _this = this;

    this.scope = { bindingContext: bindingContext, overrideContext: overrideContext };
    this.virtualScrollInner = this.element.parentNode;
    this.virtualScroll = this.virtualScrollInner.parentElement;
    this.createScrollIndicator();
    this.virtualScroll.style.overflow = 'hidden';
    this.virtualScroll.tabIndex = '-1';

    this.virtualScroll.addEventListener('touchmove', function (e) {
      e.preventDefault();
    });

    this.scrollHandler.initialize(this.virtualScroll, function (deltaY, useEase) {
      _this.useEase = useEase;
      _this.targetY += deltaY;
      _this.targetY = Math.max(-_this.scrollViewHeight, _this.targetY);
      _this.targetY = Math.min(0, _this.targetY);
      return _this.targetY;
    });

    window.onresize = function () {
      _this.handleContainerResize();
    };

    var overrideContext = _aureliaTemplatingResourcesRepeatUtilities.createFullOverrideContext(this, this.items[0], 0, 1);
    var view = this.viewFactory.create();
    view.bind(overrideContext.bindingContext, overrideContext);
    this.viewSlot.add(view);
  };

  VirtualRepeat.prototype.unbind = function unbind() {
    this.scrollHandler.dispose();

    if (this.disposeSubscription) {
      this.disposeSubscription();
      this.disposeSubscription = null;
    }
  };

  VirtualRepeat.prototype.attached = function attached() {
    var _this2 = this;

    var items = this.items,
        observer,
        overrideContext,
        view,
        node;

    this.listItems = this.virtualScrollInner.children;
    this.itemHeight = _utilities.calcOuterHeight(this.listItems[0]);
    this.virtualScrollHeight = _utilities.calcScrollHeight(this.virtualScroll);
    this.numberOfDomElements = Math.ceil(this.virtualScrollHeight / this.itemHeight) + 1;

    for (var i = 1, ii = this.numberOfDomElements; i < ii; ++i) {
      overrideContext = _aureliaTemplatingResourcesRepeatUtilities.createFullOverrideContext(this, this.items[i], i, ii);
      view = this.viewFactory.create();
      view.bind(overrideContext.bindingContext, overrideContext);
      this.viewSlot.add(view);
    }

    this.calcScrollViewHeight();
    this.calcIndicatorHeight();

    observer = this.observerLocator.getArrayObserver(items);

    for (i = 0, ii = this.virtualScrollInner.children.length; i < ii; ++i) {
      node = this.virtualScrollInner.children[i];

      node.style['-webkit-backface-visibility'] = 'hidden';
    }

    this.disposeSubscription = observer.subscribe(function (splices) {
      _this2.handleSplices(items, splices);
    });

    this.scroll();
  };

  VirtualRepeat.prototype.handleContainerResize = function handleContainerResize() {
    var children = this.viewSlot.children,
        childrenLength = children.length,
        overrideContext,
        view,
        addIndex;

    this.virtualScrollHeight = _utilities.calcScrollHeight(this.virtualScroll);
    this.numberOfDomElements = Math.ceil(this.virtualScrollHeight / this.itemHeight) + 1;

    if (this.numberOfDomElements > childrenLength) {
      addIndex = children[childrenLength - 1].overrideContext.$index + 1;
      overrideContext = _aureliaTemplatingResourcesRepeatUtilities.createFullOverrideContext(this, this.items[addIndex], addIndex, this.items.length);
      view = this.viewFactory.create();
      view.bind(overrideContext.bindingContext, overrideContext);
      this.viewSlot.insert(childrenLength, view);
    } else if (this.numberOfDomElements < childrenLength) {
      this.numberOfDomElements = childrenLength;
    }

    this.calcScrollViewHeight();
  };

  VirtualRepeat.prototype.scroll = function scroll() {
    var _this3 = this;

    var scrollView = this.virtualScrollInner,
        childNodes = scrollView.childNodes,
        itemHeight = this.itemHeight,
        items = this.items,
        viewSlot = this.viewSlot,
        numberOfDomElements = this.numberOfDomElements,
        ease = this.useEase ? 0.1 : 1,
        element,
        viewStart,
        viewEnd,
        marginTop,
        translateStyle,
        view,
        first;

    this.currentY += (this.targetY - this.currentY) * ease;
    this.currentY = Math.round(this.currentY);

    if (this.currentY === this.previousY) {

      requestAnimationFrame(function () {
        return _this3.scroll();
      });
      return;
    }

    this.previousY = this.currentY;
    this.first = Math.ceil(this.currentY / itemHeight) * -1;
    first = this.first;

    if (first > this.previousFirst && first + numberOfDomElements - 1 <= items.length) {
      this.previousFirst = first;

      view = viewSlot.children[0];
      _aureliaTemplatingResourcesRepeatUtilities.updateOverrideContext(view.overrideContext, first + numberOfDomElements - 1, items.length);
      view.bindingContext[this.local] = items[first + numberOfDomElements - 1];
      viewSlot.children.push(viewSlot.children.shift());

      viewStart = _utilities.getNthNode(childNodes, 1, 8);
      element = _utilities.getNthNode(childNodes, 1, 1);
      viewEnd = _utilities.getNthNode(childNodes, 2, 8);

      scrollView.insertBefore(viewEnd, scrollView.children[numberOfDomElements]);
      scrollView.insertBefore(element, viewEnd);
      scrollView.insertBefore(viewStart, element);

      marginTop = itemHeight * first + "px";
      scrollView.style.marginTop = marginTop;
    } else if (first < this.previousFirst) {
      this.previousFirst = first;

      view = viewSlot.children[numberOfDomElements - 1];
      if (view) {
        view.bindingContext[this.local] = items[first];
        _aureliaTemplatingResourcesRepeatUtilities.updateOverrideContext(view.overrideContext, first, items.length);
        viewSlot.children.unshift(viewSlot.children.splice(-1, 1)[0]);

        viewStart = _utilities.getNthNode(childNodes, 1, 8, true);
        element = _utilities.getNthNode(childNodes, 1, 1, true);
        viewEnd = _utilities.getNthNode(childNodes, 2, 8, true);

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

    this.scrollIndicator();
    requestAnimationFrame(function () {
      return _this3.scroll();
    });
  };

  VirtualRepeat.prototype.scrollIndicator = function scrollIndicator() {
    var scrolledPercentage, indicatorTranslateStyle;

    scrolledPercentage = -this.currentY / (this.items.length * this.itemHeight - this.virtualScrollHeight);
    this.indicatorY = (this.virtualScrollHeight - this.indicatorHeight) * scrolledPercentage;

    indicatorTranslateStyle = "translate3d(0px," + this.indicatorY + "px,0px)";
    this.indicator.style.webkitTransform = indicatorTranslateStyle;
    this.indicator.style.msTransform = indicatorTranslateStyle;
    this.indicator.style.transform = indicatorTranslateStyle;
  };

  VirtualRepeat.prototype.handleSplices = function handleSplices(items, splices) {
    var numberOfDomElements = this.numberOfDomElements,
        viewSlot = this.viewSlot,
        first = this.first,
        totalAdded = 0,
        view,
        i,
        ii,
        j,
        marginTop,
        addIndex,
        splice,
        end,
        atBottom;
    this.items = items;

    for (i = 0, ii = viewSlot.children.length; i < ii; ++i) {
      view = viewSlot.children[i];
      view.bindingContext[this.local] = items[this.first + i];
      _aureliaTemplatingResourcesRepeatUtilities.updateOverrideContext(view.overrideContext, this.first + i, items.length);
    }

    for (i = 0, ii = splices.length; i < ii; ++i) {
      splice = splices[0];
      addIndex = splices[i].index;
      end = splice.index + splice.addedCount;
      totalAdded += splice.addedCount;

      for (; addIndex < end; ++addIndex) {
        if (addIndex < first + numberOfDomElements && !atBottom) {
          marginTop = this.itemHeight * first + "px";
          this.virtualScrollInner.style.marginTop = marginTop;
        }
      }
    }

    if (items.length < numberOfDomElements) {
      var limit = numberOfDomElements - (numberOfDomElements - items.length) - 1;
      for (j = 0; j < numberOfDomElements; ++j) {
        this.virtualScrollInner.children[j].style.display = j >= limit ? 'none' : 'block';
      }
    }

    this.calcScrollViewHeight();
    this.calcIndicatorHeight();
    this.scrollIndicator();
  };

  VirtualRepeat.prototype.calcScrollViewHeight = function calcScrollViewHeight() {
    this.scrollViewHeight = this.items.length * this.itemHeight - this.virtualScrollHeight;
  };

  VirtualRepeat.prototype.calcIndicatorHeight = function calcIndicatorHeight() {
    this.indicatorHeight = this.virtualScrollHeight * (this.virtualScrollHeight / this.scrollViewHeight);
    if (this.indicatorHeight < this.indicatorMinHeight) {
      this.indicatorHeight = this.indicatorMinHeight;
    }

    if (this.indicatorHeight >= this.scrollViewHeight) {
      this.indicator.style.visibility = 'hidden';
    } else {
      this.indicator.style.visibility = '';
    }

    this.indicator.style.height = this.indicatorHeight + 'px';
  };

  VirtualRepeat.prototype.createScrollIndicator = function createScrollIndicator() {
    var indicator;
    indicator = this.indicator = document.createElement('div');
    this.virtualScroll.appendChild(this.indicator);
    indicator.classList.add('au-scroll-indicator');
    indicator.style.backgroundColor = '#cccccc';
    indicator.style.top = '0px';
    indicator.style.right = '5px';
    indicator.style.width = '4px';
    indicator.style.position = 'absolute';
    indicator.style.opacity = '0.6';
  };

  var _VirtualRepeat = VirtualRepeat;
  VirtualRepeat = _aureliaDependencyInjection.inject(Element, _aureliaTemplating.BoundViewFactory, _aureliaTemplating.ViewSlot, _aureliaBinding.ObserverLocator, _scrollHandler.ScrollHandler)(VirtualRepeat) || VirtualRepeat;
  VirtualRepeat = _aureliaTemplating.templateController(VirtualRepeat) || VirtualRepeat;
  VirtualRepeat = _aureliaTemplating.customAttribute('virtual-repeat')(VirtualRepeat) || VirtualRepeat;
  return VirtualRepeat;
})();

exports.VirtualRepeat = VirtualRepeat;