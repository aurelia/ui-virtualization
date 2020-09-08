import { mergeSplice, ObserverLocator } from 'aurelia-binding';
import { BoundViewFactory, TargetInstruction, ViewSlot, ViewResources, ElementEvents } from 'aurelia-templating';
import { updateOverrideContext, ArrayRepeatStrategy, createFullOverrideContext, NullRepeatStrategy, AbstractRepeater, viewsRequireLifecycle, getItemsSourceExpression, isOneTime, unwrapExpression, updateOneTimeBinding } from 'aurelia-templating-resources';
import { DOM, PLATFORM } from 'aurelia-pal';
import { Container } from 'aurelia-dependency-injection';

const rebindView = (repeat, view, collectionIndex, collection) => {
    view.bindingContext[repeat.local] = collection[collectionIndex];
    updateOverrideContext(view.overrideContext, collectionIndex, collection.length);
};
const rebindAndMoveView = (repeat, view, index, moveToBottom) => {
    const items = repeat.items;
    const viewSlot = repeat.viewSlot;
    updateOverrideContext(view.overrideContext, index, items.length);
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
const calcMinViewsRequired = (scrollerHeight, itemHeight) => {
    return Math$floor(scrollerHeight / itemHeight) + 1;
};
const Math$abs = Math.abs;
const Math$max = Math.max;
const Math$min = Math.min;
const Math$round = Math.round;
const Math$floor = Math.floor;
const $isNaN = isNaN;

const doc = document;
const htmlElement = doc.documentElement;
const $raf = requestAnimationFrame.bind(window);

const getScrollerElement = (element) => {
    let current = element.parentNode;
    while (current !== null && current !== htmlElement) {
        if (hasOverflowScroll(current)) {
            return current;
        }
        current = current.parentNode;
    }
    return doc.scrollingElement || htmlElement;
};
const getElementDistanceToTopOfDocument = (element) => {
    let box = element.getBoundingClientRect();
    let scrollTop = window.pageYOffset;
    let clientTop = htmlElement.clientTop;
    let top = box.top + scrollTop - clientTop;
    return Math$round(top);
};
const hasOverflowScroll = (element) => {
    const style = window.getComputedStyle(element);
    return style && (style.overflowY === 'scroll' || style.overflow === 'scroll' || style.overflowY === 'auto' || style.overflow === 'auto');
};
const getStyleValues = (element, ...styles) => {
    let currentStyle = window.getComputedStyle(element);
    let value = 0;
    let styleValue = 0;
    for (let i = 0, ii = styles.length; ii > i; ++i) {
        styleValue = parseFloat(currentStyle[styles[i]]);
        value += $isNaN(styleValue) ? 0 : styleValue;
    }
    return value;
};
const calcOuterHeight = (element) => {
    let height = element.getBoundingClientRect().height;
    height += getStyleValues(element, 'marginTop', 'marginBottom');
    return height;
};
const calcScrollHeight = (element) => {
    let height = element.getBoundingClientRect().height;
    height -= getStyleValues(element, 'borderTopWidth', 'borderBottomWidth');
    return height;
};
const insertBeforeNode = (view, bottomBuffer) => {
    bottomBuffer.parentNode.insertBefore(view.lastChild, bottomBuffer);
};
const getDistanceToParent = (child, parent) => {
    const offsetParent = child.offsetParent;
    const childOffsetTop = child.offsetTop;
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

class ArrayVirtualRepeatStrategy extends ArrayRepeatStrategy {
    createFirstRow(repeat) {
        const overrideContext = createFullOverrideContext(repeat, repeat.items[0], 0, 1);
        return repeat.addView(overrideContext.bindingContext, overrideContext);
    }
    count(items) {
        return items.length;
    }
    initCalculation(repeat, items) {
        const itemCount = items.length;
        if (!(itemCount > 0)) {
            return 1;
        }
        const scrollerInfo = repeat.getScrollerInfo();
        const existingViewCount = repeat.viewCount();
        if (itemCount > 0 && existingViewCount === 0) {
            this.createFirstRow(repeat);
        }
        const firstView = repeat.firstView();
        const itemHeight = calcOuterHeight(firstView.firstChild);
        if (itemHeight === 0) {
            return 0;
        }
        repeat.itemHeight = itemHeight;
        const scroll_el_height = scrollerInfo.height;
        const elementsInView = repeat.minViewsRequired = calcMinViewsRequired(scroll_el_height, itemHeight);
        return 2 | 4;
    }
    onAttached(repeat) {
        if (repeat.items.length < repeat.minViewsRequired) {
            repeat.getMore(0, true, this.isNearBottom(repeat, repeat.lastViewIndex()), true);
        }
    }
    getViewRange(repeat, scrollerInfo) {
        const topBufferEl = repeat.topBufferEl;
        const scrollerEl = repeat.scrollerEl;
        const itemHeight = repeat.itemHeight;
        let realScrollTop = 0;
        const isFixedHeightContainer = scrollerInfo.scroller !== htmlElement;
        if (isFixedHeightContainer) {
            const topBufferDistance = getDistanceToParent(topBufferEl, scrollerEl);
            const scrollerScrollTop = scrollerInfo.scrollTop;
            realScrollTop = Math$max(0, scrollerScrollTop - Math$abs(topBufferDistance));
        }
        else {
            realScrollTop = pageYOffset - repeat.distanceToTop;
        }
        const realViewCount = repeat.minViewsRequired * 2;
        let firstVisibleIndex = Math$max(0, itemHeight > 0 ? Math$floor(realScrollTop / itemHeight) : 0);
        const lastVisibleIndex = Math$min(repeat.items.length - 1, firstVisibleIndex + (realViewCount - 1));
        firstVisibleIndex = Math$max(0, Math$min(firstVisibleIndex, lastVisibleIndex - (realViewCount - 1)));
        return [firstVisibleIndex, lastVisibleIndex];
    }
    updateBuffers(repeat, firstIndex) {
        const itemHeight = repeat.itemHeight;
        const itemCount = repeat.items.length;
        repeat.topBufferHeight = firstIndex * itemHeight;
        repeat.bottomBufferHeight = (itemCount - firstIndex - repeat.viewCount()) * itemHeight;
        repeat.updateBufferElements(true);
    }
    isNearTop(repeat, firstIndex) {
        const itemCount = repeat.items.length;
        return itemCount > 0
            ? firstIndex < repeat.edgeDistance
            : false;
    }
    isNearBottom(repeat, lastIndex) {
        const itemCount = repeat.items.length;
        return lastIndex === -1
            ? true
            : itemCount > 0
                ? lastIndex > (itemCount - 1 - repeat.edgeDistance)
                : false;
    }
    instanceChanged(repeat, items, first) {
        if (this._inPlaceProcessItems(repeat, items, first)) {
            this._remeasure(repeat, repeat.itemHeight, repeat.minViewsRequired * 2, items.length, repeat.$first);
        }
    }
    instanceMutated(repeat, array, splices) {
        this._standardProcessInstanceMutated(repeat, array, splices);
    }
    _inPlaceProcessItems($repeat, items, firstIndex) {
        const repeat = $repeat;
        const currItemCount = items.length;
        if (currItemCount === 0) {
            repeat.removeAllViews(true, false);
            repeat.resetCalculation();
            repeat.__queuedSplices = repeat.__array = undefined;
            return false;
        }
        const max_views_count = repeat.minViewsRequired * 2;
        let realViewsCount = repeat.viewCount();
        while (realViewsCount > currItemCount) {
            realViewsCount--;
            repeat.removeView(realViewsCount, true, false);
        }
        while (realViewsCount > max_views_count) {
            realViewsCount--;
            repeat.removeView(realViewsCount, true, false);
        }
        realViewsCount = Math$min(realViewsCount, max_views_count);
        const local = repeat.local;
        const lastIndex = currItemCount - 1;
        if (firstIndex + realViewsCount > lastIndex) {
            firstIndex = Math$max(0, currItemCount - realViewsCount);
        }
        repeat.$first = firstIndex;
        for (let i = 0; i < realViewsCount; i++) {
            const currIndex = i + firstIndex;
            const view = repeat.view(i);
            const last = currIndex === currItemCount - 1;
            const middle = currIndex !== 0 && !last;
            const bindingContext = view.bindingContext;
            const overrideContext = view.overrideContext;
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
            const odd = currIndex % 2 === 1;
            overrideContext.$odd = odd;
            overrideContext.$even = !odd;
            repeat.updateBindings(view);
        }
        const minLength = Math$min(max_views_count, currItemCount);
        for (let i = realViewsCount; i < minLength; i++) {
            const overrideContext = createFullOverrideContext(repeat, items[i], i, currItemCount);
            repeat.addView(overrideContext.bindingContext, overrideContext);
        }
        return true;
    }
    _standardProcessInstanceMutated($repeat, array, splices) {
        const repeat = $repeat;
        if (repeat.__queuedSplices) {
            for (let i = 0, ii = splices.length; i < ii; ++i) {
                const { index, removed, addedCount } = splices[i];
                mergeSplice(repeat.__queuedSplices, index, removed, addedCount);
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
        const maybePromise = this._runSplices(repeat, array.slice(0), splices);
        if (maybePromise instanceof Promise) {
            const queuedSplices = repeat.__queuedSplices = [];
            const runQueuedSplices = () => {
                if (!queuedSplices.length) {
                    repeat.__queuedSplices = repeat.__array = undefined;
                    return;
                }
                const nextPromise = this._runSplices(repeat, repeat.__array, queuedSplices) || Promise.resolve();
                nextPromise.then(runQueuedSplices);
            };
            maybePromise.then(runQueuedSplices);
        }
    }
    _runSplices(repeat, newArray, splices) {
        const firstIndex = repeat.$first;
        let totalRemovedCount = 0;
        let totalAddedCount = 0;
        let splice;
        let i = 0;
        const spliceCount = splices.length;
        const newArraySize = newArray.length;
        let allSplicesAreInplace = true;
        for (i = 0; spliceCount > i; i++) {
            splice = splices[i];
            const removedCount = splice.removed.length;
            const addedCount = splice.addedCount;
            totalRemovedCount += removedCount;
            totalAddedCount += addedCount;
            if (removedCount !== addedCount) {
                allSplicesAreInplace = false;
            }
        }
        if (allSplicesAreInplace) {
            const lastIndex = repeat.lastViewIndex();
            const repeatViewSlot = repeat.viewSlot;
            for (i = 0; spliceCount > i; i++) {
                splice = splices[i];
                for (let collectionIndex = splice.index; collectionIndex < splice.index + splice.addedCount; collectionIndex++) {
                    if (collectionIndex >= firstIndex && collectionIndex <= lastIndex) {
                        const viewIndex = collectionIndex - firstIndex;
                        const overrideContext = createFullOverrideContext(repeat, newArray[collectionIndex], collectionIndex, newArraySize);
                        repeat.removeView(viewIndex, true, true);
                        repeat.insertView(viewIndex, overrideContext.bindingContext, overrideContext);
                    }
                }
            }
            return;
        }
        let firstIndexAfterMutation = firstIndex;
        const itemHeight = repeat.itemHeight;
        const originalSize = newArraySize + totalRemovedCount - totalAddedCount;
        const currViewCount = repeat.viewCount();
        let newViewCount = currViewCount;
        if (originalSize === 0 && itemHeight === 0) {
            repeat.resetCalculation();
            repeat.itemsChanged();
            return;
        }
        const all_splices_are_positive_and_before_view_port = totalRemovedCount === 0
            && totalAddedCount > 0
            && splices.every(splice => splice.index <= firstIndex);
        if (all_splices_are_positive_and_before_view_port) {
            repeat.$first = firstIndex + totalAddedCount - 1;
            repeat.topBufferHeight += totalAddedCount * itemHeight;
            repeat.enableScroll();
            const scrollerInfo = repeat.getScrollerInfo();
            const scroller_scroll_top = scrollerInfo.scrollTop;
            const top_buffer_distance = getDistanceToParent(repeat.topBufferEl, scrollerInfo.scroller);
            const real_scroll_top = Math$max(0, scroller_scroll_top === 0
                ? 0
                : (scroller_scroll_top - top_buffer_distance));
            let first_index_after_scroll_adjustment = real_scroll_top === 0
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
        const lastViewIndex = repeat.lastViewIndex();
        const all_splices_are_after_view_port = currViewCount > repeat.minViewsRequired
            && splices.every(s => s.index > lastViewIndex);
        if (all_splices_are_after_view_port) {
            repeat.bottomBufferHeight = Math$max(0, newArraySize - firstIndex - currViewCount) * itemHeight;
            repeat.updateBufferElements(true);
        }
        else {
            let viewsRequiredCount = repeat.minViewsRequired * 2;
            if (viewsRequiredCount === 0) {
                const scrollerInfo = repeat.getScrollerInfo();
                const minViewsRequired = calcMinViewsRequired(scrollerInfo.height, itemHeight);
                repeat.minViewsRequired = minViewsRequired;
                viewsRequiredCount = minViewsRequired * 2;
            }
            for (i = 0; spliceCount > i; ++i) {
                const { addedCount, removed: { length: removedCount }, index: spliceIndex } = splices[i];
                const removeDelta = removedCount - addedCount;
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
            const newTopBufferItemCount = newArraySize >= firstIndexAfterMutation
                ? firstIndexAfterMutation
                : 0;
            const viewCountDelta = newViewCount - currViewCount;
            if (viewCountDelta > 0) {
                for (i = 0; viewCountDelta > i; ++i) {
                    const collectionIndex = firstIndexAfterMutation + currViewCount + i;
                    const overrideContext = createFullOverrideContext(repeat, newArray[collectionIndex], collectionIndex, newArray.length);
                    repeat.addView(overrideContext.bindingContext, overrideContext);
                }
            }
            else {
                const ii = Math$abs(viewCountDelta);
                for (i = 0; ii > i; ++i) {
                    repeat.removeView(newViewCount, true, false);
                }
            }
            const newBotBufferItemCount = Math$max(0, newArraySize - newTopBufferItemCount - newViewCount);
            repeat.$first = firstIndexAfterMutation;
            repeat.topBufferHeight = newTopBufferItemCount * itemHeight;
            repeat.bottomBufferHeight = newBotBufferItemCount * itemHeight;
            repeat.updateBufferElements(true);
        }
        this._remeasure(repeat, itemHeight, newViewCount, newArraySize, firstIndexAfterMutation);
    }
    updateAllViews(repeat, startIndex) {
        const views = repeat.viewSlot.children;
        const viewLength = views.length;
        const collection = repeat.items;
        const delta = Math$floor(repeat.topBufferHeight / repeat.itemHeight);
        let collectionIndex = 0;
        let view;
        for (; viewLength > startIndex; ++startIndex) {
            collectionIndex = startIndex + delta;
            view = repeat.view(startIndex);
            rebindView(repeat, view, collectionIndex, collection);
            repeat.updateBindings(view);
        }
    }
    remeasure(repeat) {
        this._remeasure(repeat, repeat.itemHeight, repeat.viewCount(), repeat.items.length, repeat.firstViewIndex());
    }
    _remeasure(repeat, itemHeight, newViewCount, newArraySize, firstIndex) {
        const scrollerInfo = repeat.getScrollerInfo();
        const scroller_scroll_top = scrollerInfo.scrollTop;
        const top_buffer_distance = getDistanceToParent(repeat.topBufferEl, scrollerInfo.scroller);
        const real_scroll_top = Math$max(0, scroller_scroll_top === 0
            ? 0
            : (scroller_scroll_top - top_buffer_distance));
        let first_index_after_scroll_adjustment = real_scroll_top === 0
            ? 0
            : Math$floor(real_scroll_top / itemHeight);
        if (first_index_after_scroll_adjustment + newViewCount >= newArraySize) {
            first_index_after_scroll_adjustment = Math$max(0, newArraySize - newViewCount);
        }
        const top_buffer_item_count_after_scroll_adjustment = first_index_after_scroll_adjustment;
        const bot_buffer_item_count_after_scroll_adjustment = Math$max(0, newArraySize - top_buffer_item_count_after_scroll_adjustment - newViewCount);
        repeat.$first = first_index_after_scroll_adjustment;
        repeat.topBufferHeight = top_buffer_item_count_after_scroll_adjustment * itemHeight;
        repeat.bottomBufferHeight = bot_buffer_item_count_after_scroll_adjustment * itemHeight;
        repeat._handlingMutations = false;
        repeat.revertScrollCheckGuard();
        repeat.updateBufferElements();
        this.updateAllViews(repeat, 0);
    }
}

class NullVirtualRepeatStrategy extends NullRepeatStrategy {
    createFirstRow() {
        return null;
    }
    count(items) {
        return 0;
    }
    getViewRange(repeat, scrollerInfo) {
        return [0, 0];
    }
    updateBuffers(repeat, firstIndex) { }
    onAttached() { }
    isNearTop() {
        return false;
    }
    isNearBottom() {
        return false;
    }
    initCalculation(repeat, items) {
        repeat.itemHeight
            = repeat.minViewsRequired
                = 0;
        return 2;
    }
    instanceMutated() { }
    instanceChanged(repeat) {
        repeat.removeAllViews(true, false);
        repeat.resetCalculation();
    }
    remeasure(repeat) { }
    updateAllViews() { }
}

class VirtualRepeatStrategyLocator {
    constructor() {
        this.matchers = [];
        this.strategies = [];
        this.addStrategy(items => items === null || items === undefined, new NullVirtualRepeatStrategy());
        this.addStrategy(items => items instanceof Array, new ArrayVirtualRepeatStrategy());
    }
    addStrategy(matcher, strategy) {
        this.matchers.push(matcher);
        this.strategies.push(strategy);
    }
    getStrategy(items) {
        let matchers = this.matchers;
        for (let i = 0, ii = matchers.length; i < ii; ++i) {
            if (matchers[i](items)) {
                return this.strategies[i];
            }
        }
        return null;
    }
}

class DefaultTemplateStrategy {
    getScrollContainer(element) {
        return getScrollerElement(element);
    }
    moveViewFirst(view, topBuffer) {
        insertBeforeNode(view, DOM.nextElementSibling(topBuffer));
    }
    moveViewLast(view, bottomBuffer) {
        const previousSibling = bottomBuffer.previousSibling;
        const referenceNode = previousSibling.nodeType === 8 && previousSibling.data === 'anchor' ? previousSibling : bottomBuffer;
        insertBeforeNode(view, referenceNode);
    }
    createBuffers(element) {
        const parent = element.parentNode;
        return [
            parent.insertBefore(DOM.createElement('div'), element),
            parent.insertBefore(DOM.createElement('div'), element.nextSibling),
        ];
    }
    removeBuffers(el, topBuffer, bottomBuffer) {
        const parent = el.parentNode;
        parent.removeChild(topBuffer);
        parent.removeChild(bottomBuffer);
    }
    getFirstElement(topBuffer, bottomBuffer) {
        const firstEl = topBuffer.nextElementSibling;
        return firstEl === bottomBuffer ? null : firstEl;
    }
    getLastElement(topBuffer, bottomBuffer) {
        const lastEl = bottomBuffer.previousElementSibling;
        return lastEl === topBuffer ? null : lastEl;
    }
}

class BaseTableTemplateStrategy extends DefaultTemplateStrategy {
    getScrollContainer(element) {
        return getScrollerElement(this.getTable(element));
    }
    createBuffers(element) {
        const parent = element.parentNode;
        return [
            parent.insertBefore(DOM.createElement('tr'), element),
            parent.insertBefore(DOM.createElement('tr'), element.nextSibling),
        ];
    }
}
class TableBodyStrategy extends BaseTableTemplateStrategy {
    getTable(element) {
        return element.parentNode;
    }
}
class TableRowStrategy extends BaseTableTemplateStrategy {
    getTable(element) {
        return element.parentNode.parentNode;
    }
}

class ListTemplateStrategy extends DefaultTemplateStrategy {
    createBuffers(element) {
        const parent = element.parentNode;
        return [
            parent.insertBefore(DOM.createElement('li'), element),
            parent.insertBefore(DOM.createElement('li'), element.nextSibling),
        ];
    }
}

class TemplateStrategyLocator {
    constructor(container) {
        this.container = container;
    }
    getStrategy(element) {
        const parent = element.parentNode;
        const container = this.container;
        if (parent === null) {
            return container.get(DefaultTemplateStrategy);
        }
        const parentTagName = parent.tagName;
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
    }
}
TemplateStrategyLocator.inject = [Container];

const VirtualizationEvents = Object.assign(Object.create(null), {
    scrollerSizeChange: 'virtual-repeat-scroller-size-changed',
    itemSizeChange: 'virtual-repeat-item-size-changed',
});

const getResizeObserverClass = () => PLATFORM.global.ResizeObserver;

class VirtualRepeat extends AbstractRepeater {
    constructor(element, viewFactory, instruction, viewSlot, viewResources, observerLocator, collectionStrategyLocator, templateStrategyLocator) {
        super({
            local: 'item',
            viewsRequireLifecycle: viewsRequireLifecycle(viewFactory),
        });
        this.$first = 0;
        this._isAttached = false;
        this._ticking = false;
        this._calledGetMore = false;
        this._skipNextScrollHandle = false;
        this._handlingMutations = false;
        this._lastGetMore = 0;
        this.element = element;
        this.viewFactory = viewFactory;
        this.instruction = instruction;
        this.viewSlot = viewSlot;
        this.lookupFunctions = viewResources['lookupFunctions'];
        this.observerLocator = observerLocator;
        this.taskQueue = observerLocator.taskQueue;
        this.strategyLocator = collectionStrategyLocator;
        this.templateStrategyLocator = templateStrategyLocator;
        this.edgeDistance = 5;
        this.sourceExpression = getItemsSourceExpression(this.instruction, 'virtual-repeat.for');
        this.isOneTime = isOneTime(this.sourceExpression);
        this.topBufferHeight
            = this.bottomBufferHeight
                = this.itemHeight
                    = this.distanceToTop
                        = 0;
        this.revertScrollCheckGuard = () => {
            this._ticking = false;
        };
        this._onScroll = this._onScroll.bind(this);
    }
    static inject() {
        return [
            DOM.Element,
            BoundViewFactory,
            TargetInstruction,
            ViewSlot,
            ViewResources,
            ObserverLocator,
            VirtualRepeatStrategyLocator,
            TemplateStrategyLocator,
        ];
    }
    static $resource() {
        return {
            type: 'attribute',
            name: 'virtual-repeat',
            templateController: true,
            bindables: ['items', 'local'],
        };
    }
    bind(bindingContext, overrideContext) {
        this.scope = { bindingContext, overrideContext };
    }
    attached() {
        this._isAttached = true;
        const element = this.element;
        const templateStrategy = this.templateStrategy = this.templateStrategyLocator.getStrategy(element);
        const scrollerEl = this.scrollerEl = templateStrategy.getScrollContainer(element);
        const [topBufferEl, bottomBufferEl] = templateStrategy.createBuffers(element);
        const isFixedHeightContainer = scrollerEl !== htmlElement;
        const scrollListener = this._onScroll;
        this.topBufferEl = topBufferEl;
        this.bottomBufferEl = bottomBufferEl;
        this.itemsChanged();
        this._currScrollerInfo = this.getScrollerInfo();
        if (isFixedHeightContainer) {
            scrollerEl.addEventListener('scroll', scrollListener);
        }
        else {
            const firstElement = templateStrategy.getFirstElement(topBufferEl, bottomBufferEl);
            this.distanceToTop = firstElement === null ? 0 : getElementDistanceToTopOfDocument(topBufferEl);
            DOM.addEventListener('scroll', scrollListener, false);
            this._calcDistanceToTopInterval = PLATFORM.global.setInterval(() => {
                const prevDistanceToTop = this.distanceToTop;
                const currDistanceToTop = getElementDistanceToTopOfDocument(topBufferEl);
                this.distanceToTop = currDistanceToTop;
                if (prevDistanceToTop !== currDistanceToTop) {
                    const currentScrollerInfo = this.getScrollerInfo();
                    const prevScrollerInfo = this._currScrollerInfo;
                    this._currScrollerInfo = currentScrollerInfo;
                    this._handleScroll(currentScrollerInfo, prevScrollerInfo);
                }
            }, 500);
        }
        this.strategy.onAttached(this);
    }
    call(context, changes) {
        this[context](this.items, changes);
    }
    detached() {
        const scrollCt = this.scrollerEl;
        const scrollListener = this._onScroll;
        if (hasOverflowScroll(scrollCt)) {
            scrollCt.removeEventListener('scroll', scrollListener);
        }
        else {
            DOM.removeEventListener('scroll', scrollListener, false);
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
        const $clearInterval = PLATFORM.global.clearInterval;
        $clearInterval(this._calcDistanceToTopInterval);
        $clearInterval(this._sizeInterval);
        this.distanceToTop
            = this._sizeInterval
                = this._calcDistanceToTopInterval = 0;
    }
    unbind() {
        this.scope = null;
        this.items = null;
    }
    itemsChanged() {
        this._unsubscribeCollection();
        if (!this.scope || !this._isAttached) {
            return;
        }
        const items = this.items;
        const strategy = this.strategy = this.strategyLocator.getStrategy(items);
        if (strategy === null) {
            throw new Error('Value is not iterateable for virtual repeat.');
        }
        if (!this.isOneTime && !this._observeInnerCollection()) {
            this._observeCollection();
        }
        const calculationSignals = strategy.initCalculation(this, items);
        strategy.instanceChanged(this, items, this.$first);
        if (calculationSignals & 1) {
            this.resetCalculation();
        }
        if ((calculationSignals & 2) === 0) {
            const { setInterval: $setInterval, clearInterval: $clearInterval } = PLATFORM.global;
            $clearInterval(this._sizeInterval);
            this._sizeInterval = $setInterval(() => {
                if (this.items) {
                    const firstView = this.firstView() || this.strategy.createFirstRow(this);
                    const newCalcSize = calcOuterHeight(firstView.firstChild);
                    if (newCalcSize > 0) {
                        $clearInterval(this._sizeInterval);
                        this.itemsChanged();
                    }
                }
                else {
                    $clearInterval(this._sizeInterval);
                }
            }, 500);
        }
        if (calculationSignals & 4) {
            this.observeScroller(this.scrollerEl);
        }
    }
    handleCollectionMutated(collection, changes) {
        if (this._ignoreMutation) {
            return;
        }
        this._handlingMutations = true;
        this.strategy.instanceMutated(this, collection, changes);
    }
    handleInnerCollectionMutated(collection, changes) {
        if (this._ignoreMutation) {
            return;
        }
        this._ignoreMutation = true;
        const newItems = this.sourceExpression.evaluate(this.scope, this.lookupFunctions);
        this.taskQueue.queueMicroTask(() => this._ignoreMutation = false);
        if (newItems === this.items) {
            this.itemsChanged();
        }
        else {
            this.items = newItems;
        }
    }
    enableScroll() {
        this._ticking = false;
        this._handlingMutations = false;
        this._skipNextScrollHandle = false;
    }
    getScroller() {
        return this.scrollerEl;
    }
    getScrollerInfo() {
        const scroller = this.scrollerEl;
        return {
            scroller: scroller,
            scrollTop: scroller.scrollTop,
            height: scroller === htmlElement
                ? innerHeight
                : calcScrollHeight(scroller),
        };
    }
    resetCalculation() {
        this.$first
            = this.topBufferHeight
                = this.bottomBufferHeight
                    = this.itemHeight
                        = this.minViewsRequired = 0;
        this._ignoreMutation
            = this._handlingMutations
                = this._ticking = false;
        this.updateBufferElements(true);
    }
    _onScroll() {
        const isHandlingMutations = this._handlingMutations;
        if (!this._ticking && !isHandlingMutations) {
            const prevScrollerInfo = this._currScrollerInfo;
            const currentScrollerInfo = this.getScrollerInfo();
            this._currScrollerInfo = currentScrollerInfo;
            this.taskQueue.queueMicroTask(() => {
                this._ticking = false;
                this._handleScroll(currentScrollerInfo, prevScrollerInfo);
            });
            this._ticking = true;
        }
        if (isHandlingMutations) {
            this._handlingMutations = false;
        }
    }
    _handleScroll(current_scroller_info, prev_scroller_info) {
        if (!this._isAttached) {
            return;
        }
        if (this._skipNextScrollHandle) {
            this._skipNextScrollHandle = false;
            return;
        }
        const items = this.items;
        if (!items) {
            return;
        }
        const strategy = this.strategy;
        const old_range_start_index = this.$first;
        const old_range_end_index = this.lastViewIndex();
        const { 0: new_range_start_index, 1: new_range_end_index } = strategy.getViewRange(this, current_scroller_info);
        let scrolling_state = new_range_start_index > old_range_start_index
            ? 1
            : new_range_start_index < old_range_start_index
                ? 2
                : 0;
        let didMovedViews = 0;
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
                const views_to_move_count = new_range_start_index - old_range_start_index;
                this._moveViews(views_to_move_count, 1);
                didMovedViews = 1;
                if (strategy.isNearBottom(this, new_range_end_index)) {
                    scrolling_state |= 8;
                }
            }
            else if (old_range_start_index > new_range_start_index
                && old_range_start_index <= new_range_end_index
                && old_range_end_index >= new_range_end_index) {
                const views_to_move_count = old_range_end_index - new_range_end_index;
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
                    console.log(`[!] Scroll intersection not handled. With indices: `
                        + `new [${new_range_start_index}, ${new_range_end_index}] / old [${old_range_start_index}, ${old_range_end_index}]`);
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
            const scroll_top_delta = current_scroller_info.scrollTop - prev_scroller_info.scrollTop;
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
    }
    _moveViews(viewsCount, direction) {
        const repeat = this;
        if (direction === -1) {
            let startIndex = repeat.firstViewIndex();
            while (viewsCount--) {
                const view = repeat.lastView();
                rebindAndMoveView(repeat, view, --startIndex, false);
            }
        }
        else {
            let lastIndex = repeat.lastViewIndex();
            while (viewsCount--) {
                const view = repeat.view(0);
                rebindAndMoveView(repeat, view, ++lastIndex, true);
            }
        }
    }
    getMore(topIndex, isNearTop, isNearBottom, force) {
        if (isNearTop || isNearBottom || force) {
            if (!this._calledGetMore) {
                const executeGetMore = (time) => {
                    if (time - this._lastGetMore < 16) {
                        return;
                    }
                    this._lastGetMore = time;
                    this._calledGetMore = true;
                    const revertCalledGetMore = () => {
                        this._calledGetMore = false;
                    };
                    const firstView = this.firstView();
                    if (firstView === null) {
                        revertCalledGetMore();
                        return;
                    }
                    const firstViewElement = firstView.firstChild;
                    const scrollNextAttrName = 'infinite-scroll-next';
                    const func = firstViewElement
                        && firstViewElement.au
                        && firstViewElement.au[scrollNextAttrName]
                        ? firstViewElement.au[scrollNextAttrName].instruction.attributes[scrollNextAttrName]
                        : undefined;
                    if (func === undefined) {
                        revertCalledGetMore();
                    }
                    else {
                        const scrollContext = {
                            topIndex: topIndex,
                            isAtBottom: isNearBottom,
                            isAtTop: isNearTop,
                        };
                        const overrideContext = this.scope.overrideContext;
                        overrideContext.$scrollContext = scrollContext;
                        if (typeof func === 'string') {
                            const bindingContext = overrideContext.bindingContext;
                            const getMoreFuncName = firstView.firstChild.getAttribute(scrollNextAttrName);
                            const funcCall = bindingContext[getMoreFuncName];
                            if (typeof funcCall === 'function') {
                                revertCalledGetMore();
                                const result = funcCall.call(bindingContext, topIndex, isNearBottom, isNearTop);
                                if (result instanceof Promise) {
                                    this._calledGetMore = true;
                                    return result.then(() => {
                                        revertCalledGetMore();
                                    });
                                }
                            }
                            else {
                                throw new Error(`'${scrollNextAttrName}' must be a function or evaluate to one`);
                            }
                        }
                        else if (func.sourceExpression) {
                            revertCalledGetMore();
                            return func.sourceExpression.evaluate(this.scope);
                        }
                        else {
                            throw new Error(`'${scrollNextAttrName}' must be a function or evaluate to one`);
                        }
                    }
                };
                $raf(executeGetMore);
            }
        }
    }
    updateBufferElements(skipUpdate) {
        this.topBufferEl.style.height = `${this.topBufferHeight}px`;
        this.bottomBufferEl.style.height = `${this.bottomBufferHeight}px`;
        if (skipUpdate) {
            this._ticking = true;
            $raf(this.revertScrollCheckGuard);
        }
    }
    _unsubscribeCollection() {
        const collectionObserver = this.collectionObserver;
        if (collectionObserver) {
            collectionObserver.unsubscribe(this.callContext, this);
            this.collectionObserver = this.callContext = null;
        }
    }
    firstView() {
        return this.view(0);
    }
    lastView() {
        return this.view(this.viewCount() - 1);
    }
    firstViewIndex() {
        const firstView = this.firstView();
        return firstView === null ? -1 : firstView.overrideContext.$index;
    }
    lastViewIndex() {
        const lastView = this.lastView();
        return lastView === null ? -1 : lastView.overrideContext.$index;
    }
    observeScroller(scrollerEl) {
        const sizeChangeHandler = (newRect) => {
            $raf(() => {
                if (newRect === this._currScrollerContentRect) {
                    this.itemsChanged();
                }
            });
        };
        const ResizeObserverConstructor = getResizeObserverClass();
        if (typeof ResizeObserverConstructor === 'function') {
            let observer = this._scrollerResizeObserver;
            if (observer) {
                observer.disconnect();
            }
            observer = this._scrollerResizeObserver = new ResizeObserverConstructor((entries) => {
                const oldRect = this._currScrollerContentRect;
                const newRect = entries[0].contentRect;
                this._currScrollerContentRect = newRect;
                if (oldRect === undefined || newRect.height !== oldRect.height || newRect.width !== oldRect.width) {
                    sizeChangeHandler(newRect);
                }
            });
            observer.observe(scrollerEl);
        }
        let elEvents = this._scrollerEvents;
        if (elEvents) {
            elEvents.disposeAll();
        }
        const sizeChangeEventsHandler = () => {
            $raf(() => {
                this.itemsChanged();
            });
        };
        elEvents = this._scrollerEvents = new ElementEvents(scrollerEl);
        elEvents.subscribe(VirtualizationEvents.scrollerSizeChange, sizeChangeEventsHandler, false);
        elEvents.subscribe(VirtualizationEvents.itemSizeChange, sizeChangeEventsHandler, false);
    }
    unobserveScroller() {
        const observer = this._scrollerResizeObserver;
        if (observer) {
            observer.disconnect();
        }
        const scrollerEvents = this._scrollerEvents;
        if (scrollerEvents) {
            scrollerEvents.disposeAll();
        }
        this._scrollerResizeObserver
            = this._scrollerEvents = undefined;
    }
    _observeInnerCollection() {
        const items = this._getInnerCollection();
        const strategy = this.strategyLocator.getStrategy(items);
        if (!strategy) {
            return false;
        }
        const collectionObserver = strategy.getCollectionObserver(this.observerLocator, items);
        if (!collectionObserver) {
            return false;
        }
        const context = "handleInnerCollectionMutated";
        this.collectionObserver = collectionObserver;
        this.callContext = context;
        collectionObserver.subscribe(context, this);
        return true;
    }
    _getInnerCollection() {
        const expression = unwrapExpression(this.sourceExpression);
        if (!expression) {
            return null;
        }
        return expression.evaluate(this.scope, null);
    }
    _observeCollection() {
        const collectionObserver = this.strategy.getCollectionObserver(this.observerLocator, this.items);
        if (collectionObserver) {
            this.callContext = "handleCollectionMutated";
            this.collectionObserver = collectionObserver;
            collectionObserver.subscribe(this.callContext, this);
        }
    }
    viewCount() {
        return this.viewSlot.children.length;
    }
    views() {
        return this.viewSlot.children;
    }
    view(index) {
        const viewSlot = this.viewSlot;
        return index < 0 || index > viewSlot.children.length - 1 ? null : viewSlot.children[index];
    }
    addView(bindingContext, overrideContext) {
        const view = this.viewFactory.create();
        view.bind(bindingContext, overrideContext);
        this.viewSlot.add(view);
        return view;
    }
    insertView(index, bindingContext, overrideContext) {
        const view = this.viewFactory.create();
        view.bind(bindingContext, overrideContext);
        this.viewSlot.insert(index, view);
    }
    removeAllViews(returnToCache, skipAnimation) {
        return this.viewSlot.removeAll(returnToCache, skipAnimation);
    }
    removeView(index, returnToCache, skipAnimation) {
        return this.viewSlot.removeAt(index, returnToCache, skipAnimation);
    }
    updateBindings(view) {
        const bindings = view.bindings;
        let j = bindings.length;
        while (j--) {
            updateOneTimeBinding(bindings[j]);
        }
        const controllers = view.controllers;
        j = controllers.length;
        while (j--) {
            const boundProperties = controllers[j].boundProperties;
            let k = boundProperties.length;
            while (k--) {
                let binding = boundProperties[k].binding;
                updateOneTimeBinding(binding);
            }
        }
    }
}

class InfiniteScrollNext {
    static $resource() {
        return {
            type: 'attribute',
            name: 'infinite-scroll-next',
        };
    }
}

function configure(config) {
    config.globalResources(VirtualRepeat, InfiniteScrollNext);
}

export { configure, VirtualRepeat, InfiniteScrollNext, VirtualizationEvents };
