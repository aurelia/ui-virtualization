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

    var rebindView = function (repeat, view, collectionIndex, collection) {
        view.bindingContext[repeat.local] = collection[collectionIndex];
        aureliaTemplatingResources.updateOverrideContext(view.overrideContext, collectionIndex, collection.length);
    };
    var rebindAndMoveView = function (repeat, view, index, moveToBottom) {
        var items = repeat.items;
        var viewSlot = repeat.viewSlot;
        aureliaTemplatingResources.updateOverrideContext(view.overrideContext, index, items.length);
        view.bindingContext[repeat.local] = items[index];
        if (moveToBottom) {
            viewSlot.children.push(viewSlot.children.shift());
            repeat.templateStrategy.moveViewLast(view, repeat.bottomBufferEl);
        }
        else {
            viewSlot.children.unshift(viewSlot.children.splice(-1, 1)[0]);
            repeat.templateStrategy.moveViewFirst(view, repeat.topBufferEl);
        }
    };
    var calcMinViewsRequired = function (scrollerHeight, itemHeight) {
        return Math$floor(scrollerHeight / itemHeight) + 1;
    };
    var Math$abs = Math.abs;
    var Math$max = Math.max;
    var Math$min = Math.min;
    var Math$round = Math.round;
    var Math$floor = Math.floor;
    var $isNaN = isNaN;

    var doc = document;
    var htmlElement = doc.documentElement;
    var $raf = requestAnimationFrame;

    var getScrollerElement = function (element) {
        var current = element.parentNode;
        while (current !== null && current !== htmlElement) {
            if (hasOverflowScroll(current)) {
                return current;
            }
            current = current.parentNode;
        }
        return doc.scrollingElement || htmlElement;
    };
    var getElementDistanceToTopOfDocument = function (element) {
        var box = element.getBoundingClientRect();
        var scrollTop = window.pageYOffset;
        var clientTop = htmlElement.clientTop;
        var top = box.top + scrollTop - clientTop;
        return Math$round(top);
    };
    var hasOverflowScroll = function (element) {
        var style = window.getComputedStyle(element);
        return style && (style.overflowY === 'scroll' || style.overflow === 'scroll' || style.overflowY === 'auto' || style.overflow === 'auto');
    };
    var getStyleValues = function (element) {
        var styles = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            styles[_i - 1] = arguments[_i];
        }
        var currentStyle = window.getComputedStyle(element);
        var value = 0;
        var styleValue = 0;
        for (var i = 0, ii = styles.length; ii > i; ++i) {
            styleValue = parseFloat(currentStyle[styles[i]]);
            value += $isNaN(styleValue) ? 0 : styleValue;
        }
        return value;
    };
    var calcOuterHeight = function (element) {
        var height = element.getBoundingClientRect().height;
        height += getStyleValues(element, 'marginTop', 'marginBottom');
        return height;
    };
    var calcScrollHeight = function (element) {
        var height = element.getBoundingClientRect().height;
        height -= getStyleValues(element, 'borderTopWidth', 'borderBottomWidth');
        return height;
    };
    var insertBeforeNode = function (view, bottomBuffer) {
        bottomBuffer.parentNode.insertBefore(view.lastChild, bottomBuffer);
    };
    var getDistanceToParent = function (child, parent) {
        var offsetParent = child.offsetParent;
        var childOffsetTop = child.offsetTop;
        if (offsetParent === null || offsetParent === parent) {
            return childOffsetTop;
        }
        else {
            if (offsetParent.contains(parent)) {
                return childOffsetTop - parent.offsetTop;
            }
            else {
                return childOffsetTop + getDistanceToParent(offsetParent, parent);
            }
        }
    };

    var ArrayVirtualRepeatStrategy = (function (_super) {
        __extends(ArrayVirtualRepeatStrategy, _super);
        function ArrayVirtualRepeatStrategy() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        ArrayVirtualRepeatStrategy.prototype.createFirstRow = function (repeat) {
            var overrideContext = aureliaTemplatingResources.createFullOverrideContext(repeat, repeat.items[0], 0, 1);
            return repeat.addView(overrideContext.bindingContext, overrideContext);
        };
        ArrayVirtualRepeatStrategy.prototype.count = function (items) {
            return items.length;
        };
        ArrayVirtualRepeatStrategy.prototype.initCalculation = function (repeat, items) {
            var itemCount = items.length;
            if (!(itemCount > 0)) {
                return 1;
            }
            var scrollerInfo = repeat.getScrollerInfo();
            var existingViewCount = repeat.viewCount();
            if (itemCount > 0 && existingViewCount === 0) {
                this.createFirstRow(repeat);
            }
            var firstView = repeat.firstView();
            var itemHeight = calcOuterHeight(firstView.firstChild);
            if (itemHeight === 0) {
                return 0;
            }
            repeat.itemHeight = itemHeight;
            var scroll_el_height = scrollerInfo.height;
            var elementsInView = repeat.minViewsRequired = calcMinViewsRequired(scroll_el_height, itemHeight);
            return 2 | 4;
        };
        ArrayVirtualRepeatStrategy.prototype.onAttached = function (repeat) {
            if (repeat.items.length < repeat.minViewsRequired) {
                repeat.getMore(0, true, this.isNearBottom(repeat, repeat.lastViewIndex()), true);
            }
        };
        ArrayVirtualRepeatStrategy.prototype.getViewRange = function (repeat, scrollerInfo) {
            var topBufferEl = repeat.topBufferEl;
            var scrollerEl = repeat.scrollerEl;
            var itemHeight = repeat.itemHeight;
            var realScrollTop = 0;
            var isFixedHeightContainer = scrollerInfo.scroller !== htmlElement;
            if (isFixedHeightContainer) {
                var topBufferDistance = getDistanceToParent(topBufferEl, scrollerEl);
                var scrollerScrollTop = scrollerInfo.scrollTop;
                realScrollTop = Math$max(0, scrollerScrollTop - Math$abs(topBufferDistance));
            }
            else {
                realScrollTop = pageYOffset - repeat.distanceToTop;
            }
            var realViewCount = repeat.minViewsRequired * 2;
            var firstVisibleIndex = Math$max(0, itemHeight > 0 ? Math$floor(realScrollTop / itemHeight) : 0);
            var lastVisibleIndex = Math$min(repeat.items.length - 1, firstVisibleIndex + (realViewCount - 1));
            firstVisibleIndex = Math$max(0, Math$min(firstVisibleIndex, lastVisibleIndex - (realViewCount - 1)));
            return [firstVisibleIndex, lastVisibleIndex];
        };
        ArrayVirtualRepeatStrategy.prototype.updateBuffers = function (repeat, firstIndex) {
            var itemHeight = repeat.itemHeight;
            var itemCount = repeat.items.length;
            repeat.topBufferHeight = firstIndex * itemHeight;
            repeat.bottomBufferHeight = (itemCount - firstIndex - repeat.viewCount()) * itemHeight;
            repeat.updateBufferElements(true);
        };
        ArrayVirtualRepeatStrategy.prototype.isNearTop = function (repeat, firstIndex) {
            var itemCount = repeat.items.length;
            return itemCount > 0
                ? firstIndex < repeat.edgeDistance
                : false;
        };
        ArrayVirtualRepeatStrategy.prototype.isNearBottom = function (repeat, lastIndex) {
            var itemCount = repeat.items.length;
            return lastIndex === -1
                ? true
                : itemCount > 0
                    ? lastIndex > (itemCount - 1 - repeat.edgeDistance)
                    : false;
        };
        ArrayVirtualRepeatStrategy.prototype.instanceChanged = function (repeat, items, first) {
            if (this._inPlaceProcessItems(repeat, items, first)) {
                this._remeasure(repeat, repeat.itemHeight, repeat.minViewsRequired * 2, items.length, repeat.$first);
            }
        };
        ArrayVirtualRepeatStrategy.prototype.instanceMutated = function (repeat, array, splices) {
            this._standardProcessInstanceMutated(repeat, array, splices);
        };
        ArrayVirtualRepeatStrategy.prototype._inPlaceProcessItems = function ($repeat, items, firstIndex) {
            var repeat = $repeat;
            var currItemCount = items.length;
            if (currItemCount === 0) {
                repeat.removeAllViews(true, false);
                repeat.resetCalculation();
                repeat.__queuedSplices = repeat.__array = undefined;
                return false;
            }
            var max_views_count = repeat.minViewsRequired * 2;
            var realViewsCount = repeat.viewCount();
            while (realViewsCount > currItemCount) {
                realViewsCount--;
                repeat.removeView(realViewsCount, true, false);
            }
            while (realViewsCount > max_views_count) {
                realViewsCount--;
                repeat.removeView(realViewsCount, true, false);
            }
            realViewsCount = Math$min(realViewsCount, max_views_count);
            var local = repeat.local;
            var lastIndex = currItemCount - 1;
            if (firstIndex + realViewsCount > lastIndex) {
                firstIndex = Math$max(0, currItemCount - realViewsCount);
            }
            repeat.$first = firstIndex;
            for (var i = 0; i < realViewsCount; i++) {
                var currIndex = i + firstIndex;
                var view = repeat.view(i);
                var last = currIndex === currItemCount - 1;
                var middle = currIndex !== 0 && !last;
                var bindingContext = view.bindingContext;
                var overrideContext = view.overrideContext;
                if (bindingContext[local] === items[currIndex]
                    && overrideContext.$index === currIndex
                    && overrideContext.$middle === middle
                    && overrideContext.$last === last) {
                    continue;
                }
                bindingContext[local] = items[currIndex];
                overrideContext.$first = currIndex === 0;
                overrideContext.$middle = middle;
                overrideContext.$last = last;
                overrideContext.$index = currIndex;
                var odd = currIndex % 2 === 1;
                overrideContext.$odd = odd;
                overrideContext.$even = !odd;
                repeat.updateBindings(view);
            }
            var minLength = Math$min(max_views_count, currItemCount);
            for (var i = realViewsCount; i < minLength; i++) {
                var overrideContext = aureliaTemplatingResources.createFullOverrideContext(repeat, items[i], i, currItemCount);
                repeat.addView(overrideContext.bindingContext, overrideContext);
            }
            return true;
        };
        ArrayVirtualRepeatStrategy.prototype._standardProcessInstanceMutated = function ($repeat, array, splices) {
            var _this = this;
            var repeat = $repeat;
            if (repeat.__queuedSplices) {
                for (var i = 0, ii = splices.length; i < ii; ++i) {
                    var _a = splices[i], index = _a.index, removed = _a.removed, addedCount = _a.addedCount;
                    aureliaBinding.mergeSplice(repeat.__queuedSplices, index, removed, addedCount);
                }
                repeat.__array = array.slice(0);
                return;
            }
            if (array.length === 0) {
                repeat.removeAllViews(true, false);
                repeat.resetCalculation();
                repeat.__queuedSplices = repeat.__array = undefined;
                return;
            }
            var maybePromise = this._runSplices(repeat, array.slice(0), splices);
            if (maybePromise instanceof Promise) {
                var queuedSplices_1 = repeat.__queuedSplices = [];
                var runQueuedSplices_1 = function () {
                    if (!queuedSplices_1.length) {
                        repeat.__queuedSplices = repeat.__array = undefined;
                        return;
                    }
                    var nextPromise = _this._runSplices(repeat, repeat.__array, queuedSplices_1) || Promise.resolve();
                    nextPromise.then(runQueuedSplices_1);
                };
                maybePromise.then(runQueuedSplices_1);
            }
        };
        ArrayVirtualRepeatStrategy.prototype._runSplices = function (repeat, newArray, splices) {
            var firstIndex = repeat.$first;
            var totalRemovedCount = 0;
            var totalAddedCount = 0;
            var splice;
            var i = 0;
            var spliceCount = splices.length;
            var newArraySize = newArray.length;
            var allSplicesAreInplace = true;
            for (i = 0; spliceCount > i; i++) {
                splice = splices[i];
                var removedCount = splice.removed.length;
                var addedCount = splice.addedCount;
                totalRemovedCount += removedCount;
                totalAddedCount += addedCount;
                if (removedCount !== addedCount) {
                    allSplicesAreInplace = false;
                }
            }
            if (allSplicesAreInplace) {
                var lastIndex = repeat.lastViewIndex();
                var repeatViewSlot = repeat.viewSlot;
                for (i = 0; spliceCount > i; i++) {
                    splice = splices[i];
                    for (var collectionIndex = splice.index; collectionIndex < splice.index + splice.addedCount; collectionIndex++) {
                        if (collectionIndex >= firstIndex && collectionIndex <= lastIndex) {
                            var viewIndex = collectionIndex - firstIndex;
                            var overrideContext = aureliaTemplatingResources.createFullOverrideContext(repeat, newArray[collectionIndex], collectionIndex, newArraySize);
                            repeat.removeView(viewIndex, true, true);
                            repeat.insertView(viewIndex, overrideContext.bindingContext, overrideContext);
                        }
                    }
                }
                return;
            }
            var firstIndexAfterMutation = firstIndex;
            var itemHeight = repeat.itemHeight;
            var originalSize = newArraySize + totalRemovedCount - totalAddedCount;
            var currViewCount = repeat.viewCount();
            var newViewCount = currViewCount;
            if (originalSize === 0 && itemHeight === 0) {
                repeat.resetCalculation();
                repeat.itemsChanged();
                return;
            }
            var all_splices_are_positive_and_before_view_port = totalRemovedCount === 0
                && totalAddedCount > 0
                && splices.every(function (splice) { return splice.index <= firstIndex; });
            if (all_splices_are_positive_and_before_view_port) {
                repeat.$first = firstIndex + totalAddedCount - 1;
                repeat.topBufferHeight += totalAddedCount * itemHeight;
                repeat.enableScroll();
                var scrollerInfo = repeat.getScrollerInfo();
                var scroller_scroll_top = scrollerInfo.scrollTop;
                var top_buffer_distance = getDistanceToParent(repeat.topBufferEl, scrollerInfo.scroller);
                var real_scroll_top = Math$max(0, scroller_scroll_top === 0
                    ? 0
                    : (scroller_scroll_top - top_buffer_distance));
                var first_index_after_scroll_adjustment = real_scroll_top === 0
                    ? 0
                    : Math$floor(real_scroll_top / itemHeight);
                if (scroller_scroll_top > top_buffer_distance
                    && first_index_after_scroll_adjustment === firstIndex) {
                    repeat.updateBufferElements(false);
                    repeat.scrollerEl.scrollTop = real_scroll_top + totalAddedCount * itemHeight;
                    this._remeasure(repeat, itemHeight, newViewCount, newArraySize, firstIndex);
                    return;
                }
            }
            var lastViewIndex = repeat.lastViewIndex();
            var all_splices_are_after_view_port = currViewCount > repeat.minViewsRequired
                && splices.every(function (s) { return s.index > lastViewIndex; });
            if (all_splices_are_after_view_port) {
                repeat.bottomBufferHeight = Math$max(0, newArraySize - firstIndex - currViewCount) * itemHeight;
                repeat.updateBufferElements(true);
            }
            else {
                var viewsRequiredCount = repeat.minViewsRequired * 2;
                if (viewsRequiredCount === 0) {
                    var scrollerInfo = repeat.getScrollerInfo();
                    var minViewsRequired = calcMinViewsRequired(scrollerInfo.height, itemHeight);
                    repeat.minViewsRequired = minViewsRequired;
                    viewsRequiredCount = minViewsRequired * 2;
                }
                for (i = 0; spliceCount > i; ++i) {
                    var _a = splices[i], addedCount = _a.addedCount, removedCount = _a.removed.length, spliceIndex = _a.index;
                    var removeDelta = removedCount - addedCount;
                    if (firstIndexAfterMutation > spliceIndex) {
                        firstIndexAfterMutation = Math$max(0, firstIndexAfterMutation - removeDelta);
                    }
                }
                newViewCount = 0;
                if (newArraySize <= repeat.minViewsRequired) {
                    firstIndexAfterMutation = 0;
                    newViewCount = newArraySize;
                }
                else {
                    if (newArraySize <= viewsRequiredCount) {
                        newViewCount = newArraySize;
                        firstIndexAfterMutation = 0;
                    }
                    else {
                        newViewCount = viewsRequiredCount;
                    }
                }
                var newTopBufferItemCount = newArraySize >= firstIndexAfterMutation
                    ? firstIndexAfterMutation
                    : 0;
                var viewCountDelta = newViewCount - currViewCount;
                if (viewCountDelta > 0) {
                    for (i = 0; viewCountDelta > i; ++i) {
                        var collectionIndex = firstIndexAfterMutation + currViewCount + i;
                        var overrideContext = aureliaTemplatingResources.createFullOverrideContext(repeat, newArray[collectionIndex], collectionIndex, newArray.length);
                        repeat.addView(overrideContext.bindingContext, overrideContext);
                    }
                }
                else {
                    var ii = Math$abs(viewCountDelta);
                    for (i = 0; ii > i; ++i) {
                        repeat.removeView(newViewCount, true, false);
                    }
                }
                var newBotBufferItemCount = Math$max(0, newArraySize - newTopBufferItemCount - newViewCount);
                repeat.$first = firstIndexAfterMutation;
                repeat.topBufferHeight = newTopBufferItemCount * itemHeight;
                repeat.bottomBufferHeight = newBotBufferItemCount * itemHeight;
                repeat.updateBufferElements(true);
            }
            this._remeasure(repeat, itemHeight, newViewCount, newArraySize, firstIndexAfterMutation);
        };
        ArrayVirtualRepeatStrategy.prototype.updateAllViews = function (repeat, startIndex) {
            var views = repeat.viewSlot.children;
            var viewLength = views.length;
            var collection = repeat.items;
            var delta = Math$floor(repeat.topBufferHeight / repeat.itemHeight);
            var collectionIndex = 0;
            var view;
            for (; viewLength > startIndex; ++startIndex) {
                collectionIndex = startIndex + delta;
                view = repeat.view(startIndex);
                rebindView(repeat, view, collectionIndex, collection);
                repeat.updateBindings(view);
            }
        };
        ArrayVirtualRepeatStrategy.prototype.remeasure = function (repeat) {
            this._remeasure(repeat, repeat.itemHeight, repeat.viewCount(), repeat.items.length, repeat.firstViewIndex());
        };
        ArrayVirtualRepeatStrategy.prototype._remeasure = function (repeat, itemHeight, newViewCount, newArraySize, firstIndex) {
            var scrollerInfo = repeat.getScrollerInfo();
            var scroller_scroll_top = scrollerInfo.scrollTop;
            var top_buffer_distance = getDistanceToParent(repeat.topBufferEl, scrollerInfo.scroller);
            var real_scroll_top = Math$max(0, scroller_scroll_top === 0
                ? 0
                : (scroller_scroll_top - top_buffer_distance));
            var first_index_after_scroll_adjustment = real_scroll_top === 0
                ? 0
                : Math$floor(real_scroll_top / itemHeight);
            if (first_index_after_scroll_adjustment + newViewCount >= newArraySize) {
                first_index_after_scroll_adjustment = Math$max(0, newArraySize - newViewCount);
            }
            var top_buffer_item_count_after_scroll_adjustment = first_index_after_scroll_adjustment;
            var bot_buffer_item_count_after_scroll_adjustment = Math$max(0, newArraySize - top_buffer_item_count_after_scroll_adjustment - newViewCount);
            repeat.$first = first_index_after_scroll_adjustment;
            repeat.topBufferHeight = top_buffer_item_count_after_scroll_adjustment * itemHeight;
            repeat.bottomBufferHeight = bot_buffer_item_count_after_scroll_adjustment * itemHeight;
            repeat._handlingMutations = false;
            repeat.revertScrollCheckGuard();
            repeat.updateBufferElements();
            this.updateAllViews(repeat, 0);
        };
        return ArrayVirtualRepeatStrategy;
    }(aureliaTemplatingResources.ArrayRepeatStrategy));

    var NullVirtualRepeatStrategy = (function (_super) {
        __extends(NullVirtualRepeatStrategy, _super);
        function NullVirtualRepeatStrategy() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        NullVirtualRepeatStrategy.prototype.createFirstRow = function () {
            return null;
        };
        NullVirtualRepeatStrategy.prototype.count = function (items) {
            return 0;
        };
        NullVirtualRepeatStrategy.prototype.getViewRange = function (repeat, scrollerInfo) {
            return [0, 0];
        };
        NullVirtualRepeatStrategy.prototype.updateBuffers = function (repeat, firstIndex) { };
        NullVirtualRepeatStrategy.prototype.onAttached = function () { };
        NullVirtualRepeatStrategy.prototype.isNearTop = function () {
            return false;
        };
        NullVirtualRepeatStrategy.prototype.isNearBottom = function () {
            return false;
        };
        NullVirtualRepeatStrategy.prototype.initCalculation = function (repeat, items) {
            repeat.itemHeight
                = repeat.minViewsRequired
                    = 0;
            return 2;
        };
        NullVirtualRepeatStrategy.prototype.instanceMutated = function () { };
        NullVirtualRepeatStrategy.prototype.instanceChanged = function (repeat) {
            repeat.removeAllViews(true, false);
            repeat.resetCalculation();
        };
        NullVirtualRepeatStrategy.prototype.remeasure = function (repeat) { };
        NullVirtualRepeatStrategy.prototype.updateAllViews = function () { };
        return NullVirtualRepeatStrategy;
    }(aureliaTemplatingResources.NullRepeatStrategy));

    var VirtualRepeatStrategyLocator = (function () {
        function VirtualRepeatStrategyLocator() {
            this.matchers = [];
            this.strategies = [];
            this.addStrategy(function (items) { return items === null || items === undefined; }, new NullVirtualRepeatStrategy());
            this.addStrategy(function (items) { return items instanceof Array; }, new ArrayVirtualRepeatStrategy());
        }
        VirtualRepeatStrategyLocator.prototype.addStrategy = function (matcher, strategy) {
            this.matchers.push(matcher);
            this.strategies.push(strategy);
        };
        VirtualRepeatStrategyLocator.prototype.getStrategy = function (items) {
            var matchers = this.matchers;
            for (var i = 0, ii = matchers.length; i < ii; ++i) {
                if (matchers[i](items)) {
                    return this.strategies[i];
                }
            }
            return null;
        };
        return VirtualRepeatStrategyLocator;
    }());

    var DefaultTemplateStrategy = (function () {
        function DefaultTemplateStrategy() {
        }
        DefaultTemplateStrategy.prototype.getScrollContainer = function (element) {
            return getScrollerElement(element);
        };
        DefaultTemplateStrategy.prototype.moveViewFirst = function (view, topBuffer) {
            insertBeforeNode(view, aureliaPal.DOM.nextElementSibling(topBuffer));
        };
        DefaultTemplateStrategy.prototype.moveViewLast = function (view, bottomBuffer) {
            var previousSibling = bottomBuffer.previousSibling;
            var referenceNode = previousSibling.nodeType === 8 && previousSibling.data === 'anchor' ? previousSibling : bottomBuffer;
            insertBeforeNode(view, referenceNode);
        };
        DefaultTemplateStrategy.prototype.createBuffers = function (element) {
            var parent = element.parentNode;
            return [
                parent.insertBefore(aureliaPal.DOM.createElement('div'), element),
                parent.insertBefore(aureliaPal.DOM.createElement('div'), element.nextSibling),
            ];
        };
        DefaultTemplateStrategy.prototype.removeBuffers = function (el, topBuffer, bottomBuffer) {
            var parent = el.parentNode;
            parent.removeChild(topBuffer);
            parent.removeChild(bottomBuffer);
        };
        DefaultTemplateStrategy.prototype.getFirstElement = function (topBuffer, bottomBuffer) {
            var firstEl = topBuffer.nextElementSibling;
            return firstEl === bottomBuffer ? null : firstEl;
        };
        DefaultTemplateStrategy.prototype.getLastElement = function (topBuffer, bottomBuffer) {
            var lastEl = bottomBuffer.previousElementSibling;
            return lastEl === topBuffer ? null : lastEl;
        };
        return DefaultTemplateStrategy;
    }());

    var BaseTableTemplateStrategy = (function (_super) {
        __extends(BaseTableTemplateStrategy, _super);
        function BaseTableTemplateStrategy() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        BaseTableTemplateStrategy.prototype.getScrollContainer = function (element) {
            return getScrollerElement(this.getTable(element));
        };
        BaseTableTemplateStrategy.prototype.createBuffers = function (element) {
            var parent = element.parentNode;
            return [
                parent.insertBefore(aureliaPal.DOM.createElement('tr'), element),
                parent.insertBefore(aureliaPal.DOM.createElement('tr'), element.nextSibling),
            ];
        };
        return BaseTableTemplateStrategy;
    }(DefaultTemplateStrategy));
    var TableBodyStrategy = (function (_super) {
        __extends(TableBodyStrategy, _super);
        function TableBodyStrategy() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        TableBodyStrategy.prototype.getTable = function (element) {
            return element.parentNode;
        };
        return TableBodyStrategy;
    }(BaseTableTemplateStrategy));
    var TableRowStrategy = (function (_super) {
        __extends(TableRowStrategy, _super);
        function TableRowStrategy() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        TableRowStrategy.prototype.getTable = function (element) {
            return element.parentNode.parentNode;
        };
        return TableRowStrategy;
    }(BaseTableTemplateStrategy));

    var ListTemplateStrategy = (function (_super) {
        __extends(ListTemplateStrategy, _super);
        function ListTemplateStrategy() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        ListTemplateStrategy.prototype.createBuffers = function (element) {
            var parent = element.parentNode;
            return [
                parent.insertBefore(aureliaPal.DOM.createElement('li'), element),
                parent.insertBefore(aureliaPal.DOM.createElement('li'), element.nextSibling),
            ];
        };
        return ListTemplateStrategy;
    }(DefaultTemplateStrategy));

    var TemplateStrategyLocator = (function () {
        function TemplateStrategyLocator(container) {
            this.container = container;
        }
        TemplateStrategyLocator.prototype.getStrategy = function (element) {
            var parent = element.parentNode;
            var container = this.container;
            if (parent === null) {
                return container.get(DefaultTemplateStrategy);
            }
            var parentTagName = parent.tagName;
            if (parentTagName === 'TBODY' || parentTagName === 'THEAD' || parentTagName === 'TFOOT') {
                return container.get(TableRowStrategy);
            }
            if (parentTagName === 'TABLE') {
                return container.get(TableBodyStrategy);
            }
            if (parentTagName === 'OL' || parentTagName === 'UL') {
                return container.get(ListTemplateStrategy);
            }
            return container.get(DefaultTemplateStrategy);
        };
        TemplateStrategyLocator.inject = [aureliaDependencyInjection.Container];
        return TemplateStrategyLocator;
    }());

    var VirtualizationEvents = Object.assign(Object.create(null), {
        scrollerSizeChange: 'virtual-repeat-scroller-size-changed',
        itemSizeChange: 'virtual-repeat-item-size-changed',
    });

    var getResizeObserverClass = function () { return aureliaPal.PLATFORM.global.ResizeObserver; };

    var VirtualRepeat = (function (_super) {
        __extends(VirtualRepeat, _super);
        function VirtualRepeat(element, viewFactory, instruction, viewSlot, viewResources, observerLocator, collectionStrategyLocator, templateStrategyLocator) {
            var _this = _super.call(this, {
                local: 'item',
                viewsRequireLifecycle: aureliaTemplatingResources.viewsRequireLifecycle(viewFactory),
            }) || this;
            _this.$first = 0;
            _this._isAttached = false;
            _this._ticking = false;
            _this._calledGetMore = false;
            _this._skipNextScrollHandle = false;
            _this._handlingMutations = false;
            _this._lastGetMore = 0;
            _this.element = element;
            _this.viewFactory = viewFactory;
            _this.instruction = instruction;
            _this.viewSlot = viewSlot;
            _this.lookupFunctions = viewResources['lookupFunctions'];
            _this.observerLocator = observerLocator;
            _this.taskQueue = observerLocator.taskQueue;
            _this.strategyLocator = collectionStrategyLocator;
            _this.templateStrategyLocator = templateStrategyLocator;
            _this.edgeDistance = 5;
            _this.sourceExpression = aureliaTemplatingResources.getItemsSourceExpression(_this.instruction, 'virtual-repeat.for');
            _this.isOneTime = aureliaTemplatingResources.isOneTime(_this.sourceExpression);
            _this.topBufferHeight
                = _this.bottomBufferHeight
                    = _this.itemHeight
                        = _this.distanceToTop
                            = 0;
            _this.revertScrollCheckGuard = function () {
                _this._ticking = false;
            };
            _this._onScroll = _this._onScroll.bind(_this);
            return _this;
        }
        VirtualRepeat.inject = function () {
            return [
                aureliaPal.DOM.Element,
                aureliaTemplating.BoundViewFactory,
                aureliaTemplating.TargetInstruction,
                aureliaTemplating.ViewSlot,
                aureliaTemplating.ViewResources,
                aureliaBinding.ObserverLocator,
                VirtualRepeatStrategyLocator,
                TemplateStrategyLocator,
            ];
        };
        VirtualRepeat.$resource = function () {
            return {
                type: 'attribute',
                name: 'virtual-repeat',
                templateController: true,
                bindables: ['items', 'local'],
            };
        };
        VirtualRepeat.prototype.bind = function (bindingContext, overrideContext) {
            this.scope = { bindingContext: bindingContext, overrideContext: overrideContext };
        };
        VirtualRepeat.prototype.attached = function () {
            var _this = this;
            this._isAttached = true;
            var element = this.element;
            var templateStrategy = this.templateStrategy = this.templateStrategyLocator.getStrategy(element);
            var scrollerEl = this.scrollerEl = templateStrategy.getScrollContainer(element);
            var _a = templateStrategy.createBuffers(element), topBufferEl = _a[0], bottomBufferEl = _a[1];
            var isFixedHeightContainer = scrollerEl !== htmlElement;
            var scrollListener = this._onScroll;
            this.topBufferEl = topBufferEl;
            this.bottomBufferEl = bottomBufferEl;
            this.itemsChanged();
            this._currScrollerInfo = this.getScrollerInfo();
            if (isFixedHeightContainer) {
                scrollerEl.addEventListener('scroll', scrollListener);
            }
            else {
                var firstElement = templateStrategy.getFirstElement(topBufferEl, bottomBufferEl);
                this.distanceToTop = firstElement === null ? 0 : getElementDistanceToTopOfDocument(topBufferEl);
                aureliaPal.DOM.addEventListener('scroll', scrollListener, false);
                this._calcDistanceToTopInterval = aureliaPal.PLATFORM.global.setInterval(function () {
                    var prevDistanceToTop = _this.distanceToTop;
                    var currDistanceToTop = getElementDistanceToTopOfDocument(topBufferEl);
                    _this.distanceToTop = currDistanceToTop;
                    if (prevDistanceToTop !== currDistanceToTop) {
                        var currentScrollerInfo = _this.getScrollerInfo();
                        var prevScrollerInfo = _this._currScrollerInfo;
                        _this._currScrollerInfo = currentScrollerInfo;
                        _this._handleScroll(currentScrollerInfo, prevScrollerInfo);
                    }
                }, 500);
            }
            this.strategy.onAttached(this);
        };
        VirtualRepeat.prototype.call = function (context, changes) {
            this[context](this.items, changes);
        };
        VirtualRepeat.prototype.detached = function () {
            var scrollCt = this.scrollerEl;
            var scrollListener = this._onScroll;
            if (hasOverflowScroll(scrollCt)) {
                scrollCt.removeEventListener('scroll', scrollListener);
            }
            else {
                aureliaPal.DOM.removeEventListener('scroll', scrollListener, false);
            }
            this.unobserveScroller();
            this._currScrollerContentRect = undefined;
            this._isAttached
                = false;
            this._unsubscribeCollection();
            this.resetCalculation();
            this.templateStrategy.removeBuffers(this.element, this.topBufferEl, this.bottomBufferEl);
            this.topBufferEl = this.bottomBufferEl = this.scrollerEl = null;
            this.removeAllViews(true, false);
            var $clearInterval = aureliaPal.PLATFORM.global.clearInterval;
            $clearInterval(this._calcDistanceToTopInterval);
            $clearInterval(this._sizeInterval);
            this.distanceToTop
                = this._sizeInterval
                    = this._calcDistanceToTopInterval = 0;
        };
        VirtualRepeat.prototype.unbind = function () {
            this.scope = null;
            this.items = null;
        };
        VirtualRepeat.prototype.itemsChanged = function () {
            var _this = this;
            this._unsubscribeCollection();
            if (!this.scope || !this._isAttached) {
                return;
            }
            var items = this.items;
            var strategy = this.strategy = this.strategyLocator.getStrategy(items);
            if (strategy === null) {
                throw new Error('Value is not iterateable for virtual repeat.');
            }
            if (!this.isOneTime && !this._observeInnerCollection()) {
                this._observeCollection();
            }
            var calculationSignals = strategy.initCalculation(this, items);
            strategy.instanceChanged(this, items, this.$first);
            if (calculationSignals & 1) {
                this.resetCalculation();
            }
            if ((calculationSignals & 2) === 0) {
                var _a = aureliaPal.PLATFORM.global, $setInterval = _a.setInterval, $clearInterval_1 = _a.clearInterval;
                $clearInterval_1(this._sizeInterval);
                this._sizeInterval = $setInterval(function () {
                    if (_this.items) {
                        var firstView = _this.firstView() || _this.strategy.createFirstRow(_this);
                        var newCalcSize = calcOuterHeight(firstView.firstChild);
                        if (newCalcSize > 0) {
                            $clearInterval_1(_this._sizeInterval);
                            _this.itemsChanged();
                        }
                    }
                    else {
                        $clearInterval_1(_this._sizeInterval);
                    }
                }, 500);
            }
            if (calculationSignals & 4) {
                this.observeScroller(this.scrollerEl);
            }
        };
        VirtualRepeat.prototype.handleCollectionMutated = function (collection, changes) {
            if (this._ignoreMutation) {
                return;
            }
            this._handlingMutations = true;
            this.strategy.instanceMutated(this, collection, changes);
        };
        VirtualRepeat.prototype.handleInnerCollectionMutated = function (collection, changes) {
            var _this = this;
            if (this._ignoreMutation) {
                return;
            }
            this._ignoreMutation = true;
            var newItems = this.sourceExpression.evaluate(this.scope, this.lookupFunctions);
            this.taskQueue.queueMicroTask(function () { return _this._ignoreMutation = false; });
            if (newItems === this.items) {
                this.itemsChanged();
            }
            else {
                this.items = newItems;
            }
        };
        VirtualRepeat.prototype.enableScroll = function () {
            this._ticking = false;
            this._handlingMutations = false;
            this._skipNextScrollHandle = false;
        };
        VirtualRepeat.prototype.getScroller = function () {
            return this.scrollerEl;
        };
        VirtualRepeat.prototype.getScrollerInfo = function () {
            var scroller = this.scrollerEl;
            return {
                scroller: scroller,
                scrollTop: scroller.scrollTop,
                height: scroller === htmlElement
                    ? innerHeight
                    : calcScrollHeight(scroller),
            };
        };
        VirtualRepeat.prototype.resetCalculation = function () {
            this.$first
                = this.topBufferHeight
                    = this.bottomBufferHeight
                        = this.itemHeight
                            = this.minViewsRequired = 0;
            this._ignoreMutation
                = this._handlingMutations
                    = this._ticking = false;
            this.updateBufferElements(true);
        };
        VirtualRepeat.prototype._onScroll = function () {
            var _this = this;
            var isHandlingMutations = this._handlingMutations;
            if (!this._ticking && !isHandlingMutations) {
                var prevScrollerInfo_1 = this._currScrollerInfo;
                var currentScrollerInfo_1 = this.getScrollerInfo();
                this._currScrollerInfo = currentScrollerInfo_1;
                this.taskQueue.queueMicroTask(function () {
                    _this._ticking = false;
                    _this._handleScroll(currentScrollerInfo_1, prevScrollerInfo_1);
                });
                this._ticking = true;
            }
            if (isHandlingMutations) {
                this._handlingMutations = false;
            }
        };
        VirtualRepeat.prototype._handleScroll = function (current_scroller_info, prev_scroller_info) {
            if (!this._isAttached) {
                return;
            }
            if (this._skipNextScrollHandle) {
                this._skipNextScrollHandle = false;
                return;
            }
            var items = this.items;
            if (!items) {
                return;
            }
            var strategy = this.strategy;
            var old_range_start_index = this.$first;
            var old_range_end_index = this.lastViewIndex();
            var _a = strategy.getViewRange(this, current_scroller_info), new_range_start_index = _a[0], new_range_end_index = _a[1];
            var scrolling_state = new_range_start_index > old_range_start_index
                ? 1
                : new_range_start_index < old_range_start_index
                    ? 2
                    : 0;
            var didMovedViews = 0;
            if (new_range_start_index >= old_range_start_index && old_range_end_index === new_range_end_index
                || new_range_end_index === old_range_end_index && old_range_end_index >= new_range_end_index) {
                if (new_range_start_index >= old_range_start_index && old_range_end_index === new_range_end_index) {
                    if (strategy.isNearBottom(this, new_range_end_index)) {
                        scrolling_state |= 8;
                    }
                }
                else if (strategy.isNearTop(this, new_range_start_index)) {
                    scrolling_state |= 4;
                }
            }
            else {
                if (new_range_start_index > old_range_start_index
                    && old_range_end_index >= new_range_start_index
                    && new_range_end_index >= old_range_end_index) {
                    var views_to_move_count = new_range_start_index - old_range_start_index;
                    this._moveViews(views_to_move_count, 1);
                    didMovedViews = 1;
                    if (strategy.isNearBottom(this, new_range_end_index)) {
                        scrolling_state |= 8;
                    }
                }
                else if (old_range_start_index > new_range_start_index
                    && old_range_start_index <= new_range_end_index
                    && old_range_end_index >= new_range_end_index) {
                    var views_to_move_count = old_range_end_index - new_range_end_index;
                    this._moveViews(views_to_move_count, -1);
                    didMovedViews = 1;
                    if (strategy.isNearTop(this, new_range_start_index)) {
                        scrolling_state |= 4;
                    }
                }
                else if (old_range_end_index < new_range_start_index || old_range_start_index > new_range_end_index) {
                    strategy.remeasure(this);
                    if (old_range_end_index < new_range_start_index) {
                        if (strategy.isNearBottom(this, new_range_end_index)) {
                            scrolling_state |= 8;
                        }
                    }
                    else if (strategy.isNearTop(this, new_range_start_index)) {
                        scrolling_state |= 4;
                    }
                }
                else {
                    if (old_range_start_index !== new_range_start_index || old_range_end_index !== new_range_end_index) {
                        console.log("[!] Scroll intersection not handled. With indices: "
                            + ("new [" + new_range_start_index + ", " + new_range_end_index + "] / old [" + old_range_start_index + ", " + old_range_end_index + "]"));
                        strategy.remeasure(this);
                    }
                    else {
                        console.log('[!] Scroll handled, and there\'s no changes');
                    }
                }
            }
            if (didMovedViews === 1) {
                this.$first = new_range_start_index;
                strategy.updateBuffers(this, new_range_start_index);
            }
            if ((scrolling_state & 9) === 9
                || (scrolling_state & 6) === 6) {
                this.getMore(new_range_start_index, (scrolling_state & 4) > 0, (scrolling_state & 8) > 0);
            }
            else {
                var scroll_top_delta = current_scroller_info.scrollTop - prev_scroller_info.scrollTop;
                scrolling_state = scroll_top_delta > 0
                    ? 1
                    : scroll_top_delta < 0
                        ? 2
                        : 0;
                if (strategy.isNearTop(this, new_range_start_index)) {
                    scrolling_state |= 4;
                }
                if (strategy.isNearBottom(this, new_range_end_index)) {
                    scrolling_state |= 8;
                }
                if ((scrolling_state & 9) === 9
                    || (scrolling_state & 6) === 6) {
                    this.getMore(new_range_start_index, (scrolling_state & 4) > 0, (scrolling_state & 8) > 0);
                }
            }
        };
        VirtualRepeat.prototype._moveViews = function (viewsCount, direction) {
            var repeat = this;
            if (direction === -1) {
                var startIndex = repeat.firstViewIndex();
                while (viewsCount--) {
                    var view = repeat.lastView();
                    rebindAndMoveView(repeat, view, --startIndex, false);
                }
            }
            else {
                var lastIndex = repeat.lastViewIndex();
                while (viewsCount--) {
                    var view = repeat.view(0);
                    rebindAndMoveView(repeat, view, ++lastIndex, true);
                }
            }
        };
        VirtualRepeat.prototype.getMore = function (topIndex, isNearTop, isNearBottom, force) {
            var _this = this;
            if (isNearTop || isNearBottom || force) {
                if (!this._calledGetMore) {
                    var executeGetMore = function (time) {
                        if (time - _this._lastGetMore < 16) {
                            return;
                        }
                        _this._lastGetMore = time;
                        _this._calledGetMore = true;
                        var revertCalledGetMore = function () {
                            _this._calledGetMore = false;
                        };
                        var firstView = _this.firstView();
                        if (firstView === null) {
                            revertCalledGetMore();
                            return;
                        }
                        var firstViewElement = firstView.firstChild;
                        var scrollNextAttrName = 'infinite-scroll-next';
                        var func = firstViewElement
                            && firstViewElement.au
                            && firstViewElement.au[scrollNextAttrName]
                            ? firstViewElement.au[scrollNextAttrName].instruction.attributes[scrollNextAttrName]
                            : undefined;
                        if (func === undefined) {
                            revertCalledGetMore();
                        }
                        else {
                            var scrollContext = {
                                topIndex: topIndex,
                                isAtBottom: isNearBottom,
                                isAtTop: isNearTop,
                            };
                            var overrideContext = _this.scope.overrideContext;
                            overrideContext.$scrollContext = scrollContext;
                            if (typeof func === 'string') {
                                var bindingContext = overrideContext.bindingContext;
                                var getMoreFuncName = firstView.firstChild.getAttribute(scrollNextAttrName);
                                var funcCall = bindingContext[getMoreFuncName];
                                if (typeof funcCall === 'function') {
                                    revertCalledGetMore();
                                    var result = funcCall.call(bindingContext, topIndex, isNearBottom, isNearTop);
                                    if (result instanceof Promise) {
                                        _this._calledGetMore = true;
                                        return result.then(function () {
                                            revertCalledGetMore();
                                        });
                                    }
                                }
                                else {
                                    throw new Error("'" + scrollNextAttrName + "' must be a function or evaluate to one");
                                }
                            }
                            else if (func.sourceExpression) {
                                revertCalledGetMore();
                                return func.sourceExpression.evaluate(_this.scope);
                            }
                            else {
                                throw new Error("'" + scrollNextAttrName + "' must be a function or evaluate to one");
                            }
                        }
                    };
                    $raf(executeGetMore);
                }
            }
        };
        VirtualRepeat.prototype.updateBufferElements = function (skipUpdate) {
            this.topBufferEl.style.height = this.topBufferHeight + "px";
            this.bottomBufferEl.style.height = this.bottomBufferHeight + "px";
            if (skipUpdate) {
                this._ticking = true;
                $raf(this.revertScrollCheckGuard);
            }
        };
        VirtualRepeat.prototype._unsubscribeCollection = function () {
            var collectionObserver = this.collectionObserver;
            if (collectionObserver) {
                collectionObserver.unsubscribe(this.callContext, this);
                this.collectionObserver = this.callContext = null;
            }
        };
        VirtualRepeat.prototype.firstView = function () {
            return this.view(0);
        };
        VirtualRepeat.prototype.lastView = function () {
            return this.view(this.viewCount() - 1);
        };
        VirtualRepeat.prototype.firstViewIndex = function () {
            var firstView = this.firstView();
            return firstView === null ? -1 : firstView.overrideContext.$index;
        };
        VirtualRepeat.prototype.lastViewIndex = function () {
            var lastView = this.lastView();
            return lastView === null ? -1 : lastView.overrideContext.$index;
        };
        VirtualRepeat.prototype.observeScroller = function (scrollerEl) {
            var _this = this;
            var sizeChangeHandler = function (newRect) {
                $raf(function () {
                    if (newRect === _this._currScrollerContentRect) {
                        _this.itemsChanged();
                    }
                });
            };
            var ResizeObserverConstructor = getResizeObserverClass();
            if (typeof ResizeObserverConstructor === 'function') {
                var observer = this._scrollerResizeObserver;
                if (observer) {
                    observer.disconnect();
                }
                observer = this._scrollerResizeObserver = new ResizeObserverConstructor(function (entries) {
                    var oldRect = _this._currScrollerContentRect;
                    var newRect = entries[0].contentRect;
                    _this._currScrollerContentRect = newRect;
                    if (oldRect === undefined || newRect.height !== oldRect.height || newRect.width !== oldRect.width) {
                        sizeChangeHandler(newRect);
                    }
                });
                observer.observe(scrollerEl);
            }
            var elEvents = this._scrollerEvents;
            if (elEvents) {
                elEvents.disposeAll();
            }
            var sizeChangeEventsHandler = function () {
                $raf(function () {
                    _this.itemsChanged();
                });
            };
            elEvents = this._scrollerEvents = new aureliaTemplating.ElementEvents(scrollerEl);
            elEvents.subscribe(VirtualizationEvents.scrollerSizeChange, sizeChangeEventsHandler, false);
            elEvents.subscribe(VirtualizationEvents.itemSizeChange, sizeChangeEventsHandler, false);
        };
        VirtualRepeat.prototype.unobserveScroller = function () {
            var observer = this._scrollerResizeObserver;
            if (observer) {
                observer.disconnect();
            }
            var scrollerEvents = this._scrollerEvents;
            if (scrollerEvents) {
                scrollerEvents.disposeAll();
            }
            this._scrollerResizeObserver
                = this._scrollerEvents = undefined;
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
            return view;
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
            var bindings = view.bindings;
            var j = bindings.length;
            while (j--) {
                aureliaTemplatingResources.updateOneTimeBinding(bindings[j]);
            }
            var controllers = view.controllers;
            j = controllers.length;
            while (j--) {
                var boundProperties = controllers[j].boundProperties;
                var k = boundProperties.length;
                while (k--) {
                    var binding = boundProperties[k].binding;
                    aureliaTemplatingResources.updateOneTimeBinding(binding);
                }
            }
        };
        return VirtualRepeat;
    }(aureliaTemplatingResources.AbstractRepeater));

    var InfiniteScrollNext = (function () {
        function InfiniteScrollNext() {
        }
        InfiniteScrollNext.$resource = function () {
            return {
                type: 'attribute',
                name: 'infinite-scroll-next',
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
    exports.VirtualizationEvents = VirtualizationEvents;

    Object.defineProperty(exports, '__esModule', { value: true });

});
