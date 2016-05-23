'use strict';

System.register(['aurelia-dependency-injection', 'aurelia-binding', 'aurelia-templating', 'aurelia-templating-resources', 'aurelia-pal', './utilities', './dom-helper', './virtual-repeat-strategy-locator', './view-strategy'], function (_export, _context) {
  var inject, ObserverLocator, BoundViewFactory, ViewSlot, ViewResources, TargetInstruction, customAttribute, bindable, templateController, AbstractRepeater, getItemsSourceExpression, isOneTime, unwrapExpression, updateOneTimeBinding, viewsRequireLifecycle, DOM, getStyleValue, calcOuterHeight, rebindAndMoveView, DomHelper, VirtualRepeatStrategyLocator, ViewStrategyLocator, _dec, _dec2, _class, _desc, _value, _class2, _descriptor, _descriptor2, VirtualRepeat;

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

  function _possibleConstructorReturn(self, call) {
    if (!self) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }

    return call && (typeof call === "object" || typeof call === "function") ? call : self;
  }

  function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
    }

    subClass.prototype = Object.create(superClass && superClass.prototype, {
      constructor: {
        value: subClass,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
    if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
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

  return {
    setters: [function (_aureliaDependencyInjection) {
      inject = _aureliaDependencyInjection.inject;
    }, function (_aureliaBinding) {
      ObserverLocator = _aureliaBinding.ObserverLocator;
    }, function (_aureliaTemplating) {
      BoundViewFactory = _aureliaTemplating.BoundViewFactory;
      ViewSlot = _aureliaTemplating.ViewSlot;
      ViewResources = _aureliaTemplating.ViewResources;
      TargetInstruction = _aureliaTemplating.TargetInstruction;
      customAttribute = _aureliaTemplating.customAttribute;
      bindable = _aureliaTemplating.bindable;
      templateController = _aureliaTemplating.templateController;
    }, function (_aureliaTemplatingResources) {
      AbstractRepeater = _aureliaTemplatingResources.AbstractRepeater;
      getItemsSourceExpression = _aureliaTemplatingResources.getItemsSourceExpression;
      isOneTime = _aureliaTemplatingResources.isOneTime;
      unwrapExpression = _aureliaTemplatingResources.unwrapExpression;
      updateOneTimeBinding = _aureliaTemplatingResources.updateOneTimeBinding;
      viewsRequireLifecycle = _aureliaTemplatingResources.viewsRequireLifecycle;
    }, function (_aureliaPal) {
      DOM = _aureliaPal.DOM;
    }, function (_utilities) {
      getStyleValue = _utilities.getStyleValue;
      calcOuterHeight = _utilities.calcOuterHeight;
      rebindAndMoveView = _utilities.rebindAndMoveView;
    }, function (_domHelper) {
      DomHelper = _domHelper.DomHelper;
    }, function (_virtualRepeatStrategyLocator) {
      VirtualRepeatStrategyLocator = _virtualRepeatStrategyLocator.VirtualRepeatStrategyLocator;
    }, function (_viewStrategy) {
      ViewStrategyLocator = _viewStrategy.ViewStrategyLocator;
    }],
    execute: function () {
      _export('VirtualRepeat', VirtualRepeat = (_dec = customAttribute('virtual-repeat'), _dec2 = inject(DOM.Element, BoundViewFactory, TargetInstruction, ViewSlot, ViewResources, ObserverLocator, VirtualRepeatStrategyLocator, ViewStrategyLocator, DomHelper), _dec(_class = templateController(_class = _dec2(_class = (_class2 = function (_AbstractRepeater) {
        _inherits(VirtualRepeat, _AbstractRepeater);

        function VirtualRepeat(element, viewFactory, instruction, viewSlot, viewResources, observerLocator, strategyLocator, viewStrategyLocator, domHelper) {
          _classCallCheck(this, VirtualRepeat);

          var _this = _possibleConstructorReturn(this, _AbstractRepeater.call(this, {
            local: 'item',
            viewsRequireLifecycle: viewsRequireLifecycle(viewFactory)
          }));

          _this._first = 0;
          _this._previousFirst = 0;
          _this._viewsLength = 0;
          _this._lastRebind = 0;
          _this._topBufferHeight = 0;
          _this._bottomBufferHeight = 0;
          _this._bufferSize = 5;
          _this._scrollingDown = false;
          _this._scrollingUp = false;
          _this._switchedDirection = false;
          _this._isAttached = false;
          _this._ticking = false;
          _this._fixedHeightContainer = false;
          _this._hasCalculatedSizes = false;
          _this._isAtTop = true;

          _initDefineProp(_this, 'items', _descriptor, _this);

          _initDefineProp(_this, 'local', _descriptor2, _this);

          _this.element = element;
          _this.viewFactory = viewFactory;
          _this.instruction = instruction;
          _this.viewSlot = viewSlot;
          _this.lookupFunctions = viewResources.lookupFunctions;
          _this.observerLocator = observerLocator;
          _this.strategyLocator = strategyLocator;
          _this.viewStrategyLocator = viewStrategyLocator;
          _this.sourceExpression = getItemsSourceExpression(_this.instruction, 'virtual-repeat.for');
          _this.isOneTime = isOneTime(_this.sourceExpression);
          _this.domHelper = domHelper;
          return _this;
        }

        VirtualRepeat.prototype.attached = function attached() {
          var _this2 = this;

          this._isAttached = true;
          var element = this.element;
          this._itemsLength = this.items.length;
          this.viewStrategy = this.viewStrategyLocator.getStrategy(element);
          this.scrollContainer = this.viewStrategy.getScrollContainer(element);
          this.topBuffer = this.viewStrategy.createTopBufferElement(element);
          this.bottomBuffer = this.viewStrategy.createBottomBufferElement(element);
          this.itemsChanged();
          this.scrollListener = function () {
            return _this2._onScroll();
          };

          this.calcDistanceToTopInterval = setInterval(function () {
            var distanceToTop = _this2.distanceToTop;
            _this2.distanceToTop = _this2.domHelper.getElementDistanceToTopOfDocument(_this2.topBuffer);
            if (distanceToTop !== _this2.distanceToTop) {
              _this2._handleScroll();
            }
          }, 500);

          this.distanceToTop = this.domHelper.getElementDistanceToTopOfDocument(this.viewStrategy.getFirstElement(this.topBuffer));
          if (this.domHelper.hasOverflowScroll(this.scrollContainer)) {
            this._fixedHeightContainer = true;
            this.scrollContainer.addEventListener('scroll', this.scrollListener);
          } else {
            document.addEventListener('scroll', this.scrollListener);
          }
        };

        VirtualRepeat.prototype.bind = function bind(bindingContext, overrideContext) {
          this.scope = { bindingContext: bindingContext, overrideContext: overrideContext };
        };

        VirtualRepeat.prototype.call = function call(context, changes) {
          this[context](this.items, changes);
        };

        VirtualRepeat.prototype.detached = function detached() {
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
        };

        VirtualRepeat.prototype.itemsChanged = function itemsChanged() {
          this._unsubscribeCollection();

          if (!this.scope) {
            return;
          }
          var items = this.items;
          this.strategy = this.strategyLocator.getStrategy(items);
          if (items.length > 0 && this.viewCount() === 0) {
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
          var scrollTop = this._fixedHeightContainer ? this.scrollContainer.scrollTop : pageYOffset - this.distanceToTop;
          this._first = Math.floor(scrollTop / itemHeight);
          this._first = this._first < 0 ? 0 : this._first;
          if (this._first > this.items.length - this.elementsInView) {
            this._first = this.items.length - this.elementsInView;
          }
          this._checkScrolling();

          if (this._scrollingDown) {
            var viewsToMove = this._first - this._lastRebind;
            if (this._switchedDirection) {
              viewsToMove = this._isAtTop ? this._first : this._bufferSize - (this._lastRebind - this._first);
            }
            this._isAtTop = false;
            this._lastRebind = this._first;
            var movedViewsCount = this._moveViews(viewsToMove);
            var adjustHeight = movedViewsCount < viewsToMove ? this._bottomBufferHeight : itemHeight * movedViewsCount;
            this._switchedDirection = false;
            this._topBufferHeight = this._topBufferHeight + adjustHeight;
            this._bottomBufferHeight = this._bottomBufferHeight - adjustHeight;
            if (this._bottomBufferHeight >= 0) {
              this._adjustBufferHeights();
            }
          } else if (this._scrollingUp) {
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
        };

        VirtualRepeat.prototype._adjustBufferHeights = function _adjustBufferHeights() {
          this.topBuffer.style.height = this._topBufferHeight + 'px';
          this.bottomBuffer.style.height = this._bottomBufferHeight + 'px';
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
            return _this5._scrollingDown ? _this5.isLastIndex : _this5._isAtTop;
          };
          var childrenLength = this.viewCount();
          var viewIndex = this._scrollingDown ? 0 : childrenLength - 1;
          var items = this.items;
          var index = this._scrollingDown ? this._getIndexOfLastView() + 1 : this._getIndexOfFirstView() - 1;
          var i = 0;
          var viewToMoveLimit = length - childrenLength * 2;
          while (i < length && !isAtFirstOrLastIndex()) {
            var view = this.view(viewIndex);
            var nextIndex = getNextIndex(index, i);
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
        };

        VirtualRepeat.prototype._getIndexOfLastView = function _getIndexOfLastView() {
          var view = this.view(this.viewCount() - 1);
          if (view) {
            return view.overrideContext.$index;
          }

          return -1;
        };

        VirtualRepeat.prototype._getLastViewItem = function _getLastViewItem() {
          var children = this.viewSlot.children;
          if (!children.length) {
            return undefined;
          }
          var lastViewItem = children[children.length - 1].bindingContext[this.local];
          return lastViewItem;
        };

        VirtualRepeat.prototype._getIndexOfFirstView = function _getIndexOfFirstView() {
          return this.view(0) ? this.view(0).overrideContext.$index : -1;
        };

        VirtualRepeat.prototype._calcInitialHeights = function _calcInitialHeights(itemsLength) {
          if (this._viewsLength > 0 && this._itemsLength === itemsLength || itemsLength <= 0) {
            return;
          }
          this._hasCalculatedSizes = true;
          this._itemsLength = itemsLength;
          var firstViewElement = DOM.nextElementSibling(this.view(0).firstChild);
          this.itemHeight = calcOuterHeight(firstViewElement);
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
          this.bottomBuffer.style.height = this._bottomBufferHeight + 'px';
          this._topBufferHeight = 0;
          this.topBuffer.style.height = this._topBufferHeight + 'px';

          this.scrollContainer.scrollTop = 0;
          this._first = 0;
        };

        VirtualRepeat.prototype._calcScrollHeight = function _calcScrollHeight(element) {
          var height = void 0;
          height = element.getBoundingClientRect().height;
          height -= getStyleValue(element, 'borderTopWidth');
          height -= getStyleValue(element, 'borderBottomWidth');
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
          var expression = unwrapExpression(this.sourceExpression);
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

        VirtualRepeat.prototype.viewCount = function viewCount() {
          return this.viewSlot.children.length;
        };

        VirtualRepeat.prototype.views = function views() {
          return this.viewSlot.children;
        };

        VirtualRepeat.prototype.view = function view(index) {
          return this.viewSlot.children[index];
        };

        VirtualRepeat.prototype.addView = function addView(bindingContext, overrideContext) {
          var view = this.viewFactory.create();
          view.bind(bindingContext, overrideContext);
          this.viewSlot.add(view);
        };

        VirtualRepeat.prototype.insertView = function insertView(index, bindingContext, overrideContext) {
          var view = this.viewFactory.create();
          view.bind(bindingContext, overrideContext);
          this.viewSlot.insert(index, view);
        };

        VirtualRepeat.prototype.removeAllViews = function removeAllViews(returnToCache, skipAnimation) {
          return this.viewSlot.removeAll(returnToCache, skipAnimation);
        };

        VirtualRepeat.prototype.removeView = function removeView(index, returnToCache, skipAnimation) {
          return this.viewSlot.removeAt(index, returnToCache, skipAnimation);
        };

        VirtualRepeat.prototype.updateBindings = function updateBindings(view) {
          var j = view.bindings.length;
          while (j--) {
            updateOneTimeBinding(view.bindings[j]);
          }
          j = view.controllers.length;
          while (j--) {
            var k = view.controllers[j].boundProperties.length;
            while (k--) {
              var binding = view.controllers[j].boundProperties[k].binding;
              updateOneTimeBinding(binding);
            }
          }
        };

        return VirtualRepeat;
      }(AbstractRepeater), (_descriptor = _applyDecoratedDescriptor(_class2.prototype, 'items', [bindable], {
        enumerable: true,
        initializer: null
      }), _descriptor2 = _applyDecoratedDescriptor(_class2.prototype, 'local', [bindable], {
        enumerable: true,
        initializer: null
      })), _class2)) || _class) || _class) || _class));

      _export('VirtualRepeat', VirtualRepeat);
    }
  };
});