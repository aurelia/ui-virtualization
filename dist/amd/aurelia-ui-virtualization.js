define(['exports', 'aurelia-binding', 'aurelia-templating', 'aurelia-templating-resources', 'aurelia-pal', 'aurelia-dependency-injection'], function (exports, aureliaBinding, aureliaTemplating, aureliaTemplatingResources, aureliaPal, aureliaDependencyInjection) { 'use strict';

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the Apache License, Version 2.0 (the "License"); you may not use
    this file except in compliance with the License. You may obtain a copy of the
    License at http://www.apache.org/licenses/LICENSE-2.0

    THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
    WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
    MERCHANTABLITY OR NON-INFRINGEMENT.

    See the Apache Version 2.0 License for specific language governing permissions
    and limitations under the License.
    ***************************************************************************** */
    /* global Reflect, Promise */

    var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };

    function __extends(d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    }

    function calcOuterHeight(element) {
        var height = element.getBoundingClientRect().height;
        height += getStyleValues(element, 'marginTop', 'marginBottom');
        return height;
    }
    function insertBeforeNode(view, bottomBuffer) {
        var parentElement = bottomBuffer.parentElement || bottomBuffer.parentNode;
        parentElement.insertBefore(view.lastChild, bottomBuffer);
    }
    function updateVirtualOverrideContexts(repeat, startIndex) {
        var views = repeat.viewSlot.children;
        var viewLength = views.length;
        var collectionLength = repeat.items.length;
        if (startIndex > 0) {
            startIndex = startIndex - 1;
        }
        var delta = repeat._topBufferHeight / repeat.itemHeight;
        for (; startIndex < viewLength; ++startIndex) {
            aureliaTemplatingResources.updateOverrideContext(views[startIndex].overrideContext, startIndex + delta, collectionLength);
        }
    }
    function rebindAndMoveView(repeat, view, index, moveToBottom) {
        var items = repeat.items;
        var viewSlot = repeat.viewSlot;
        aureliaTemplatingResources.updateOverrideContext(view.overrideContext, index, items.length);
        view.bindingContext[repeat.local] = items[index];
        if (moveToBottom) {
            viewSlot.children.push(viewSlot.children.shift());
            repeat.templateStrategy.moveViewLast(view, repeat.bottomBuffer);
        }
        else {
            viewSlot.children.unshift(viewSlot.children.splice(-1, 1)[0]);
            repeat.templateStrategy.moveViewFirst(view, repeat.topBuffer);
        }
    }
    function getStyleValues(element) {
        var styles = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            styles[_i - 1] = arguments[_i];
        }
        var currentStyle = window.getComputedStyle(element);
        var value = 0;
        var styleValue = 0;
        for (var i = 0, ii = styles.length; ii > i; ++i) {
            styleValue = parseInt(currentStyle[styles[i]], 10);
            value += Number.isNaN(styleValue) ? 0 : styleValue;
        }
        return value;
    }
    function getElementDistanceToBottomViewPort(element) {
        return document.documentElement.clientHeight - element.getBoundingClientRect().bottom;
    }

    var DomHelper = (function () {
        function DomHelper() {
        }
        DomHelper.prototype.getElementDistanceToTopOfDocument = function (element) {
            var box = element.getBoundingClientRect();
            var documentElement = document.documentElement;
            var scrollTop = window.pageYOffset;
            var clientTop = documentElement.clientTop;
            var top = box.top + scrollTop - clientTop;
            return Math.round(top);
        };
        DomHelper.prototype.hasOverflowScroll = function (element) {
            var style = element.style;
            return style.overflowY === 'scroll' || style.overflow === 'scroll' || style.overflowY === 'auto' || style.overflow === 'auto';
        };
        return DomHelper;
    }());

    var ArrayVirtualRepeatStrategy = (function (_super) {
        __extends(ArrayVirtualRepeatStrategy, _super);
        function ArrayVirtualRepeatStrategy() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        ArrayVirtualRepeatStrategy.prototype.createFirstItem = function (repeat) {
            var overrideContext = aureliaTemplatingResources.createFullOverrideContext(repeat, repeat.items[0], 0, 1);
            repeat.addView(overrideContext.bindingContext, overrideContext);
        };
        ArrayVirtualRepeatStrategy.prototype.instanceChanged = function (repeat, items) {
            var rest = [];
            for (var _i = 2; _i < arguments.length; _i++) {
                rest[_i - 2] = arguments[_i];
            }
            this._inPlaceProcessItems(repeat, items, rest[0]);
        };
        ArrayVirtualRepeatStrategy.prototype.instanceMutated = function (repeat, array, splices) {
            this._standardProcessInstanceMutated(repeat, array, splices);
        };
        ArrayVirtualRepeatStrategy.prototype._standardProcessInstanceChanged = function (repeat, items) {
            for (var i = 1, ii = repeat._viewsLength; i < ii; ++i) {
                var overrideContext = aureliaTemplatingResources.createFullOverrideContext(repeat, items[i], i, ii);
                repeat.addView(overrideContext.bindingContext, overrideContext);
            }
        };
        ArrayVirtualRepeatStrategy.prototype._inPlaceProcessItems = function (repeat, items, first) {
            var itemsLength = items.length;
            var viewsLength = repeat.viewCount();
            while (viewsLength > itemsLength) {
                viewsLength--;
                repeat.removeView(viewsLength, true);
            }
            var local = repeat.local;
            for (var i = 0; i < viewsLength; i++) {
                var view = repeat.view(i);
                var last = i === itemsLength - 1;
                var middle = i !== 0 && !last;
                if (view.bindingContext[local] === items[i + first] && view.overrideContext.$middle === middle && view.overrideContext.$last === last) {
                    continue;
                }
                view.bindingContext[local] = items[i + first];
                view.overrideContext.$middle = middle;
                view.overrideContext.$last = last;
                view.overrideContext.$index = i + first;
                repeat.updateBindings(view);
            }
            var minLength = Math.min(repeat._viewsLength, itemsLength);
            for (var i = viewsLength; i < minLength; i++) {
                var overrideContext = aureliaTemplatingResources.createFullOverrideContext(repeat, items[i], i, itemsLength);
                repeat.addView(overrideContext.bindingContext, overrideContext);
            }
        };
        ArrayVirtualRepeatStrategy.prototype._standardProcessInstanceMutated = function (repeat, array, splices) {
            var _this = this;
            if (repeat.__queuedSplices) {
                for (var i = 0, ii = splices.length; i < ii; ++i) {
                    var _a = splices[i], index = _a.index, removed = _a.removed, addedCount = _a.addedCount;
                    aureliaBinding.mergeSplice(repeat.__queuedSplices, index, removed, addedCount);
                }
                repeat.__array = array.slice(0);
                return;
            }
            var maybePromise = this._runSplices(repeat, array.slice(0), splices);
            if (maybePromise instanceof Promise) {
                var queuedSplices_1 = repeat.__queuedSplices = [];
                var runQueuedSplices_1 = function () {
                    if (!queuedSplices_1.length) {
                        delete repeat.__queuedSplices;
                        delete repeat.__array;
                        return;
                    }
                    var nextPromise = _this._runSplices(repeat, repeat.__array, queuedSplices_1) || Promise.resolve();
                    nextPromise.then(runQueuedSplices_1);
                };
                maybePromise.then(runQueuedSplices_1);
            }
        };
        ArrayVirtualRepeatStrategy.prototype._runSplices = function (repeat, array, splices) {
            var _this = this;
            var removeDelta = 0;
            var rmPromises = [];
            var allSplicesAreInplace = true;
            for (var i = 0; i < splices.length; i++) {
                var splice = splices[i];
                if (splice.removed.length !== splice.addedCount) {
                    allSplicesAreInplace = false;
                    break;
                }
            }
            if (allSplicesAreInplace) {
                for (var i = 0; i < splices.length; i++) {
                    var splice = splices[i];
                    for (var collectionIndex = splice.index; collectionIndex < splice.index + splice.addedCount; collectionIndex++) {
                        if (!this._isIndexBeforeViewSlot(repeat, repeat.viewSlot, collectionIndex)
                            && !this._isIndexAfterViewSlot(repeat, repeat.viewSlot, collectionIndex)) {
                            var viewIndex = this._getViewIndex(repeat, repeat.viewSlot, collectionIndex);
                            var overrideContext = aureliaTemplatingResources.createFullOverrideContext(repeat, array[collectionIndex], collectionIndex, array.length);
                            repeat.removeView(viewIndex, true, true);
                            repeat.insertView(viewIndex, overrideContext.bindingContext, overrideContext);
                        }
                    }
                }
            }
            else {
                for (var i = 0, ii = splices.length; i < ii; ++i) {
                    var splice = splices[i];
                    var removed = splice.removed;
                    var removedLength = removed.length;
                    for (var j = 0, jj = removedLength; j < jj; ++j) {
                        var viewOrPromise = this._removeViewAt(repeat, splice.index + removeDelta + rmPromises.length, true, j, removedLength);
                        if (viewOrPromise instanceof Promise) {
                            rmPromises.push(viewOrPromise);
                        }
                    }
                    removeDelta -= splice.addedCount;
                }
                if (rmPromises.length > 0) {
                    return Promise.all(rmPromises).then(function () {
                        _this._handleAddedSplices(repeat, array, splices);
                        updateVirtualOverrideContexts(repeat, 0);
                    });
                }
                this._handleAddedSplices(repeat, array, splices);
                updateVirtualOverrideContexts(repeat, 0);
            }
            return undefined;
        };
        ArrayVirtualRepeatStrategy.prototype._removeViewAt = function (repeat, collectionIndex, returnToCache, removeIndex, removedLength) {
            var viewOrPromise;
            var view;
            var viewSlot = repeat.viewSlot;
            var viewCount = repeat.viewCount();
            var viewAddIndex;
            var removeMoreThanInDom = removedLength > viewCount;
            if (repeat._viewsLength <= removeIndex) {
                repeat._bottomBufferHeight = repeat._bottomBufferHeight - (repeat.itemHeight);
                repeat._adjustBufferHeights();
                return;
            }
            if (!this._isIndexBeforeViewSlot(repeat, viewSlot, collectionIndex) && !this._isIndexAfterViewSlot(repeat, viewSlot, collectionIndex)) {
                var viewIndex = this._getViewIndex(repeat, viewSlot, collectionIndex);
                viewOrPromise = repeat.removeView(viewIndex, returnToCache);
                if (repeat.items.length > viewCount) {
                    var collectionAddIndex = void 0;
                    if (repeat._bottomBufferHeight > repeat.itemHeight) {
                        viewAddIndex = viewCount;
                        if (!removeMoreThanInDom) {
                            var lastViewItem = repeat._getLastViewItem();
                            collectionAddIndex = repeat.items.indexOf(lastViewItem) + 1;
                        }
                        else {
                            collectionAddIndex = removeIndex;
                        }
                        repeat._bottomBufferHeight = repeat._bottomBufferHeight - (repeat.itemHeight);
                    }
                    else if (repeat._topBufferHeight > 0) {
                        viewAddIndex = 0;
                        collectionAddIndex = repeat._getIndexOfFirstView() - 1;
                        repeat._topBufferHeight = repeat._topBufferHeight - (repeat.itemHeight);
                    }
                    var data = repeat.items[collectionAddIndex];
                    if (data) {
                        var overrideContext = aureliaTemplatingResources.createFullOverrideContext(repeat, data, collectionAddIndex, repeat.items.length);
                        view = repeat.viewFactory.create();
                        view.bind(overrideContext.bindingContext, overrideContext);
                    }
                }
            }
            else if (this._isIndexBeforeViewSlot(repeat, viewSlot, collectionIndex)) {
                if (repeat._bottomBufferHeight > 0) {
                    repeat._bottomBufferHeight = repeat._bottomBufferHeight - (repeat.itemHeight);
                    rebindAndMoveView(repeat, repeat.view(0), repeat.view(0).overrideContext.$index, true);
                }
                else {
                    repeat._topBufferHeight = repeat._topBufferHeight - (repeat.itemHeight);
                }
            }
            else if (this._isIndexAfterViewSlot(repeat, viewSlot, collectionIndex)) {
                repeat._bottomBufferHeight = repeat._bottomBufferHeight - (repeat.itemHeight);
            }
            if (viewOrPromise instanceof Promise) {
                viewOrPromise.then(function () {
                    repeat.viewSlot.insert(viewAddIndex, view);
                    repeat._adjustBufferHeights();
                });
            }
            else if (view) {
                repeat.viewSlot.insert(viewAddIndex, view);
            }
            repeat._adjustBufferHeights();
        };
        ArrayVirtualRepeatStrategy.prototype._isIndexBeforeViewSlot = function (repeat, viewSlot, index) {
            var viewIndex = this._getViewIndex(repeat, viewSlot, index);
            return viewIndex < 0;
        };
        ArrayVirtualRepeatStrategy.prototype._isIndexAfterViewSlot = function (repeat, viewSlot, index) {
            var viewIndex = this._getViewIndex(repeat, viewSlot, index);
            return viewIndex > repeat._viewsLength - 1;
        };
        ArrayVirtualRepeatStrategy.prototype._getViewIndex = function (repeat, viewSlot, index) {
            if (repeat.viewCount() === 0) {
                return -1;
            }
            var topBufferItems = repeat._topBufferHeight / repeat.itemHeight;
            return index - topBufferItems;
        };
        ArrayVirtualRepeatStrategy.prototype._handleAddedSplices = function (repeat, array, splices) {
            var arrayLength = array.length;
            var viewSlot = repeat.viewSlot;
            for (var i = 0, ii = splices.length; i < ii; ++i) {
                var splice = splices[i];
                var addIndex = splice.index;
                var end = splice.index + splice.addedCount;
                for (; addIndex < end; ++addIndex) {
                    var hasDistanceToBottomViewPort = getElementDistanceToBottomViewPort(repeat.templateStrategy.getLastElement(repeat.bottomBuffer)) > 0;
                    if (repeat.viewCount() === 0
                        || (!this._isIndexBeforeViewSlot(repeat, viewSlot, addIndex)
                            && !this._isIndexAfterViewSlot(repeat, viewSlot, addIndex))
                        || hasDistanceToBottomViewPort) {
                        var overrideContext = aureliaTemplatingResources.createFullOverrideContext(repeat, array[addIndex], addIndex, arrayLength);
                        repeat.insertView(addIndex, overrideContext.bindingContext, overrideContext);
                        if (!repeat._hasCalculatedSizes) {
                            repeat._calcInitialHeights(1);
                        }
                        else if (repeat.viewCount() > repeat._viewsLength) {
                            if (hasDistanceToBottomViewPort) {
                                repeat.removeView(0, true, true);
                                repeat._topBufferHeight = repeat._topBufferHeight + repeat.itemHeight;
                                repeat._adjustBufferHeights();
                            }
                            else {
                                repeat.removeView(repeat.viewCount() - 1, true, true);
                                repeat._bottomBufferHeight = repeat._bottomBufferHeight + repeat.itemHeight;
                            }
                        }
                    }
                    else if (this._isIndexBeforeViewSlot(repeat, viewSlot, addIndex)) {
                        repeat._topBufferHeight = repeat._topBufferHeight + repeat.itemHeight;
                    }
                    else if (this._isIndexAfterViewSlot(repeat, viewSlot, addIndex)) {
                        repeat._bottomBufferHeight = repeat._bottomBufferHeight + repeat.itemHeight;
                        repeat.isLastIndex = false;
                    }
                }
            }
            repeat._adjustBufferHeights();
        };
        return ArrayVirtualRepeatStrategy;
    }(aureliaTemplatingResources.ArrayRepeatStrategy));

    var NullVirtualRepeatStrategy = (function (_super) {
        __extends(NullVirtualRepeatStrategy, _super);
        function NullVirtualRepeatStrategy() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        NullVirtualRepeatStrategy.prototype.instanceMutated = function () {
        };
        NullVirtualRepeatStrategy.prototype.instanceChanged = function (repeat) {
            _super.prototype.instanceChanged.call(this, repeat);
            repeat._resetCalculation();
        };
        return NullVirtualRepeatStrategy;
    }(aureliaTemplatingResources.NullRepeatStrategy));

    var VirtualRepeatStrategyLocator = (function (_super) {
        __extends(VirtualRepeatStrategyLocator, _super);
        function VirtualRepeatStrategyLocator() {
            var _this = _super.call(this) || this;
            _this.matchers = [];
            _this.strategies = [];
            _this.addStrategy(function (items) { return items === null || items === undefined; }, new NullVirtualRepeatStrategy());
            _this.addStrategy(function (items) { return items instanceof Array; }, new ArrayVirtualRepeatStrategy());
            return _this;
        }
        VirtualRepeatStrategyLocator.prototype.getStrategy = function (items) {
            return _super.prototype.getStrategy.call(this, items);
        };
        return VirtualRepeatStrategyLocator;
    }(aureliaTemplatingResources.RepeatStrategyLocator));

    var TemplateStrategyLocator = (function () {
        function TemplateStrategyLocator(container) {
            this.container = container;
        }
        TemplateStrategyLocator.prototype.getStrategy = function (element) {
            var parent = element.parentNode;
            if (parent === null) {
                return this.container.get(DefaultTemplateStrategy);
            }
            var parentTagName = parent.tagName;
            if (parentTagName === 'TBODY' || parentTagName === 'THEAD' || parentTagName === 'TFOOT') {
                return this.container.get(TableRowStrategy);
            }
            if (parentTagName === 'TABLE') {
                return this.container.get(TableBodyStrategy);
            }
            return this.container.get(DefaultTemplateStrategy);
        };
        TemplateStrategyLocator.inject = [aureliaDependencyInjection.Container];
        return TemplateStrategyLocator;
    }());
    var TableBodyStrategy = (function () {
        function TableBodyStrategy() {
        }
        TableBodyStrategy.prototype.getScrollContainer = function (element) {
            return this.getTable(element).parentNode;
        };
        TableBodyStrategy.prototype.moveViewFirst = function (view, topBuffer) {
            insertBeforeNode(view, aureliaPal.DOM.nextElementSibling(topBuffer));
        };
        TableBodyStrategy.prototype.moveViewLast = function (view, bottomBuffer) {
            var previousSibling = bottomBuffer.previousSibling;
            var referenceNode = previousSibling.nodeType === 8 && previousSibling.data === 'anchor' ? previousSibling : bottomBuffer;
            insertBeforeNode(view, referenceNode);
        };
        TableBodyStrategy.prototype.createTopBufferElement = function (element) {
            return element.parentNode.insertBefore(aureliaPal.DOM.createElement('tr'), element);
        };
        TableBodyStrategy.prototype.createBottomBufferElement = function (element) {
            return element.parentNode.insertBefore(aureliaPal.DOM.createElement('tr'), element.nextSibling);
        };
        TableBodyStrategy.prototype.removeBufferElements = function (element, topBuffer, bottomBuffer) {
            aureliaPal.DOM.removeNode(topBuffer);
            aureliaPal.DOM.removeNode(bottomBuffer);
        };
        TableBodyStrategy.prototype.getFirstElement = function (topBuffer) {
            return topBuffer.nextElementSibling;
        };
        TableBodyStrategy.prototype.getLastElement = function (bottomBuffer) {
            return bottomBuffer.previousElementSibling;
        };
        TableBodyStrategy.prototype.getTopBufferDistance = function (topBuffer) {
            return 0;
        };
        TableBodyStrategy.prototype.getTable = function (element) {
            return element.parentNode;
        };
        return TableBodyStrategy;
    }());
    var TableRowStrategy = (function () {
        function TableRowStrategy(domHelper) {
            this.domHelper = domHelper;
        }
        TableRowStrategy.prototype.getScrollContainer = function (element) {
            return this.getTable(element).parentNode;
        };
        TableRowStrategy.prototype.moveViewFirst = function (view, topBuffer) {
            insertBeforeNode(view, topBuffer.nextElementSibling);
        };
        TableRowStrategy.prototype.moveViewLast = function (view, bottomBuffer) {
            var previousSibling = bottomBuffer.previousSibling;
            var referenceNode = previousSibling.nodeType === 8 && previousSibling.data === 'anchor' ? previousSibling : bottomBuffer;
            insertBeforeNode(view, referenceNode);
        };
        TableRowStrategy.prototype.createTopBufferElement = function (element) {
            return element.parentNode.insertBefore(aureliaPal.DOM.createElement('tr'), element);
        };
        TableRowStrategy.prototype.createBottomBufferElement = function (element) {
            return element.parentNode.insertBefore(aureliaPal.DOM.createElement('tr'), element.nextSibling);
        };
        TableRowStrategy.prototype.removeBufferElements = function (element, topBuffer, bottomBuffer) {
            aureliaPal.DOM.removeNode(topBuffer);
            aureliaPal.DOM.removeNode(bottomBuffer);
        };
        TableRowStrategy.prototype.getFirstElement = function (topBuffer) {
            return topBuffer.nextElementSibling;
        };
        TableRowStrategy.prototype.getLastElement = function (bottomBuffer) {
            return bottomBuffer.previousElementSibling;
        };
        TableRowStrategy.prototype.getTopBufferDistance = function (topBuffer) {
            return 0;
        };
        TableRowStrategy.prototype.getTable = function (element) {
            return element.parentNode.parentNode;
        };
        TableRowStrategy.inject = [DomHelper];
        return TableRowStrategy;
    }());
    var DefaultTemplateStrategy = (function () {
        function DefaultTemplateStrategy() {
        }
        DefaultTemplateStrategy.prototype.getScrollContainer = function (element) {
            return element.parentNode;
        };
        DefaultTemplateStrategy.prototype.moveViewFirst = function (view, topBuffer) {
            insertBeforeNode(view, aureliaPal.DOM.nextElementSibling(topBuffer));
        };
        DefaultTemplateStrategy.prototype.moveViewLast = function (view, bottomBuffer) {
            var previousSibling = bottomBuffer.previousSibling;
            var referenceNode = previousSibling.nodeType === 8 && previousSibling.data === 'anchor' ? previousSibling : bottomBuffer;
            insertBeforeNode(view, referenceNode);
        };
        DefaultTemplateStrategy.prototype.createTopBufferElement = function (element) {
            var elementName = /^[UO]L$/.test(element.parentNode.tagName) ? 'li' : 'div';
            var buffer = aureliaPal.DOM.createElement(elementName);
            element.parentNode.insertBefore(buffer, element);
            return buffer;
        };
        DefaultTemplateStrategy.prototype.createBottomBufferElement = function (element) {
            var elementName = /^[UO]L$/.test(element.parentNode.tagName) ? 'li' : 'div';
            var buffer = aureliaPal.DOM.createElement(elementName);
            element.parentNode.insertBefore(buffer, element.nextSibling);
            return buffer;
        };
        DefaultTemplateStrategy.prototype.removeBufferElements = function (element, topBuffer, bottomBuffer) {
            element.parentNode.removeChild(topBuffer);
            element.parentNode.removeChild(bottomBuffer);
        };
        DefaultTemplateStrategy.prototype.getFirstElement = function (topBuffer) {
            return aureliaPal.DOM.nextElementSibling(topBuffer);
        };
        DefaultTemplateStrategy.prototype.getLastElement = function (bottomBuffer) {
            return bottomBuffer.previousElementSibling;
        };
        DefaultTemplateStrategy.prototype.getTopBufferDistance = function (topBuffer) {
            return 0;
        };
        return DefaultTemplateStrategy;
    }());

    var VirtualRepeat = (function (_super) {
        __extends(VirtualRepeat, _super);
        function VirtualRepeat(element, viewFactory, instruction, viewSlot, viewResources, observerLocator, strategyLocator, templateStrategyLocator, domHelper) {
            var _this = _super.call(this, {
                local: 'item',
                viewsRequireLifecycle: aureliaTemplatingResources.viewsRequireLifecycle(viewFactory)
            }) || this;
            _this._first = 0;
            _this._previousFirst = 0;
            _this._viewsLength = 0;
            _this._lastRebind = 0;
            _this._topBufferHeight = 0;
            _this._bottomBufferHeight = 0;
            _this._bufferSize = 0;
            _this._scrollingDown = false;
            _this._scrollingUp = false;
            _this._switchedDirection = false;
            _this._isAttached = false;
            _this._ticking = false;
            _this._fixedHeightContainer = false;
            _this._hasCalculatedSizes = false;
            _this._isAtTop = true;
            _this._calledGetMore = false;
            _this._skipNextScrollHandle = false;
            _this._handlingMutations = false;
            _this._isScrolling = false;
            _this.element = element;
            _this.viewFactory = viewFactory;
            _this.instruction = instruction;
            _this.viewSlot = viewSlot;
            _this.lookupFunctions = viewResources['lookupFunctions'];
            _this.observerLocator = observerLocator;
            _this.taskQueue = observerLocator.taskQueue;
            _this.strategyLocator = strategyLocator;
            _this.templateStrategyLocator = templateStrategyLocator;
            _this.sourceExpression = aureliaTemplatingResources.getItemsSourceExpression(_this.instruction, 'virtual-repeat.for');
            _this.isOneTime = aureliaTemplatingResources.isOneTime(_this.sourceExpression);
            _this.domHelper = domHelper;
            return _this;
        }
        VirtualRepeat.inject = function () {
            return [aureliaPal.DOM.Element, aureliaTemplating.BoundViewFactory, aureliaTemplating.TargetInstruction, aureliaTemplating.ViewSlot, aureliaTemplating.ViewResources, aureliaBinding.ObserverLocator, VirtualRepeatStrategyLocator, TemplateStrategyLocator, DomHelper];
        };
        VirtualRepeat.$resource = function () {
            return {
                type: 'attribute',
                name: 'virtual-repeat',
                templateController: true,
                bindables: ['items', 'local']
            };
        };
        VirtualRepeat.prototype.bind = function (bindingContext, overrideContext) {
            this.scope = { bindingContext: bindingContext, overrideContext: overrideContext };
        };
        VirtualRepeat.prototype.attached = function () {
            var _this = this;
            this._isAttached = true;
            this._itemsLength = this.items.length;
            var element = this.element;
            var templateStrategy = this.templateStrategy = this.templateStrategyLocator.getStrategy(element);
            var scrollListener = this.scrollListener = function () { return _this._onScroll(); };
            var scrollContainer = this.scrollContainer = templateStrategy.getScrollContainer(element);
            var topBuffer = this.topBuffer = templateStrategy.createTopBufferElement(element);
            this.bottomBuffer = templateStrategy.createBottomBufferElement(element);
            this.itemsChanged();
            this._calcDistanceToTopInterval = aureliaPal.PLATFORM.global.setInterval(function () {
                var prevDistanceToTop = _this.distanceToTop;
                var currDistanceToTop = _this.domHelper.getElementDistanceToTopOfDocument(topBuffer) + _this.topBufferDistance;
                _this.distanceToTop = currDistanceToTop;
                if (prevDistanceToTop !== currDistanceToTop) {
                    _this._handleScroll();
                }
            }, 500);
            this.topBufferDistance = templateStrategy.getTopBufferDistance(topBuffer);
            this.distanceToTop = this.domHelper
                .getElementDistanceToTopOfDocument(templateStrategy.getFirstElement(topBuffer));
            if (this.domHelper.hasOverflowScroll(scrollContainer)) {
                this._fixedHeightContainer = true;
                scrollContainer.addEventListener('scroll', scrollListener);
            }
            else {
                document.addEventListener('scroll', scrollListener);
            }
            if (this.items.length < this.elementsInView && this.isLastIndex === undefined) {
                this._getMore(true);
            }
        };
        VirtualRepeat.prototype.call = function (context, changes) {
            this[context](this.items, changes);
        };
        VirtualRepeat.prototype.detached = function () {
            if (this.domHelper.hasOverflowScroll(this.scrollContainer)) {
                this.scrollContainer.removeEventListener('scroll', this.scrollListener);
            }
            else {
                document.removeEventListener('scroll', this.scrollListener);
            }
            this.isLastIndex = undefined;
            this._fixedHeightContainer = false;
            this._resetCalculation();
            this._isAttached = false;
            this._itemsLength = 0;
            this.templateStrategy.removeBufferElements(this.element, this.topBuffer, this.bottomBuffer);
            this.topBuffer = this.bottomBuffer = this.scrollContainer = this.scrollListener = null;
            this.scrollContainerHeight = 0;
            this.distanceToTop = 0;
            this.removeAllViews(true, false);
            this._unsubscribeCollection();
            clearInterval(this._calcDistanceToTopInterval);
            if (this._sizeInterval) {
                clearInterval(this._sizeInterval);
            }
        };
        VirtualRepeat.prototype.unbind = function () {
            this.scope = null;
            this.items = null;
            this._itemsLength = 0;
        };
        VirtualRepeat.prototype.itemsChanged = function () {
            this._unsubscribeCollection();
            if (!this.scope || !this._isAttached) {
                return;
            }
            var reducingItems = false;
            var previousLastViewIndex = this._getIndexOfLastView();
            var items = this.items;
            var shouldCalculateSize = !!items;
            this.strategy = this.strategyLocator.getStrategy(items);
            if (shouldCalculateSize) {
                if (items.length > 0 && this.viewCount() === 0) {
                    this.strategy.createFirstItem(this);
                }
                if (this._itemsLength >= items.length) {
                    this._skipNextScrollHandle = true;
                    reducingItems = true;
                }
                this._checkFixedHeightContainer();
                this._calcInitialHeights(items.length);
            }
            if (!this.isOneTime && !this._observeInnerCollection()) {
                this._observeCollection();
            }
            this.strategy.instanceChanged(this, items, this._first);
            if (shouldCalculateSize) {
                this._lastRebind = this._first;
                if (reducingItems && previousLastViewIndex > this.items.length - 1) {
                    if (this.scrollContainer.tagName === 'TBODY') {
                        var realScrollContainer = this.scrollContainer.parentNode.parentNode;
                        realScrollContainer.scrollTop = realScrollContainer.scrollTop + (this.viewCount() * this.itemHeight);
                    }
                    else {
                        this.scrollContainer.scrollTop = this.scrollContainer.scrollTop + (this.viewCount() * this.itemHeight);
                    }
                }
                if (!reducingItems) {
                    this._previousFirst = this._first;
                    this._scrollingDown = true;
                    this._scrollingUp = false;
                    this.isLastIndex = this._getIndexOfLastView() >= this.items.length - 1;
                }
                this._handleScroll();
            }
        };
        VirtualRepeat.prototype.handleCollectionMutated = function (collection, changes) {
            if (this.ignoreMutation) {
                return;
            }
            this._handlingMutations = true;
            this._itemsLength = collection.length;
            this.strategy.instanceMutated(this, collection, changes);
        };
        VirtualRepeat.prototype.handleInnerCollectionMutated = function (collection, changes) {
            var _this = this;
            if (this.ignoreMutation) {
                return;
            }
            this.ignoreMutation = true;
            var newItems = this.sourceExpression.evaluate(this.scope, this.lookupFunctions);
            this.taskQueue.queueMicroTask(function () { return _this.ignoreMutation = false; });
            if (newItems === this.items) {
                this.itemsChanged();
            }
            else {
                this.items = newItems;
            }
        };
        VirtualRepeat.prototype._resetCalculation = function () {
            this._first = 0;
            this._previousFirst = 0;
            this._viewsLength = 0;
            this._lastRebind = 0;
            this._topBufferHeight = 0;
            this._bottomBufferHeight = 0;
            this._scrollingDown = false;
            this._scrollingUp = false;
            this._switchedDirection = false;
            this._ticking = false;
            this._hasCalculatedSizes = false;
            this._isAtTop = true;
            this.isLastIndex = false;
            this.elementsInView = 0;
            this._adjustBufferHeights();
        };
        VirtualRepeat.prototype._onScroll = function () {
            var _this = this;
            if (!this._ticking && !this._handlingMutations) {
                requestAnimationFrame(function () {
                    _this._handleScroll();
                    _this._ticking = false;
                });
                this._ticking = true;
            }
            if (this._handlingMutations) {
                this._handlingMutations = false;
            }
        };
        VirtualRepeat.prototype._handleScroll = function () {
            if (!this._isAttached) {
                return;
            }
            if (this._skipNextScrollHandle) {
                this._skipNextScrollHandle = false;
                return;
            }
            if (!this.items) {
                return;
            }
            var itemHeight = this.itemHeight;
            var scrollTop = this._fixedHeightContainer
                ? this.scrollContainer.scrollTop
                : (pageYOffset - this.distanceToTop);
            var firstViewIndex = itemHeight > 0 ? Math.floor(scrollTop / itemHeight) : 0;
            this._first = firstViewIndex < 0 ? 0 : firstViewIndex;
            if (this._first > this.items.length - this.elementsInView) {
                firstViewIndex = this.items.length - this.elementsInView;
                this._first = firstViewIndex < 0 ? 0 : firstViewIndex;
            }
            this._checkScrolling();
            var currentTopBufferHeight = this._topBufferHeight;
            var currentBottomBufferHeight = this._bottomBufferHeight;
            if (this._scrollingDown) {
                var viewsToMoveCount = this._first - this._lastRebind;
                if (this._switchedDirection) {
                    viewsToMoveCount = this._isAtTop ? this._first : this._bufferSize - (this._lastRebind - this._first);
                }
                this._isAtTop = false;
                this._lastRebind = this._first;
                var movedViewsCount = this._moveViews(viewsToMoveCount);
                var adjustHeight = movedViewsCount < viewsToMoveCount ? currentBottomBufferHeight : itemHeight * movedViewsCount;
                if (viewsToMoveCount > 0) {
                    this._getMore();
                }
                this._switchedDirection = false;
                this._topBufferHeight = currentTopBufferHeight + adjustHeight;
                this._bottomBufferHeight = $max(currentBottomBufferHeight - adjustHeight, 0);
                if (this._bottomBufferHeight >= 0) {
                    this._adjustBufferHeights();
                }
            }
            else if (this._scrollingUp) {
                var viewsToMoveCount = this._lastRebind - this._first;
                var initialScrollState = this.isLastIndex === undefined;
                if (this._switchedDirection) {
                    if (this.isLastIndex) {
                        viewsToMoveCount = this.items.length - this._first - this.elementsInView;
                    }
                    else {
                        viewsToMoveCount = this._bufferSize - (this._first - this._lastRebind);
                    }
                }
                this.isLastIndex = false;
                this._lastRebind = this._first;
                var movedViewsCount = this._moveViews(viewsToMoveCount);
                this.movedViewsCount = movedViewsCount;
                var adjustHeight = movedViewsCount < viewsToMoveCount
                    ? currentTopBufferHeight
                    : itemHeight * movedViewsCount;
                if (viewsToMoveCount > 0) {
                    var force = this.movedViewsCount === 0 && initialScrollState && this._first <= 0 ? true : false;
                    this._getMore(force);
                }
                this._switchedDirection = false;
                this._topBufferHeight = $max(currentTopBufferHeight - adjustHeight, 0);
                this._bottomBufferHeight = currentBottomBufferHeight + adjustHeight;
                if (this._topBufferHeight >= 0) {
                    this._adjustBufferHeights();
                }
            }
            this._previousFirst = this._first;
            this._isScrolling = false;
        };
        VirtualRepeat.prototype._getMore = function (force) {
            var _this = this;
            if (this.isLastIndex || this._first === 0 || force === true) {
                if (!this._calledGetMore) {
                    var executeGetMore = function () {
                        _this._calledGetMore = true;
                        var firstView = _this._getFirstView();
                        var scrollNextAttrName = 'infinite-scroll-next';
                        var func = (firstView
                            && firstView.firstChild
                            && firstView.firstChild.au
                            && firstView.firstChild.au[scrollNextAttrName])
                            ? firstView.firstChild.au[scrollNextAttrName].instruction.attributes[scrollNextAttrName]
                            : undefined;
                        var topIndex = _this._first;
                        var isAtBottom = _this._bottomBufferHeight === 0;
                        var isAtTop = _this._isAtTop;
                        var scrollContext = {
                            topIndex: topIndex,
                            isAtBottom: isAtBottom,
                            isAtTop: isAtTop
                        };
                        var overrideContext = _this.scope.overrideContext;
                        overrideContext.$scrollContext = scrollContext;
                        if (func === undefined) {
                            _this._calledGetMore = false;
                            return null;
                        }
                        else if (typeof func === 'string') {
                            var getMoreFuncName = firstView.firstChild.getAttribute(scrollNextAttrName);
                            var funcCall = overrideContext.bindingContext[getMoreFuncName];
                            if (typeof funcCall === 'function') {
                                var result = funcCall.call(overrideContext.bindingContext, topIndex, isAtBottom, isAtTop);
                                if (!(result instanceof Promise)) {
                                    _this._calledGetMore = false;
                                }
                                else {
                                    return result.then(function () {
                                        _this._calledGetMore = false;
                                    });
                                }
                            }
                            else {
                                throw new Error("'" + scrollNextAttrName + "' must be a function or evaluate to one");
                            }
                        }
                        else if (func.sourceExpression) {
                            _this._calledGetMore = false;
                            return func.sourceExpression.evaluate(_this.scope);
                        }
                        else {
                            throw new Error("'" + scrollNextAttrName + "' must be a function or evaluate to one");
                        }
                        return null;
                    };
                    this.taskQueue.queueMicroTask(executeGetMore);
                }
            }
        };
        VirtualRepeat.prototype._checkScrolling = function () {
            if (this._first > this._previousFirst && (this._bottomBufferHeight > 0 || !this.isLastIndex)) {
                if (!this._scrollingDown) {
                    this._scrollingDown = true;
                    this._scrollingUp = false;
                    this._switchedDirection = true;
                }
                else {
                    this._switchedDirection = false;
                }
                this._isScrolling = true;
            }
            else if (this._first < this._previousFirst && (this._topBufferHeight >= 0 || !this._isAtTop)) {
                if (!this._scrollingUp) {
                    this._scrollingDown = false;
                    this._scrollingUp = true;
                    this._switchedDirection = true;
                }
                else {
                    this._switchedDirection = false;
                }
                this._isScrolling = true;
            }
            else {
                this._isScrolling = false;
            }
        };
        VirtualRepeat.prototype._checkFixedHeightContainer = function () {
            if (this.domHelper.hasOverflowScroll(this.scrollContainer)) {
                this._fixedHeightContainer = true;
            }
        };
        VirtualRepeat.prototype._adjustBufferHeights = function () {
            this.topBuffer.style.height = this._topBufferHeight + "px";
            this.bottomBuffer.style.height = this._bottomBufferHeight + "px";
        };
        VirtualRepeat.prototype._unsubscribeCollection = function () {
            var collectionObserver = this.collectionObserver;
            if (collectionObserver) {
                collectionObserver.unsubscribe(this.callContext, this);
                this.collectionObserver = this.callContext = null;
            }
        };
        VirtualRepeat.prototype._getFirstView = function () {
            return this.view(0);
        };
        VirtualRepeat.prototype._getLastView = function () {
            return this.view(this.viewCount() - 1);
        };
        VirtualRepeat.prototype._moveViews = function (viewsCount) {
            var getNextIndex = this._scrollingDown ? $plus : $minus;
            var childrenCount = this.viewCount();
            var viewIndex = this._scrollingDown ? 0 : childrenCount - 1;
            var items = this.items;
            var currentIndex = this._scrollingDown ? this._getIndexOfLastView() + 1 : this._getIndexOfFirstView() - 1;
            var i = 0;
            var viewToMoveLimit = viewsCount - (childrenCount * 2);
            while (i < viewsCount && !this._isAtFirstOrLastIndex) {
                var view = this.view(viewIndex);
                var nextIndex = getNextIndex(currentIndex, i);
                this.isLastIndex = nextIndex > items.length - 2;
                this._isAtTop = nextIndex < 1;
                if (!(this._isAtFirstOrLastIndex && childrenCount >= items.length)) {
                    if (i > viewToMoveLimit) {
                        rebindAndMoveView(this, view, nextIndex, this._scrollingDown);
                    }
                    i++;
                }
            }
            return viewsCount - (viewsCount - i);
        };
        Object.defineProperty(VirtualRepeat.prototype, "_isAtFirstOrLastIndex", {
            get: function () {
                return this._scrollingDown ? this.isLastIndex : this._isAtTop;
            },
            enumerable: true,
            configurable: true
        });
        VirtualRepeat.prototype._getIndexOfLastView = function () {
            var lastView = this._getLastView();
            return lastView === null ? -1 : lastView.overrideContext.$index;
        };
        VirtualRepeat.prototype._getLastViewItem = function () {
            var lastView = this._getLastView();
            return lastView === null ? undefined : lastView.bindingContext[this.local];
        };
        VirtualRepeat.prototype._getIndexOfFirstView = function () {
            var firstView = this._getFirstView();
            return firstView === null ? -1 : firstView.overrideContext.$index;
        };
        VirtualRepeat.prototype._calcInitialHeights = function (itemsLength) {
            var _this = this;
            var isSameLength = this._viewsLength > 0 && this._itemsLength === itemsLength;
            if (isSameLength) {
                return;
            }
            if (itemsLength < 1) {
                this._resetCalculation();
                return;
            }
            this._hasCalculatedSizes = true;
            var firstViewElement = this.view(0).lastChild;
            this.itemHeight = calcOuterHeight(firstViewElement);
            if (this.itemHeight <= 0) {
                this._sizeInterval = aureliaPal.PLATFORM.global.setInterval(function () {
                    var newCalcSize = calcOuterHeight(firstViewElement);
                    if (newCalcSize > 0) {
                        aureliaPal.PLATFORM.global.clearInterval(_this._sizeInterval);
                        _this.itemsChanged();
                    }
                }, 500);
                return;
            }
            this._itemsLength = itemsLength;
            this.scrollContainerHeight = this._fixedHeightContainer
                ? this._calcScrollHeight(this.scrollContainer)
                : document.documentElement.clientHeight;
            this.elementsInView = Math.ceil(this.scrollContainerHeight / this.itemHeight) + 1;
            var viewsCount = this._viewsLength = (this.elementsInView * 2) + this._bufferSize;
            var newBottomBufferHeight = this.itemHeight * (itemsLength - viewsCount);
            if (newBottomBufferHeight < 0) {
                newBottomBufferHeight = 0;
            }
            if (this._topBufferHeight >= newBottomBufferHeight) {
                this._topBufferHeight = newBottomBufferHeight;
                this._bottomBufferHeight = 0;
                this._first = this._itemsLength - viewsCount;
                if (this._first < 0) {
                    this._first = 0;
                }
            }
            else {
                this._first = this._getIndexOfFirstView();
                var adjustedTopBufferHeight = this._first * this.itemHeight;
                this._topBufferHeight = adjustedTopBufferHeight;
                this._bottomBufferHeight = newBottomBufferHeight - adjustedTopBufferHeight;
                if (this._bottomBufferHeight < 0) {
                    this._bottomBufferHeight = 0;
                }
            }
            this._adjustBufferHeights();
        };
        VirtualRepeat.prototype._calcScrollHeight = function (element) {
            var height = element.getBoundingClientRect().height;
            height -= getStyleValues(element, 'borderTopWidth', 'borderBottomWidth');
            return height;
        };
        VirtualRepeat.prototype._observeInnerCollection = function () {
            var items = this._getInnerCollection();
            var strategy = this.strategyLocator.getStrategy(items);
            if (!strategy) {
                return false;
            }
            var collectionObserver = strategy.getCollectionObserver(this.observerLocator, items);
            if (!collectionObserver) {
                return false;
            }
            var context = "handleInnerCollectionMutated";
            this.collectionObserver = collectionObserver;
            this.callContext = context;
            collectionObserver.subscribe(context, this);
            return true;
        };
        VirtualRepeat.prototype._getInnerCollection = function () {
            var expression = aureliaTemplatingResources.unwrapExpression(this.sourceExpression);
            if (!expression) {
                return null;
            }
            return expression.evaluate(this.scope, null);
        };
        VirtualRepeat.prototype._observeCollection = function () {
            var collectionObserver = this.strategy.getCollectionObserver(this.observerLocator, this.items);
            if (collectionObserver) {
                this.callContext = "handleCollectionMutated";
                this.collectionObserver = collectionObserver;
                collectionObserver.subscribe(this.callContext, this);
            }
        };
        VirtualRepeat.prototype.viewCount = function () {
            return this.viewSlot.children.length;
        };
        VirtualRepeat.prototype.views = function () {
            return this.viewSlot.children;
        };
        VirtualRepeat.prototype.view = function (index) {
            var viewSlot = this.viewSlot;
            return index < 0 || index > viewSlot.children.length - 1 ? null : viewSlot.children[index];
        };
        VirtualRepeat.prototype.addView = function (bindingContext, overrideContext) {
            var view = this.viewFactory.create();
            view.bind(bindingContext, overrideContext);
            this.viewSlot.add(view);
        };
        VirtualRepeat.prototype.insertView = function (index, bindingContext, overrideContext) {
            var view = this.viewFactory.create();
            view.bind(bindingContext, overrideContext);
            this.viewSlot.insert(index, view);
        };
        VirtualRepeat.prototype.removeAllViews = function (returnToCache, skipAnimation) {
            return this.viewSlot.removeAll(returnToCache, skipAnimation);
        };
        VirtualRepeat.prototype.removeView = function (index, returnToCache, skipAnimation) {
            return this.viewSlot.removeAt(index, returnToCache, skipAnimation);
        };
        VirtualRepeat.prototype.updateBindings = function (view) {
            var j = view.bindings.length;
            while (j--) {
                aureliaTemplatingResources.updateOneTimeBinding(view.bindings[j]);
            }
            j = view.controllers.length;
            while (j--) {
                var k = view.controllers[j].boundProperties.length;
                while (k--) {
                    var binding = view.controllers[j].boundProperties[k].binding;
                    aureliaTemplatingResources.updateOneTimeBinding(binding);
                }
            }
        };
        return VirtualRepeat;
    }(aureliaTemplatingResources.AbstractRepeater));
    var $minus = function (index, i) { return index - i; };
    var $plus = function (index, i) { return index + i; };
    var $max = Math.max;

    var InfiniteScrollNext = (function () {
        function InfiniteScrollNext() {
        }
        InfiniteScrollNext.$resource = function () {
            return {
                type: 'attribute',
                name: 'infinite-scroll-next'
            };
        };
        return InfiniteScrollNext;
    }());

    function configure(config) {
        config.globalResources(VirtualRepeat, InfiniteScrollNext);
    }

    exports.configure = configure;
    exports.VirtualRepeat = VirtualRepeat;
    exports.InfiniteScrollNext = InfiniteScrollNext;

    Object.defineProperty(exports, '__esModule', { value: true });

});
