'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var aureliaBinding = require('aurelia-binding');
var aureliaTemplating = require('aurelia-templating');
var aureliaTemplatingResources = require('aurelia-templating-resources');
var aureliaPal = require('aurelia-pal');
var aureliaDependencyInjection = require('aurelia-dependency-injection');

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

var updateAllViews = function (repeat, startIndex) {
    var views = repeat.viewSlot.children;
    var viewLength = views.length;
    var collection = repeat.items;
    var delta = Math$floor(repeat._topBufferHeight / repeat.itemHeight);
    var collectionIndex = 0;
    var view;
    for (; viewLength > startIndex; ++startIndex) {
        collectionIndex = startIndex + delta;
        view = repeat.view(startIndex);
        rebindView(repeat, view, collectionIndex, collection);
        repeat.updateBindings(view);
    }
};
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
var Math$abs = Math.abs;
var Math$max = Math.max;
var Math$min = Math.min;
var Math$round = Math.round;
var Math$floor = Math.floor;
var $isNaN = isNaN;

var getScrollContainer = function (element) {
    var current = element.parentNode;
    while (current !== null && current !== document) {
        if (hasOverflowScroll(current)) {
            return current;
        }
        current = current.parentNode;
    }
    return document.documentElement;
};
var getElementDistanceToTopOfDocument = function (element) {
    var box = element.getBoundingClientRect();
    var documentElement = document.documentElement;
    var scrollTop = window.pageYOffset;
    var clientTop = documentElement.clientTop;
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
        styleValue = parseInt(currentStyle[styles[i]], 10);
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
    if (child.previousSibling === null && child.parentNode === parent) {
        return 0;
    }
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
    ArrayVirtualRepeatStrategy.prototype.createFirstItem = function (repeat) {
        var overrideContext = aureliaTemplatingResources.createFullOverrideContext(repeat, repeat.items[0], 0, 1);
        return repeat.addView(overrideContext.bindingContext, overrideContext);
    };
    ArrayVirtualRepeatStrategy.prototype.initCalculation = function (repeat, items) {
        var itemCount = items.length;
        if (!(itemCount > 0)) {
            return 1;
        }
        var containerEl = repeat.getScroller();
        var existingViewCount = repeat.viewCount();
        if (itemCount > 0 && existingViewCount === 0) {
            this.createFirstItem(repeat);
        }
        var isFixedHeightContainer = repeat._fixedHeightContainer = hasOverflowScroll(containerEl);
        var firstView = repeat._firstView();
        var itemHeight = calcOuterHeight(firstView.firstChild);
        if (itemHeight === 0) {
            return 0;
        }
        repeat.itemHeight = itemHeight;
        var scroll_el_height = isFixedHeightContainer
            ? calcScrollHeight(containerEl)
            : document.documentElement.clientHeight;
        var elementsInView = repeat.elementsInView = Math$floor(scroll_el_height / itemHeight) + 1;
        var viewsCount = repeat._viewsLength = elementsInView * 2;
        return 2 | 4;
    };
    ArrayVirtualRepeatStrategy.prototype.instanceChanged = function (repeat, items, first) {
        if (this._inPlaceProcessItems(repeat, items, first)) {
            this._remeasure(repeat, repeat.itemHeight, repeat._viewsLength, items.length, repeat._first);
        }
    };
    ArrayVirtualRepeatStrategy.prototype.instanceMutated = function (repeat, array, splices) {
        this._standardProcessInstanceMutated(repeat, array, splices);
    };
    ArrayVirtualRepeatStrategy.prototype._inPlaceProcessItems = function (repeat, items, firstIndex) {
        var currItemCount = items.length;
        if (currItemCount === 0) {
            repeat.removeAllViews(true, false);
            repeat._resetCalculation();
            repeat.__queuedSplices = repeat.__array = undefined;
            return false;
        }
        var realViewsCount = repeat.viewCount();
        while (realViewsCount > currItemCount) {
            realViewsCount--;
            repeat.removeView(realViewsCount, true, false);
        }
        while (realViewsCount > repeat._viewsLength) {
            realViewsCount--;
            repeat.removeView(realViewsCount, true, false);
        }
        realViewsCount = Math$min(realViewsCount, repeat._viewsLength);
        var local = repeat.local;
        var lastIndex = currItemCount - 1;
        if (firstIndex + realViewsCount > lastIndex) {
            firstIndex = Math$max(0, currItemCount - realViewsCount);
        }
        repeat._first = firstIndex;
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
        var minLength = Math$min(repeat._viewsLength, currItemCount);
        for (var i = realViewsCount; i < minLength; i++) {
            var overrideContext = aureliaTemplatingResources.createFullOverrideContext(repeat, items[i], i, currItemCount);
            repeat.addView(overrideContext.bindingContext, overrideContext);
        }
        return true;
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
        if (array.length === 0) {
            repeat.removeAllViews(true, false);
            repeat._resetCalculation();
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
        var firstIndex = repeat._first;
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
            var lastIndex = repeat._lastViewIndex();
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
            repeat._resetCalculation();
            repeat.itemsChanged();
            return;
        }
        var lastViewIndex = repeat._lastViewIndex();
        var all_splices_are_after_view_port = currViewCount > repeat.elementsInView && splices.every(function (s) { return s.index > lastViewIndex; });
        if (all_splices_are_after_view_port) {
            repeat._bottomBufferHeight = Math$max(0, newArraySize - firstIndex - currViewCount) * itemHeight;
            repeat._updateBufferElements(true);
        }
        else {
            var viewsRequiredCount = repeat._viewsLength;
            if (viewsRequiredCount === 0) {
                var scrollerInfo = repeat.getScrollerInfo();
                var minViewsRequired = Math$floor(scrollerInfo.height / itemHeight) + 1;
                repeat.elementsInView = minViewsRequired;
                viewsRequiredCount = repeat._viewsLength = minViewsRequired * 2;
            }
            for (i = 0; spliceCount > i; ++i) {
                var _a = splices[i], addedCount = _a.addedCount, removedCount = _a.removed.length, spliceIndex = _a.index;
                var removeDelta = removedCount - addedCount;
                if (firstIndexAfterMutation > spliceIndex) {
                    firstIndexAfterMutation = Math$max(0, firstIndexAfterMutation - removeDelta);
                }
            }
            newViewCount = 0;
            if (newArraySize <= repeat.elementsInView) {
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
            repeat._isScrolling = false;
            repeat._scrollingDown = repeat._scrollingUp = false;
            repeat._first = firstIndexAfterMutation;
            repeat._previousFirst = firstIndex;
            repeat._lastRebind = firstIndexAfterMutation + newViewCount;
            repeat._topBufferHeight = newTopBufferItemCount * itemHeight;
            repeat._bottomBufferHeight = newBotBufferItemCount * itemHeight;
            repeat._updateBufferElements(true);
        }
        this._remeasure(repeat, itemHeight, newViewCount, newArraySize, firstIndexAfterMutation);
    };
    ArrayVirtualRepeatStrategy.prototype._remeasure = function (repeat, itemHeight, newViewCount, newArraySize, firstIndexAfterMutation) {
        var scrollerInfo = repeat.getScrollerInfo();
        var topBufferDistance = getDistanceToParent(repeat.topBufferEl, scrollerInfo.scroller);
        var realScrolltop = Math$max(0, scrollerInfo.scrollTop === 0
            ? 0
            : (scrollerInfo.scrollTop - topBufferDistance));
        var first_index_after_scroll_adjustment = realScrolltop === 0
            ? 0
            : Math$floor(realScrolltop / itemHeight);
        if (first_index_after_scroll_adjustment + newViewCount >= newArraySize) {
            first_index_after_scroll_adjustment = Math$max(0, newArraySize - newViewCount);
        }
        var top_buffer_item_count_after_scroll_adjustment = first_index_after_scroll_adjustment;
        var bot_buffer_item_count_after_scroll_adjustment = Math$max(0, newArraySize - top_buffer_item_count_after_scroll_adjustment - newViewCount);
        repeat._first
            = repeat._lastRebind = first_index_after_scroll_adjustment;
        repeat._previousFirst = firstIndexAfterMutation;
        repeat._isAtTop = first_index_after_scroll_adjustment === 0;
        repeat._isLastIndex = bot_buffer_item_count_after_scroll_adjustment === 0;
        repeat._topBufferHeight = top_buffer_item_count_after_scroll_adjustment * itemHeight;
        repeat._bottomBufferHeight = bot_buffer_item_count_after_scroll_adjustment * itemHeight;
        repeat._handlingMutations = false;
        repeat.revertScrollCheckGuard();
        repeat._updateBufferElements();
        updateAllViews(repeat, 0);
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
        return Math$floor(index - topBufferItems);
    };
    return ArrayVirtualRepeatStrategy;
}(aureliaTemplatingResources.ArrayRepeatStrategy));

var NullVirtualRepeatStrategy = (function (_super) {
    __extends(NullVirtualRepeatStrategy, _super);
    function NullVirtualRepeatStrategy() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    NullVirtualRepeatStrategy.prototype.initCalculation = function (repeat, items) {
        repeat.itemHeight
            = repeat.elementsInView
                = repeat._viewsLength = 0;
        return 2;
    };
    NullVirtualRepeatStrategy.prototype.createFirstItem = function () {
        return null;
    };
    NullVirtualRepeatStrategy.prototype.instanceMutated = function () { };
    NullVirtualRepeatStrategy.prototype.instanceChanged = function (repeat) {
        repeat.removeAllViews(true, false);
        repeat._resetCalculation();
    };
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
        return getScrollContainer(element);
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
            parent.insertBefore(aureliaPal.DOM.createElement('div'), element.nextSibling)
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
        return this.getTable(element).parentNode;
    };
    BaseTableTemplateStrategy.prototype.createBuffers = function (element) {
        var parent = element.parentNode;
        return [
            parent.insertBefore(aureliaPal.DOM.createElement('tr'), element),
            parent.insertBefore(aureliaPal.DOM.createElement('tr'), element.nextSibling)
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
    ListTemplateStrategy.prototype.getScrollContainer = function (element) {
        var listElement = this.getList(element);
        return hasOverflowScroll(listElement)
            ? listElement
            : listElement.parentNode;
    };
    ListTemplateStrategy.prototype.createBuffers = function (element) {
        var parent = element.parentNode;
        return [
            parent.insertBefore(aureliaPal.DOM.createElement('li'), element),
            parent.insertBefore(aureliaPal.DOM.createElement('li'), element.nextSibling)
        ];
    };
    ListTemplateStrategy.prototype.getList = function (element) {
        return element.parentNode;
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
    itemSizeChange: 'virtual-repeat-item-size-changed'
});

var getResizeObserverClass = function () { return aureliaPal.PLATFORM.global.ResizeObserver; };

var VirtualRepeat = (function (_super) {
    __extends(VirtualRepeat, _super);
    function VirtualRepeat(element, viewFactory, instruction, viewSlot, viewResources, observerLocator, collectionStrategyLocator, templateStrategyLocator) {
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
        _this._isScrolling = false;
        _this._scrollingDown = false;
        _this._scrollingUp = false;
        _this._switchedDirection = false;
        _this._isAttached = false;
        _this._ticking = false;
        _this._fixedHeightContainer = false;
        _this._isAtTop = true;
        _this._calledGetMore = false;
        _this._skipNextScrollHandle = false;
        _this._handlingMutations = false;
        _this.element = element;
        _this.viewFactory = viewFactory;
        _this.instruction = instruction;
        _this.viewSlot = viewSlot;
        _this.lookupFunctions = viewResources['lookupFunctions'];
        _this.observerLocator = observerLocator;
        _this.taskQueue = observerLocator.taskQueue;
        _this.strategyLocator = collectionStrategyLocator;
        _this.templateStrategyLocator = templateStrategyLocator;
        _this.sourceExpression = aureliaTemplatingResources.getItemsSourceExpression(_this.instruction, 'virtual-repeat.for');
        _this.isOneTime = aureliaTemplatingResources.isOneTime(_this.sourceExpression);
        _this.itemHeight
            = _this._prevItemsCount
                = _this.distanceToTop
                    = 0;
        _this.revertScrollCheckGuard = function () {
            _this._ticking = false;
        };
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
            TemplateStrategyLocator
        ];
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
        this._prevItemsCount = this.items.length;
        var element = this.element;
        var templateStrategy = this.templateStrategy = this.templateStrategyLocator.getStrategy(element);
        var scrollListener = this.scrollListener = function () {
            _this._onScroll();
        };
        var containerEl = this.scrollerEl = templateStrategy.getScrollContainer(element);
        var _a = templateStrategy.createBuffers(element), topBufferEl = _a[0], bottomBufferEl = _a[1];
        var isFixedHeightContainer = this._fixedHeightContainer = hasOverflowScroll(containerEl);
        this.topBufferEl = topBufferEl;
        this.bottomBufferEl = bottomBufferEl;
        this.itemsChanged();
        if (isFixedHeightContainer) {
            containerEl.addEventListener('scroll', scrollListener);
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
                    _this._handleScroll();
                }
            }, 500);
        }
        if (this.items.length < this.elementsInView) {
            this._getMore(true);
        }
    };
    VirtualRepeat.prototype.call = function (context, changes) {
        this[context](this.items, changes);
    };
    VirtualRepeat.prototype.detached = function () {
        var scrollCt = this.scrollerEl;
        var scrollListener = this.scrollListener;
        if (hasOverflowScroll(scrollCt)) {
            scrollCt.removeEventListener('scroll', scrollListener);
        }
        else {
            aureliaPal.DOM.removeEventListener('scroll', scrollListener, false);
        }
        this._unobserveScrollerSize();
        this._currScrollerContentRect
            = this._isLastIndex = undefined;
        this._isAttached
            = this._fixedHeightContainer = false;
        this._unsubscribeCollection();
        this._resetCalculation();
        this.templateStrategy.removeBuffers(this.element, this.topBufferEl, this.bottomBufferEl);
        this.topBufferEl = this.bottomBufferEl = this.scrollerEl = this.scrollListener = null;
        this.removeAllViews(true, false);
        var $clearInterval = aureliaPal.PLATFORM.global.clearInterval;
        $clearInterval(this._calcDistanceToTopInterval);
        $clearInterval(this._sizeInterval);
        this._prevItemsCount
            = this.distanceToTop
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
        strategy.instanceChanged(this, items, this._first);
        if (calculationSignals & 1) {
            this._resetCalculation();
        }
        if ((calculationSignals & 2) === 0) {
            var _a = aureliaPal.PLATFORM.global, $setInterval = _a.setInterval, $clearInterval_1 = _a.clearInterval;
            $clearInterval_1(this._sizeInterval);
            this._sizeInterval = $setInterval(function () {
                if (_this.items) {
                    var firstView = _this._firstView() || _this.strategy.createFirstItem(_this);
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
            this._observeScroller(this.getScroller());
        }
    };
    VirtualRepeat.prototype.handleCollectionMutated = function (collection, changes) {
        if (this._ignoreMutation) {
            return;
        }
        this._handlingMutations = true;
        this._prevItemsCount = collection.length;
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
    VirtualRepeat.prototype.getScroller = function () {
        return this._fixedHeightContainer
            ? this.scrollerEl
            : document.documentElement;
    };
    VirtualRepeat.prototype.getScrollerInfo = function () {
        var scroller = this.getScroller();
        return {
            scroller: scroller,
            scrollHeight: scroller.scrollHeight,
            scrollTop: scroller.scrollTop,
            height: calcScrollHeight(scroller)
        };
    };
    VirtualRepeat.prototype._resetCalculation = function () {
        this._first
            = this._previousFirst
                = this._viewsLength
                    = this._lastRebind
                        = this._topBufferHeight
                            = this._bottomBufferHeight
                                = this._prevItemsCount
                                    = this.itemHeight
                                        = this.elementsInView = 0;
        this._isScrolling
            = this._scrollingDown
                = this._scrollingUp
                    = this._switchedDirection
                        = this._ignoreMutation
                            = this._handlingMutations
                                = this._ticking
                                    = this._isLastIndex = false;
        this._isAtTop = true;
        this._updateBufferElements(true);
    };
    VirtualRepeat.prototype._onScroll = function () {
        var _this = this;
        var isHandlingMutations = this._handlingMutations;
        if (!this._ticking && !isHandlingMutations) {
            this.taskQueue.queueMicroTask(function () {
                _this._handleScroll();
                _this._ticking = false;
            });
            this._ticking = true;
        }
        if (isHandlingMutations) {
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
        var items = this.items;
        if (!items) {
            return;
        }
        var topBufferEl = this.topBufferEl;
        var scrollerEl = this.scrollerEl;
        var itemHeight = this.itemHeight;
        var realScrollTop = 0;
        var isFixedHeightContainer = this._fixedHeightContainer;
        if (isFixedHeightContainer) {
            var topBufferDistance = getDistanceToParent(topBufferEl, scrollerEl);
            var scrollerScrollTop = scrollerEl.scrollTop;
            realScrollTop = Math$max(0, scrollerScrollTop - Math$abs(topBufferDistance));
        }
        else {
            realScrollTop = pageYOffset - this.distanceToTop;
        }
        var elementsInView = this.elementsInView;
        var firstIndex = Math$max(0, itemHeight > 0 ? Math$floor(realScrollTop / itemHeight) : 0);
        var currLastReboundIndex = this._lastRebind;
        if (firstIndex > items.length - elementsInView) {
            firstIndex = Math$max(0, items.length - elementsInView);
        }
        this._first = firstIndex;
        this._checkScrolling();
        var isSwitchedDirection = this._switchedDirection;
        var currentTopBufferHeight = this._topBufferHeight;
        var currentBottomBufferHeight = this._bottomBufferHeight;
        if (this._scrollingDown) {
            var viewsToMoveCount = firstIndex - currLastReboundIndex;
            if (isSwitchedDirection) {
                viewsToMoveCount = this._isAtTop
                    ? firstIndex
                    : (firstIndex - currLastReboundIndex);
            }
            this._isAtTop = false;
            this._lastRebind = firstIndex;
            var movedViewsCount = this._moveViews(viewsToMoveCount);
            var adjustHeight = movedViewsCount < viewsToMoveCount
                ? currentBottomBufferHeight
                : itemHeight * movedViewsCount;
            if (viewsToMoveCount > 0) {
                this._getMore();
            }
            this._switchedDirection = false;
            this._topBufferHeight = currentTopBufferHeight + adjustHeight;
            this._bottomBufferHeight = Math$max(currentBottomBufferHeight - adjustHeight, 0);
            this._updateBufferElements(true);
        }
        else if (this._scrollingUp) {
            var isLastIndex = this._isLastIndex;
            var viewsToMoveCount = currLastReboundIndex - firstIndex;
            var initialScrollState = isLastIndex === undefined;
            if (isSwitchedDirection) {
                if (isLastIndex) {
                    viewsToMoveCount = items.length - firstIndex - elementsInView;
                }
                else {
                    viewsToMoveCount = currLastReboundIndex - firstIndex;
                }
            }
            this._isLastIndex = false;
            this._lastRebind = firstIndex;
            var movedViewsCount = this._moveViews(viewsToMoveCount);
            var adjustHeight = movedViewsCount < viewsToMoveCount
                ? currentTopBufferHeight
                : itemHeight * movedViewsCount;
            if (viewsToMoveCount > 0) {
                var force = movedViewsCount === 0 && initialScrollState && firstIndex <= 0 ? true : false;
                this._getMore(force);
            }
            this._switchedDirection = false;
            this._topBufferHeight = Math$max(currentTopBufferHeight - adjustHeight, 0);
            this._bottomBufferHeight = currentBottomBufferHeight + adjustHeight;
            this._updateBufferElements(true);
        }
        this._previousFirst = firstIndex;
        this._isScrolling = false;
    };
    VirtualRepeat.prototype._getMore = function (force) {
        var _this = this;
        if (this._isLastIndex || this._first === 0 || force === true) {
            if (!this._calledGetMore) {
                var executeGetMore = function () {
                    _this._calledGetMore = true;
                    var firstView = _this._firstView();
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
                        var bindingContext = overrideContext.bindingContext;
                        var getMoreFuncName = firstView.firstChild.getAttribute(scrollNextAttrName);
                        var funcCall = bindingContext[getMoreFuncName];
                        if (typeof funcCall === 'function') {
                            var result = funcCall.call(bindingContext, topIndex, isAtBottom, isAtTop);
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
        var _a = this, _first = _a._first, _scrollingUp = _a._scrollingUp, _scrollingDown = _a._scrollingDown, _previousFirst = _a._previousFirst;
        var isScrolling = false;
        var isScrollingDown = _scrollingDown;
        var isScrollingUp = _scrollingUp;
        var isSwitchedDirection = false;
        if (_first > _previousFirst) {
            if (!_scrollingDown) {
                isScrollingDown = true;
                isScrollingUp = false;
                isSwitchedDirection = true;
            }
            else {
                isSwitchedDirection = false;
            }
            isScrolling = true;
        }
        else if (_first < _previousFirst) {
            if (!_scrollingUp) {
                isScrollingDown = false;
                isScrollingUp = true;
                isSwitchedDirection = true;
            }
            else {
                isSwitchedDirection = false;
            }
            isScrolling = true;
        }
        this._isScrolling = isScrolling;
        this._scrollingDown = isScrollingDown;
        this._scrollingUp = isScrollingUp;
        this._switchedDirection = isSwitchedDirection;
    };
    VirtualRepeat.prototype._updateBufferElements = function (skipUpdate) {
        this.topBufferEl.style.height = this._topBufferHeight + "px";
        this.bottomBufferEl.style.height = this._bottomBufferHeight + "px";
        if (skipUpdate) {
            this._ticking = true;
            requestAnimationFrame(this.revertScrollCheckGuard);
        }
    };
    VirtualRepeat.prototype._unsubscribeCollection = function () {
        var collectionObserver = this.collectionObserver;
        if (collectionObserver) {
            collectionObserver.unsubscribe(this.callContext, this);
            this.collectionObserver = this.callContext = null;
        }
    };
    VirtualRepeat.prototype._firstView = function () {
        return this.view(0);
    };
    VirtualRepeat.prototype._lastView = function () {
        return this.view(this.viewCount() - 1);
    };
    VirtualRepeat.prototype._moveViews = function (viewsCount) {
        var isScrollingDown = this._scrollingDown;
        var getNextIndex = isScrollingDown ? $plus : $minus;
        var childrenCount = this.viewCount();
        var viewIndex = isScrollingDown ? 0 : childrenCount - 1;
        var items = this.items;
        var currentIndex = isScrollingDown
            ? this._lastViewIndex() + 1
            : this._firstViewIndex() - 1;
        var i = 0;
        var nextIndex = 0;
        var view;
        var viewToMoveLimit = viewsCount - (childrenCount * 2);
        while (i < viewsCount && !this._isAtFirstOrLastIndex) {
            view = this.view(viewIndex);
            nextIndex = getNextIndex(currentIndex, i);
            this._isLastIndex = nextIndex > items.length - 2;
            this._isAtTop = nextIndex < 1;
            if (!(this._isAtFirstOrLastIndex && childrenCount >= items.length)) {
                if (i > viewToMoveLimit) {
                    rebindAndMoveView(this, view, nextIndex, isScrollingDown);
                }
                i++;
            }
        }
        return viewsCount - (viewsCount - i);
    };
    Object.defineProperty(VirtualRepeat.prototype, "_isAtFirstOrLastIndex", {
        get: function () {
            return !this._isScrolling || this._scrollingDown ? this._isLastIndex : this._isAtTop;
        },
        enumerable: true,
        configurable: true
    });
    VirtualRepeat.prototype._firstViewIndex = function () {
        var firstView = this._firstView();
        return firstView === null ? -1 : firstView.overrideContext.$index;
    };
    VirtualRepeat.prototype._lastViewIndex = function () {
        var lastView = this._lastView();
        return lastView === null ? -1 : lastView.overrideContext.$index;
    };
    VirtualRepeat.prototype._observeScroller = function (scrollerEl) {
        var _this = this;
        var $raf = requestAnimationFrame;
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
    VirtualRepeat.prototype._unobserveScrollerSize = function () {
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
var $minus = function (index, i) { return index - i; };
var $plus = function (index, i) { return index + i; };

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
exports.VirtualizationEvents = VirtualizationEvents;
