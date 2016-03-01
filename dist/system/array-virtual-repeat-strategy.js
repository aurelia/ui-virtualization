System.register(['aurelia-templating-resources/array-repeat-strategy', 'aurelia-templating-resources/repeat-utilities'], function (_export) {
  'use strict';

  var ArrayRepeatStrategy, createFullOverrideContext, updateOverrideContexts, updateOverrideContext, updateOneTimeBinding, ArrayVirtualRepeatStrategy;

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

  function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

  return {
    setters: [function (_aureliaTemplatingResourcesArrayRepeatStrategy) {
      ArrayRepeatStrategy = _aureliaTemplatingResourcesArrayRepeatStrategy.ArrayRepeatStrategy;
    }, function (_aureliaTemplatingResourcesRepeatUtilities) {
      createFullOverrideContext = _aureliaTemplatingResourcesRepeatUtilities.createFullOverrideContext;
      updateOverrideContexts = _aureliaTemplatingResourcesRepeatUtilities.updateOverrideContexts;
      updateOverrideContext = _aureliaTemplatingResourcesRepeatUtilities.updateOverrideContext;
      updateOneTimeBinding = _aureliaTemplatingResourcesRepeatUtilities.updateOneTimeBinding;
    }],
    execute: function () {
      ArrayVirtualRepeatStrategy = (function (_ArrayRepeatStrategy) {
        _inherits(ArrayVirtualRepeatStrategy, _ArrayRepeatStrategy);

        function ArrayVirtualRepeatStrategy() {
          _classCallCheck(this, ArrayVirtualRepeatStrategy);

          _ArrayRepeatStrategy.apply(this, arguments);
        }

        ArrayVirtualRepeatStrategy.prototype.createFirstItem = function createFirstItem(repeat) {
          var overrideContext = createFullOverrideContext(repeat, repeat.items[0], 0, 1);
          var view = repeat.viewFactory.create();
          view.bind(overrideContext.bindingContext, overrideContext);
          repeat.viewSlot.add(view);
        };

        ArrayVirtualRepeatStrategy.prototype.instanceChanged = function instanceChanged(repeat, items) {
          this._inPlaceProcessItems(repeat, items);
        };

        ArrayVirtualRepeatStrategy.prototype._standardProcessInstanceChanged = function _standardProcessInstanceChanged(repeat, items) {
          for (var i = 1, ii = repeat._viewsLength; i < ii; ++i) {
            var overrideContext = createFullOverrideContext(repeat, items[i], i, ii);
            var view = repeat.viewFactory.create();
            view.bind(overrideContext.bindingContext, overrideContext);
            repeat.viewSlot.add(view);
          }
        };

        ArrayVirtualRepeatStrategy.prototype._inPlaceProcessItems = function _inPlaceProcessItems(repeat, items) {
          var itemsLength = items.length;
          var viewsLength = repeat.viewSlot.children.length;
          var first = repeat._getIndexOfFirstView();

          while (viewsLength > repeat._viewsLength) {
            viewsLength--;
            repeat.viewSlot.removeAt(viewsLength, true);
          }

          var local = repeat.local;

          for (var i = 0; i < viewsLength; i++) {
            var view = repeat.viewSlot.children[i];
            var last = i === itemsLength - 1;
            var middle = i !== 0 && !last;

            if (view.bindingContext[local] === items[i + first] && view.overrideContext.$middle === middle && view.overrideContext.$last === last) {
              continue;
            }

            view.bindingContext[local] = items[i + first];
            view.overrideContext.$middle = middle;
            view.overrideContext.$last = last;
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
          }

          for (var i = viewsLength; i < repeat._viewsLength; i++) {
            var overrideContext = createFullOverrideContext(repeat, items[i], i, itemsLength);
            var view = repeat.viewFactory.create();
            view.bind(overrideContext.bindingContext, overrideContext);
            repeat.viewSlot.add(view);
          }
        };

        ArrayVirtualRepeatStrategy.prototype.instanceMutated = function instanceMutated(repeat, array, splices) {
          this._updateViews(repeat, repeat.items, splices);
        };

        ArrayVirtualRepeatStrategy.prototype._standardProcessInstanceMutated = function _standardProcessInstanceMutated(repeat, array, splices) {
          var _this = this;

          var removeDelta = 0;
          var viewSlot = repeat.viewSlot;
          var rmPromises = [];

          for (var i = 0, ii = splices.length; i < ii; ++i) {
            var splice = splices[i];
            var removed = splice.removed;
            var viewIndex = this._getViewIndex(repeat, viewSlot, splice.index);
            if (viewIndex >= 0) {
              for (var j = 0, jj = removed.length; j < jj; ++j) {
                var viewOrPromise = viewSlot.removeAt(viewIndex + removeDelta + rmPromises.length, true);

                var _length = viewSlot.children.length;
                var overrideContext = createFullOverrideContext(repeat, repeat.items[_length], _length, repeat.items.length);
                var view = repeat.viewFactory.create();
                view.bind(overrideContext.bindingContext, overrideContext);
                repeat.viewSlot.isAttached = false;
                repeat.viewSlot.add(view);
                repeat.viewSlot.isAttached = true;

                if (viewOrPromise instanceof Promise) {
                  rmPromises.push(viewOrPromise);
                }
              }
              removeDelta -= splice.addedCount;
            }
          }

          if (rmPromises.length > 0) {
            Promise.all(rmPromises).then(function () {
              _this._handleAddedSplices(repeat, array, splices);
              _this._updateViews(repeat, array, splices);
            });
          } else {
            this._handleAddedSplices(repeat, array, splices);
            this._updateViews(repeat, array, splices);
          }
        };

        ArrayVirtualRepeatStrategy.prototype._updateViews = function _updateViews(repeat, items, splices) {
          var totalAdded = 0;
          var totalRemoved = 0;
          repeat.items = items;

          for (var i = 0, ii = splices.length; i < ii; ++i) {
            var splice = splices[0];
            totalAdded += splice.addedCount;
            totalRemoved += splice.removed.length;
          }

          var index = repeat._getIndexOfFirstView() - totalRemoved;

          if (index < 0) {
            index = 0;
          }

          var viewSlot = repeat.viewSlot;

          for (var i = 0, ii = viewSlot.children.length; i < ii; ++i) {
            var view = viewSlot.children[i];
            var nextIndex = index + i;
            var itemsLength = items.length;
            if (nextIndex <= itemsLength - 1) {
              view.bindingContext[repeat.local] = items[nextIndex];
              updateOverrideContext(view.overrideContext, nextIndex, itemsLength);
            }
          }

          var bufferDelta = repeat.itemHeight * totalAdded + repeat.itemHeight * -totalRemoved;

          if (repeat._bottomBufferHeight + bufferDelta < 0) {
            repeat._topBufferHeight = repeat._topBufferHeight + bufferDelta;
          } else {
            repeat._bottomBufferHeight = repeat._bottomBufferHeight + bufferDelta;
          }

          if (repeat._bottomBufferHeight > 0) {
            repeat.isLastIndex = false;
          }

          repeat._adjustBufferHeights();
        };

        ArrayVirtualRepeatStrategy.prototype._handleAddedSplices = function _handleAddedSplices(repeat, array, splices) {
          var spliceIndexLow = undefined;
          var arrayLength = array.length;
          for (var i = 0, ii = splices.length; i < ii; ++i) {
            var splice = splices[i];
            var addIndex = splice.index;
            var end = splice.index + splice.addedCount;

            if (typeof spliceIndexLow === 'undefined' || spliceIndexLow === null || spliceIndexLow > splice.index) {
              spliceIndexLow = addIndex;
            }

            for (; addIndex < end; ++addIndex) {
              var overrideContext = createFullOverrideContext(repeat, array[addIndex], addIndex, arrayLength);
              var view = repeat.viewFactory.create();
              view.bind(overrideContext.bindingContext, overrideContext);
              repeat.viewSlot.insert(addIndex, view);
            }
          }

          return spliceIndexLow;
        };

        ArrayVirtualRepeatStrategy.prototype._isIndexInDom = function _isIndexInDom(viewSlot, index) {
          if (viewSlot.children.length === 0) {
            return false;
          }

          var indexLow = viewSlot.children[0].overrideContext.$index;
          var indexHi = viewSlot.children[viewSlot.children.length - 1].overrideContext.$index;

          return index >= indexLow && index <= indexHi;
        };

        ArrayVirtualRepeatStrategy.prototype._getViewIndex = function _getViewIndex(repeat, viewSlot, index) {
          if (viewSlot.children.length === 0) {
            return -1;
          }
          var indexLow = viewSlot.children[0].overrideContext.$index;
          var viewIndex = index - indexLow;
          if (viewIndex > repeat._viewsLength - 1) {
            viewIndex = -1;
          }
          return viewIndex;
        };

        return ArrayVirtualRepeatStrategy;
      })(ArrayRepeatStrategy);

      _export('ArrayVirtualRepeatStrategy', ArrayVirtualRepeatStrategy);
    }
  };
});