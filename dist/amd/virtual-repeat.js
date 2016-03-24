define(['exports', 'aurelia-dependency-injection', 'aurelia-binding', 'aurelia-templating', 'aurelia-templating-resources/repeat-utilities', 'aurelia-templating-resources/analyze-view-factory', './utilities', './virtual-repeat-strategy-locator', './view-strategy'], function (exports, _aureliaDependencyInjection, _aureliaBinding, _aureliaTemplating, _repeatUtilities, _analyzeViewFactory, _utilities, _virtualRepeatStrategyLocator, _viewStrategy) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.VirtualRepeat = undefined;

  function _initDefineProp(target, property, descriptor, context) {
    if (!descriptor) return;
    Object.defineProperty(target, property, {
      enumerable: descriptor.enumerable,
      configurable: descriptor.configurable,
      writable: descriptor.writable,
      value: descriptor.initializer ? descriptor.initializer.call(context) : void 0
    });
  }

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) {
    var desc = {};
    Object['ke' + 'ys'](descriptor).forEach(function (key) {
      desc[key] = descriptor[key];
    });
    desc.enumerable = !!desc.enumerable;
    desc.configurable = !!desc.configurable;

    if ('value' in desc || desc.initializer) {
      desc.writable = true;
    }

    desc = decorators.slice().reverse().reduce(function (desc, decorator) {
      return decorator(target, property, desc) || desc;
    }, desc);

    if (context && desc.initializer !== void 0) {
      desc.value = desc.initializer ? desc.initializer.call(context) : void 0;
      desc.initializer = undefined;
    }

    if (desc.initializer === void 0) {
      Object['define' + 'Property'](target, property, desc);
      desc = null;
    }

    return desc;
  }

  function _initializerWarningHelper(descriptor, context) {
    throw new Error('Decorating class property failed. Please ensure that transform-class-properties is enabled.');
  }

  var _dec, _dec2, _class, _desc, _value, _class2, _descriptor, _descriptor2;

  var VirtualRepeat = exports.VirtualRepeat = (_dec = (0, _aureliaTemplating.customAttribute)('virtual-repeat'), _dec2 = (0, _aureliaDependencyInjection.inject)(Element, _aureliaTemplating.BoundViewFactory, _aureliaTemplating.TargetInstruction, _aureliaTemplating.ViewSlot, _aureliaBinding.ObserverLocator, _virtualRepeatStrategyLocator.VirtualRepeatStrategyLocator, _viewStrategy.ViewStrategyLocator), _dec(_class = (0, _aureliaTemplating.templateController)(_class = _dec2(_class = (_class2 = function () {
    function VirtualRepeat(element, viewFactory, instruction, viewSlot, observerLocator, strategyLocator, viewStrategyLocator) {
      _classCallCheck(this, VirtualRepeat);

      this._first = 0;
      this._previousFirst = 0;
      this._viewsLength = 0;
      this._lastRebind = 0;
      this._topBufferHeight = 0;
      this._bottomBufferHeight = 0;
      this._bufferSize = 5;
      this._scrollingDown = false;
      this._scrollingUp = false;
      this._switchedDirection = false;
      this._isAttached = false;
      this._ticking = false;
      this._fixedHeightContainer = false;
      this._hasCalculatedSizes = false;

      _initDefineProp(this, 'items', _descriptor, this);

      _initDefineProp(this, 'local', _descriptor2, this);

      this.element = element;
      this.viewFactory = viewFactory;
      this.instruction = instruction;
      this.viewSlot = viewSlot;
      this.observerLocator = observerLocator;
      this.strategyLocator = strategyLocator;
      this.viewStrategyLocator = viewStrategyLocator;
      this.local = 'item';
      this.sourceExpression = (0, _repeatUtilities.getItemsSourceExpression)(this.instruction, 'virtual-repeat.for');
      this.isOneTime = (0, _repeatUtilities.isOneTime)(this.sourceExpression);
      this.viewsRequireLifecycle = (0, _analyzeViewFactory.viewsRequireLifecycle)(viewFactory);
    }

    VirtualRepeat.prototype.attached = function attached() {
      var _this = this;

      this._isAttached = true;
      var element = this.element;
      this.viewStrategy = this.viewStrategyLocator.getStrategy(element);
      this.scrollContainer = this.viewStrategy.getScrollContainer(element);
      this.topBuffer = this.viewStrategy.createTopBufferElement(element);
      this.bottomBuffer = this.viewStrategy.createBottomBufferElement(element);
      this.itemsChanged();
      this.scrollListener = function () {
        return _this._onScroll();
      };
      var containerStyle = this.scrollContainer.style;
      if (containerStyle.overflowY === 'scroll' || containerStyle.overflow === 'scroll' || containerStyle.overflowY === 'auto' || containerStyle.overflow === 'auto') {
        this._fixedHeightContainer = true;
        this.scrollContainer.addEventListener('scroll', this.scrollListener);
      } else {
        document.addEventListener('scroll', this.scrollListener);
      }
    };

    VirtualRepeat.prototype.bind = function bind(bindingContext, overrideContext) {
      var _this2 = this;

      this.scope = { bindingContext: bindingContext, overrideContext: overrideContext };
      this._itemsLength = this.items.length;

      window.onresize = function () {
        _this2._handleResize();
      };
    };

    VirtualRepeat.prototype.call = function call(context, changes) {
      this[context](this.items, changes);
    };

    VirtualRepeat.prototype.detached = function detached() {
      window.onresize = null;

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
      var items = this.items;
      this.strategy = this.strategyLocator.getStrategy(items);
      if (items.length > 0) {
        this.strategy.createFirstItem(this);
      }
      this._calcInitialHeights(items.length);
      if (!this.isOneTime && !this._observeInnerCollection()) {
        this._observeCollection();
      }

      this.strategy.instanceChanged(this, items, this._viewsLength);
    };

    VirtualRepeat.prototype.unbind = function unbind() {
      this.scope = null;
      this.items = null;
      this._itemsLength = null;
    };

    VirtualRepeat.prototype.handleCollectionMutated = function handleCollectionMutated(collection, changes) {
      this._handlingMutations = true;
      this._itemsLength = collection.length;
      this.strategy.instanceMutated(this, collection, changes);
    };

    VirtualRepeat.prototype.handleInnerCollectionMutated = function handleInnerCollectionMutated(collection, changes) {
      var _this3 = this;

      if (this.ignoreMutation) {
        return;
      }
      this.ignoreMutation = true;
      var newItems = this.sourceExpression.evaluate(this.scope, this.lookupFunctions);
      this.observerLocator.taskQueue.queueMicroTask(function () {
        return _this3.ignoreMutation = false;
      });

      if (newItems === this.items) {
        this.itemsChanged();
      } else {
        this.items = newItems;
      }
    };

    VirtualRepeat.prototype._onScroll = function _onScroll() {
      var _this4 = this;

      if (!this._ticking && !this._handlingMutations) {
        requestAnimationFrame(function () {
          return _this4._handleScroll();
        });
        this._ticking = true;
      }

      if (this._handlingMutations) {
        this._handlingMutations = false;
      }
    };

    VirtualRepeat.prototype._handleScroll = function _handleScroll() {
      if (!this._isAttached) {
        return;
      }
      var itemHeight = this.itemHeight;
      var scrollTop = this._fixedHeightContainer ? this.topBuffer.scrollTop : pageYOffset - this.topBuffer.offsetTop;
      this._first = Math.floor(scrollTop / itemHeight);
      this._first = this._first < 0 ? 0 : this._first;
      this._checkScrolling();

      if (this._scrollingDown && (this._hasScrolledDownTheBuffer() || this._switchedDirection && this._hasScrolledDownTheBufferFromTop())) {
        var viewsToMove = this._first - this._lastRebind;
        if (this._switchedDirection) {
          viewsToMove = this.isAtTop ? this._first : this._bufferSize - (this._lastRebind - this._first);
        }
        this.isAtTop = false;
        this._lastRebind = this._first;
        var movedViewsCount = this._moveViews(viewsToMove);
        var adjustHeight = movedViewsCount < viewsToMove ? this._bottomBufferHeight : itemHeight * movedViewsCount;
        this._switchedDirection = false;
        this._topBufferHeight = this._topBufferHeight + adjustHeight;
        this._bottomBufferHeight = this._bottomBufferHeight - adjustHeight;
        if (this._bottomBufferHeight >= 0) {
          this._adjustBufferHeights();
        }
      } else if (this._scrollingUp && (this._hasScrolledUpTheBuffer() || this._switchedDirection && this._hasScrolledUpTheBufferFromBottom())) {
          var _viewsToMove = this._lastRebind - this._first;
          if (this._switchedDirection) {
            if (this.isLastIndex) {
              _viewsToMove = this.items.length - this._first - this.elementsInView;
            } else {
              _viewsToMove = this._bufferSize - (this._first - this._lastRebind);
            }
          }
          this.isLastIndex = false;
          this._lastRebind = this._first;
          var _movedViewsCount = this._moveViews(_viewsToMove);
          this.movedViewsCount = _movedViewsCount;
          var _adjustHeight = _movedViewsCount < _viewsToMove ? this._topBufferHeight : itemHeight * _movedViewsCount;
          this._switchedDirection = false;
          this._topBufferHeight = this._topBufferHeight - _adjustHeight;
          this._bottomBufferHeight = this._bottomBufferHeight + _adjustHeight;
          if (this._topBufferHeight >= 0) {
            this._adjustBufferHeights();
          }
        }
      this._previousFirst = this._first;

      this._ticking = false;
    };

    VirtualRepeat.prototype._handleResize = function _handleResize() {
      var children = this.viewSlot.children;
      var childrenLength = children.length;
      var overrideContext = void 0;
      var view = void 0;
      var addIndex = void 0;

      this.scrollContainerHeight = calcScrollHeight(this.scrollContainer);
      this._viewsLength = Math.ceil(this.scrollContainerHeight / this.itemHeight) + 1;

      if (this._viewsLength > childrenLength) {
        addIndex = children[childrenLength - 1].overrideContext.$index + 1;
        overrideContext = createFullOverrideContext(this, this.items[addIndex], addIndex, this.items.length);
        view = this.viewFactory.create();
        view.bind(overrideContext.bindingContext, overrideContext);
        this.viewSlot.insert(childrenLength, view);
      } else if (this._viewsLength < childrenLength) {
        this._viewsLength = childrenLength;
      }
    };

    VirtualRepeat.prototype._checkScrolling = function _checkScrolling() {
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
    };

    VirtualRepeat.prototype._hasScrolledDownTheBuffer = function _hasScrolledDownTheBuffer() {
      var atBottom = this._first + this._viewsLength >= this.items.length;
      var itemsAddedWhileAtBottom = atBottom && this._first > this._lastRebind;
      return this._first - this._lastRebind >= this._bufferSize || itemsAddedWhileAtBottom;
    };

    VirtualRepeat.prototype._hasScrolledDownTheBufferFromTop = function _hasScrolledDownTheBufferFromTop() {
      return this._first - this._bufferSize > 0;
    };

    VirtualRepeat.prototype._hasScrolledUpTheBuffer = function _hasScrolledUpTheBuffer() {
      return this._lastRebind - this._first >= this._bufferSize;
    };

    VirtualRepeat.prototype._hasScrolledUpTheBufferFromBottom = function _hasScrolledUpTheBufferFromBottom() {
      return this._first + this._bufferSize < this.items.length;
    };

    VirtualRepeat.prototype._adjustBufferHeights = function _adjustBufferHeights() {
      this.topBuffer.setAttribute('style', 'height:  ' + this._topBufferHeight + 'px');
      this.bottomBuffer.setAttribute('style', 'height: ' + this._bottomBufferHeight + 'px');
    };

    VirtualRepeat.prototype._unsubscribeCollection = function _unsubscribeCollection() {
      if (this.collectionObserver) {
        this.collectionObserver.unsubscribe(this.callContext, this);
        this.collectionObserver = null;
        this.callContext = null;
      }
    };

    VirtualRepeat.prototype._moveViews = function _moveViews(length) {
      var _this5 = this;

      var getNextIndex = this._scrollingDown ? function (index, i) {
        return index + i;
      } : function (index, i) {
        return index - i;
      };
      var isAtFirstOrLastIndex = function isAtFirstOrLastIndex() {
        return _this5._scrollingDown ? _this5.isLastIndex : _this5.isAtTop;
      };
      var viewSlot = this.viewSlot;
      var childrenLength = viewSlot.children.length;
      var viewIndex = this._scrollingDown ? 0 : childrenLength - 1;
      var items = this.items;
      var index = this._scrollingDown ? this._getIndexOfLastView() + 1 : this._getIndexOfFirstView() - 1;
      var i = 0;
      while (i < length && !isAtFirstOrLastIndex()) {
        var view = viewSlot.children[viewIndex];
        var nextIndex = getNextIndex(index, i);
        this.isLastIndex = nextIndex >= items.length - 1;
        this.isAtTop = nextIndex <= 0;
        if (!isAtFirstOrLastIndex()) {
          (0, _utilities.rebindAndMoveView)(this, view, nextIndex, this._scrollingDown);
          i++;
        }
      }
      return length - (length - i);
    };

    VirtualRepeat.prototype._getIndexOfLastView = function _getIndexOfLastView() {
      var children = this.viewSlot.children;
      return children[children.length - 1].overrideContext.$index;
    };

    VirtualRepeat.prototype._getIndexOfFirstView = function _getIndexOfFirstView() {
      var children = this.viewSlot.children;
      return children[0] ? children[0].overrideContext.$index : -1;
    };

    VirtualRepeat.prototype._calcInitialHeights = function _calcInitialHeights(itemsLength) {
      if (this._viewsLength > 0 && this._itemsLength === itemsLength || itemsLength <= 0) {
        return;
      }
      this._hasCalculatedSizes = true;
      this._itemsLength = itemsLength;
      var firstViewElement = this.viewSlot.children[0].firstChild.nextElementSibling;
      this.itemHeight = (0, _utilities.calcOuterHeight)(firstViewElement);
      if (this.itemHeight <= 0) {
        throw new Error('Could not calculate item height');
      }
      this.scrollContainerHeight = this._fixedHeightContainer ? this._calcScrollHeight(this.scrollContainer) : document.documentElement.clientHeight;
      this.elementsInView = Math.ceil(this.scrollContainerHeight / this.itemHeight) + 1;
      this._viewsLength = this.elementsInView * 2 + this._bufferSize;
      this._bottomBufferHeight = this.itemHeight * itemsLength - this.itemHeight * this._viewsLength;
      if (this._bottomBufferHeight < 0) {
        this._bottomBufferHeight = 0;
      }
      this.bottomBuffer.setAttribute('style', 'height: ' + this._bottomBufferHeight + 'px');
      this._topBufferHeight = 0;
      this.topBuffer.setAttribute('style', 'height: ' + this._topBufferHeight + 'px');

      this.scrollContainer.scrollTop = 0;
      this._first = 0;
    };

    VirtualRepeat.prototype._calcScrollHeight = function _calcScrollHeight(element) {
      var height = void 0;
      height = element.getBoundingClientRect().height;
      height -= (0, _utilities.getStyleValue)(element, 'borderTopWidth');
      height -= (0, _utilities.getStyleValue)(element, 'borderBottomWidth');
      return height;
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
      var expression = (0, _repeatUtilities.unwrapExpression)(this.sourceExpression);
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

    return VirtualRepeat;
  }(), (_descriptor = _applyDecoratedDescriptor(_class2.prototype, 'items', [_aureliaTemplating.bindable], {
    enumerable: true,
    initializer: null
  }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, 'local', [_aureliaTemplating.bindable], {
    enumerable: true,
    initializer: null
  })), _class2)) || _class) || _class) || _class);
});