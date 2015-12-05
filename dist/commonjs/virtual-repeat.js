'use strict';

exports.__esModule = true;

var _createDecoratedClass = (function () { function defineProperties(target, descriptors, initializers) { for (var i = 0; i < descriptors.length; i++) { var descriptor = descriptors[i]; var decorators = descriptor.decorators; var key = descriptor.key; delete descriptor.key; delete descriptor.decorators; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor || descriptor.initializer) descriptor.writable = true; if (decorators) { for (var f = 0; f < decorators.length; f++) { var decorator = decorators[f]; if (typeof decorator === 'function') { descriptor = decorator(target, key, descriptor) || descriptor; } else { throw new TypeError('The decorator for method ' + descriptor.key + ' is of the invalid type ' + typeof decorator); } } if (descriptor.initializer !== undefined) { initializers[key] = descriptor; continue; } } Object.defineProperty(target, key, descriptor); } } return function (Constructor, protoProps, staticProps, protoInitializers, staticInitializers) { if (protoProps) defineProperties(Constructor.prototype, protoProps, protoInitializers); if (staticProps) defineProperties(Constructor, staticProps, staticInitializers); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _defineDecoratedPropertyDescriptor(target, key, descriptors) { var _descriptor = descriptors[key]; if (!_descriptor) return; var descriptor = {}; for (var _key in _descriptor) descriptor[_key] = _descriptor[_key]; descriptor.value = descriptor.initializer ? descriptor.initializer.call(target) : undefined; Object.defineProperty(target, key, descriptor); }

var _aureliaDependencyInjection = require('aurelia-dependency-injection');

var _aureliaBinding = require('aurelia-binding');

var _aureliaTemplating = require('aurelia-templating');

var _aureliaTemplatingResourcesRepeatUtilities = require('aurelia-templating-resources/repeat-utilities');

var _aureliaTemplatingResourcesAnalyzeViewFactory = require('aurelia-templating-resources/analyze-view-factory');

var _scrollHandler = require('./scroll-handler');

var _utilities = require('./utilities');

var _virtualRepeatStrategyLocator = require('./virtual-repeat-strategy-locator');

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

  function VirtualRepeat(element, viewFactory, instruction, viewSlot, observerLocator, scrollHandler, strategyLocator) {
    _classCallCheck(this, _VirtualRepeat);

    _defineDecoratedPropertyDescriptor(this, 'items', _instanceInitializers);

    _defineDecoratedPropertyDescriptor(this, 'local', _instanceInitializers);

    this.element = element;
    this.viewFactory = viewFactory;
    this.instruction = instruction;
    this.viewSlot = viewSlot;
    this.observerLocator = observerLocator;
    this.scrollHandler = scrollHandler;
    this.strategyLocator = strategyLocator;
    this.local = 'item';
    this.useEase = false;
    this.targetY = 0;
    this.currentY = 0;
    this.previousY = 0;
    this.first = 0;
    this.previousFirst = 0;
    this.numberOfDomElements = 0;
    this.indicatorMinHeight = 15;
    this.sourceExpression = _aureliaTemplatingResourcesRepeatUtilities.getItemsSourceExpression(this.instruction, 'virtual-repeat.for');
    this.isOneTime = _aureliaTemplatingResourcesRepeatUtilities.isOneTime(this.sourceExpression);
    this.viewsRequireLifecycle = _aureliaTemplatingResourcesAnalyzeViewFactory.viewsRequireLifecycle(viewFactory);
  }

  VirtualRepeat.prototype.attached = function attached() {
    var _this = this;

    this.isAttached = true;
    this.virtualScrollInner = this.element.parentNode;
    this.virtualScroll = this.virtualScrollInner.parentElement;
    this.virtualScroll.style.overflow = 'hidden';
    this.virtualScroll.tabIndex = '-1';

    this.scrollHandler.initialize(this.virtualScroll, function (deltaY, useEase) {
      _this.useEase = useEase;
      _this.targetY += deltaY;
      _this.targetY = Math.max(-_this.scrollViewHeight, _this.targetY);
      _this.targetY = Math.min(0, _this.targetY);
      return _this.targetY;
    });

    this.itemsChanged();
  };

  VirtualRepeat.prototype.bind = function bind(bindingContext, overrideContext) {
    var _this2 = this;

    this.scope = { bindingContext: bindingContext, overrideContext: overrideContext };

    window.onresize = function () {
      _this2.handleContainerResize();
    };
  };

  VirtualRepeat.prototype.call = function call(context, changes) {
    this[context](this.items, changes);
  };

  VirtualRepeat.prototype.detached = function detached() {
    this.isAttached = false;
    this._destroyScrollIndicator();
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
    if (this.scrollHandler) {
      this.scrollHandler.dispose();
    }
    this._unsubscribeCollection();
  };

  VirtualRepeat.prototype.itemsChanged = function itemsChanged() {
    this._unsubscribeCollection();

    if (!this.scope) {
      return;
    }

    this._createScrollIndicator();

    var items = this.items;
    this.strategy = this.strategyLocator.getStrategy(items);
    this.strategy.createFirstItem(this);
    this._calcInitialHeights();

    if (!this.isOneTime && !this._observeInnerCollection()) {
      this._observeCollection();
    }

    this.strategy.instanceChanged(this, items, this.numberOfDomElements);
    this._calcScrollViewHeight();
    this._calcIndicatorHeight();

    this.scroll();
  };

  VirtualRepeat.prototype.unbind = function unbind() {
    this.scope = null;
    this.items = null;
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

    this._calcScrollViewHeight();
  };

  VirtualRepeat.prototype.scroll = function scroll() {
    var _this3 = this;

    if (this.isAttached === false) {
      return;
    }

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
    first = this.first = Math.ceil(this.currentY / itemHeight) * -1;

    if (first > this.previousFirst && first + numberOfDomElements - 1 <= items.length) {
      this.previousFirst = first;

      view = viewSlot.children[0];
      _aureliaTemplatingResourcesRepeatUtilities.updateOverrideContext(view.overrideContext, first + numberOfDomElements - 1, items.length);
      view.bindingContext[this.local] = items[first + numberOfDomElements - 1];
      viewSlot.children.push(viewSlot.children.shift());

      _utilities.moveViewLast(view, scrollView, numberOfDomElements);

      marginTop = itemHeight * first + "px";
      scrollView.style.marginTop = marginTop;
    } else if (first < this.previousFirst && !Object.is(first, -0)) {
      this.previousFirst = first;

      view = viewSlot.children[numberOfDomElements - 1];
      if (view) {
        view.bindingContext[this.local] = items[first];
        _aureliaTemplatingResourcesRepeatUtilities.updateOverrideContext(view.overrideContext, first, items.length);
        viewSlot.children.unshift(viewSlot.children.splice(-1, 1)[0]);

        _utilities.moveViewFirst(view, scrollView);

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
  };

  VirtualRepeat.prototype.handleCollectionMutated = function handleCollectionMutated(collection, changes) {
    this.strategy.instanceMutated(this, collection, changes);
  };

  VirtualRepeat.prototype.handleInnerCollectionMutated = function handleInnerCollectionMutated(collection, changes) {
    var _this4 = this;

    if (this.ignoreMutation) {
      return;
    }
    this.ignoreMutation = true;
    var newItems = this.sourceExpression.evaluate(this.scope, this.lookupFunctions);
    this.observerLocator.taskQueue.queueMicroTask(function () {
      return _this4.ignoreMutation = false;
    });

    if (newItems === this.items) {
      this.itemsChanged();
    } else {
      this.items = newItems;
    }
  };

  VirtualRepeat.prototype._unsubscribeCollection = function _unsubscribeCollection() {
    if (this.collectionObserver) {
      this.collectionObserver.unsubscribe(this.callContext, this);
      this.collectionObserver = null;
      this.callContext = null;
    }
  };

  VirtualRepeat.prototype._updateSizes = function _updateSizes() {
    this._calcScrollViewHeight();
    this._calcIndicatorHeight();
    this.scrollIndicator();
  };

  VirtualRepeat.prototype._calcScrollViewHeight = function _calcScrollViewHeight() {
    this.scrollViewHeight = this.items.length * this.itemHeight - this.virtualScrollHeight;
  };

  VirtualRepeat.prototype._calcIndicatorHeight = function _calcIndicatorHeight() {
    if (!this.indicator) {
      return;
    }

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

  VirtualRepeat.prototype._createScrollIndicator = function _createScrollIndicator() {
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

  VirtualRepeat.prototype._destroyScrollIndicator = function _destroyScrollIndicator() {
    if (this.virtualScroll && this.indicator) {
      this.virtualScroll.removeChild(this.indicator);
      this.indicator = null;
    }
  };

  VirtualRepeat.prototype._calcInitialHeights = function _calcInitialHeights() {
    var listItems = this.virtualScrollInner.children;
    this.itemHeight = _utilities.calcOuterHeight(listItems[0]);
    this.virtualScrollHeight = _utilities.calcScrollHeight(this.virtualScroll);
    this.numberOfDomElements = Math.ceil(this.virtualScrollHeight / this.itemHeight) + 1;
  };

  VirtualRepeat.prototype._observeInnerCollection = function _observeInnerCollection() {
    var items = this._getInnerCollection();
    var strategy = this.strategyLocator.getStrategy(items);
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
  };

  VirtualRepeat.prototype._getInnerCollection = function _getInnerCollection() {
    var expression = _aureliaTemplatingResourcesRepeatUtilities.unwrapExpression(this.sourceExpression);
    if (!expression) {
      return null;
    }
    return expression.evaluate(this.scope, null);
  };

  VirtualRepeat.prototype._observeCollection = function _observeCollection() {
    var items = this.items;
    this.collectionObserver = this.strategy.getCollectionObserver(this.observerLocator, items);
    if (this.collectionObserver) {
      this.callContext = 'handleCollectionMutated';
      this.collectionObserver.subscribe(this.callContext, this);
    }
  };

  var _VirtualRepeat = VirtualRepeat;
  VirtualRepeat = _aureliaDependencyInjection.inject(Element, _aureliaTemplating.BoundViewFactory, _aureliaTemplating.TargetInstruction, _aureliaTemplating.ViewSlot, _aureliaBinding.ObserverLocator, _scrollHandler.ScrollHandler, _virtualRepeatStrategyLocator.VirtualRepeatStrategyLocator)(VirtualRepeat) || VirtualRepeat;
  VirtualRepeat = _aureliaTemplating.templateController(VirtualRepeat) || VirtualRepeat;
  VirtualRepeat = _aureliaTemplating.customAttribute('virtual-repeat')(VirtualRepeat) || VirtualRepeat;
  return VirtualRepeat;
})();

exports.VirtualRepeat = VirtualRepeat;