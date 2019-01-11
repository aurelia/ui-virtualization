import { mergeSplice, ObserverLocator } from 'aurelia-binding';
import { BoundViewFactory, TargetInstruction, ViewSlot, ViewResources } from 'aurelia-templating';
import { updateOverrideContext, ArrayRepeatStrategy, createFullOverrideContext, NullRepeatStrategy, RepeatStrategyLocator, AbstractRepeater, viewsRequireLifecycle, getItemsSourceExpression, isOneTime, unwrapExpression, updateOneTimeBinding } from 'aurelia-templating-resources';
import { DOM } from 'aurelia-pal';
import { Container } from 'aurelia-dependency-injection';

function calcOuterHeight(element) {
    let height;
    height = element.getBoundingClientRect().height;
    height += getStyleValue(element, 'marginTop');
    height += getStyleValue(element, 'marginBottom');
    return height;
}
function insertBeforeNode(view, bottomBuffer) {
    let parentElement = bottomBuffer.parentElement || bottomBuffer.parentNode;
    parentElement.insertBefore(view.lastChild, bottomBuffer);
}
function updateVirtualOverrideContexts(repeat, startIndex) {
    let views = repeat.viewSlot.children;
    let viewLength = views.length;
    let collectionLength = repeat.items.length;
    if (startIndex > 0) {
        startIndex = startIndex - 1;
    }
    let delta = repeat._topBufferHeight / repeat.itemHeight;
    for (; startIndex < viewLength; ++startIndex) {
        updateOverrideContext(views[startIndex].overrideContext, startIndex + delta, collectionLength);
    }
}
function rebindAndMoveView(repeat, view, index, moveToBottom) {
    let items = repeat.items;
    let viewSlot = repeat.viewSlot;
    updateOverrideContext(view.overrideContext, index, items.length);
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
function getStyleValue(element, style) {
    let currentStyle;
    let styleValue;
    currentStyle = element['currentStyle'] || window.getComputedStyle(element);
    styleValue = parseInt(currentStyle[style], 10);
    return Number.isNaN(styleValue) ? 0 : styleValue;
}
function getElementDistanceToBottomViewPort(element) {
    return document.documentElement.clientHeight - element.getBoundingClientRect().bottom;
}

class DomHelper {
    getElementDistanceToTopOfDocument(element) {
        let box = element.getBoundingClientRect();
        let documentElement = document.documentElement;
        let scrollTop = window.pageYOffset;
        let clientTop = documentElement.clientTop;
        let top = box.top + scrollTop - clientTop;
        return Math.round(top);
    }
    hasOverflowScroll(element) {
        let style = element.style;
        return style.overflowY === 'scroll' || style.overflow === 'scroll' || style.overflowY === 'auto' || style.overflow === 'auto';
    }
}

class ArrayVirtualRepeatStrategy extends ArrayRepeatStrategy {
    createFirstItem(repeat) {
        let overrideContext = createFullOverrideContext(repeat, repeat.items[0], 0, 1);
        repeat.addView(overrideContext.bindingContext, overrideContext);
    }
    instanceChanged(repeat, items, ...rest) {
        this._inPlaceProcessItems(repeat, items, rest[0]);
    }
    _standardProcessInstanceChanged(repeat, items) {
        for (let i = 1, ii = repeat._viewsLength; i < ii; ++i) {
            let overrideContext = createFullOverrideContext(repeat, items[i], i, ii);
            repeat.addView(overrideContext.bindingContext, overrideContext);
        }
    }
    _inPlaceProcessItems(repeat, items, first) {
        let itemsLength = items.length;
        let viewsLength = repeat.viewCount();
        while (viewsLength > itemsLength) {
            viewsLength--;
            repeat.removeView(viewsLength, true);
        }
        let local = repeat.local;
        for (let i = 0; i < viewsLength; i++) {
            let view = repeat.view(i);
            let last = i === itemsLength - 1;
            let middle = i !== 0 && !last;
            if (view.bindingContext[local] === items[i + first] && view.overrideContext.$middle === middle && view.overrideContext.$last === last) {
                continue;
            }
            view.bindingContext[local] = items[i + first];
            view.overrideContext.$middle = middle;
            view.overrideContext.$last = last;
            view.overrideContext.$index = i + first;
            repeat.updateBindings(view);
        }
        let minLength = Math.min(repeat._viewsLength, itemsLength);
        for (let i = viewsLength; i < minLength; i++) {
            let overrideContext = createFullOverrideContext(repeat, items[i], i, itemsLength);
            repeat.addView(overrideContext.bindingContext, overrideContext);
        }
    }
    instanceMutated(repeat, array, splices) {
        this._standardProcessInstanceMutated(repeat, array, splices);
    }
    _standardProcessInstanceMutated(repeat, array, splices) {
        if (repeat.__queuedSplices) {
            for (let i = 0, ii = splices.length; i < ii; ++i) {
                let { index, removed, addedCount } = splices[i];
                mergeSplice(repeat.__queuedSplices, index, removed, addedCount);
            }
            repeat.__array = array.slice(0);
            return;
        }
        let maybePromise = this._runSplices(repeat, array.slice(0), splices);
        if (maybePromise instanceof Promise) {
            let queuedSplices = repeat.__queuedSplices = [];
            let runQueuedSplices = () => {
                if (!queuedSplices.length) {
                    delete repeat.__queuedSplices;
                    delete repeat.__array;
                    return;
                }
                let nextPromise = this._runSplices(repeat, repeat.__array, queuedSplices) || Promise.resolve();
                nextPromise.then(runQueuedSplices);
            };
            maybePromise.then(runQueuedSplices);
        }
    }
    _runSplices(repeat, array, splices) {
        let removeDelta = 0;
        let rmPromises = [];
        let allSplicesAreInplace = true;
        for (let i = 0; i < splices.length; i++) {
            let splice = splices[i];
            if (splice.removed.length !== splice.addedCount) {
                allSplicesAreInplace = false;
                break;
            }
        }
        if (allSplicesAreInplace) {
            for (let i = 0; i < splices.length; i++) {
                let splice = splices[i];
                for (let collectionIndex = splice.index; collectionIndex < splice.index + splice.addedCount; collectionIndex++) {
                    if (!this._isIndexBeforeViewSlot(repeat, repeat.viewSlot, collectionIndex) && !this._isIndexAfterViewSlot(repeat, repeat.viewSlot, collectionIndex)) {
                        let viewIndex = this._getViewIndex(repeat, repeat.viewSlot, collectionIndex);
                        let overrideContext = createFullOverrideContext(repeat, array[collectionIndex], collectionIndex, array.length);
                        repeat.removeView(viewIndex, true, true);
                        repeat.insertView(viewIndex, overrideContext.bindingContext, overrideContext);
                    }
                }
            }
        }
        else {
            for (let i = 0, ii = splices.length; i < ii; ++i) {
                let splice = splices[i];
                let removed = splice.removed;
                let removedLength = removed.length;
                for (let j = 0, jj = removedLength; j < jj; ++j) {
                    let viewOrPromise = this._removeViewAt(repeat, splice.index + removeDelta + rmPromises.length, true, j, removedLength);
                    if (viewOrPromise instanceof Promise) {
                        rmPromises.push(viewOrPromise);
                    }
                }
                removeDelta -= splice.addedCount;
            }
            if (rmPromises.length > 0) {
                return Promise.all(rmPromises).then(() => {
                    this._handleAddedSplices(repeat, array, splices);
                    updateVirtualOverrideContexts(repeat, 0);
                });
            }
            this._handleAddedSplices(repeat, array, splices);
            updateVirtualOverrideContexts(repeat, 0);
        }
        return undefined;
    }
    _removeViewAt(repeat, collectionIndex, returnToCache, j, removedLength) {
        let viewOrPromise;
        let view;
        let viewSlot = repeat.viewSlot;
        let viewCount = repeat.viewCount();
        let viewAddIndex;
        let removeMoreThanInDom = removedLength > viewCount;
        if (repeat._viewsLength <= j) {
            repeat._bottomBufferHeight = repeat._bottomBufferHeight - (repeat.itemHeight);
            repeat._adjustBufferHeights();
            return;
        }
        if (!this._isIndexBeforeViewSlot(repeat, viewSlot, collectionIndex) && !this._isIndexAfterViewSlot(repeat, viewSlot, collectionIndex)) {
            let viewIndex = this._getViewIndex(repeat, viewSlot, collectionIndex);
            viewOrPromise = repeat.removeView(viewIndex, returnToCache);
            if (repeat.items.length > viewCount) {
                let collectionAddIndex;
                if (repeat._bottomBufferHeight > repeat.itemHeight) {
                    viewAddIndex = viewCount;
                    if (!removeMoreThanInDom) {
                        let lastViewItem = repeat._getLastViewItem();
                        collectionAddIndex = repeat.items.indexOf(lastViewItem) + 1;
                    }
                    else {
                        collectionAddIndex = j;
                    }
                    repeat._bottomBufferHeight = repeat._bottomBufferHeight - (repeat.itemHeight);
                }
                else if (repeat._topBufferHeight > 0) {
                    viewAddIndex = 0;
                    collectionAddIndex = repeat._getIndexOfFirstView() - 1;
                    repeat._topBufferHeight = repeat._topBufferHeight - (repeat.itemHeight);
                }
                let data = repeat.items[collectionAddIndex];
                if (data) {
                    let overrideContext = createFullOverrideContext(repeat, data, collectionAddIndex, repeat.items.length);
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
            viewOrPromise.then(() => {
                repeat.viewSlot.insert(viewAddIndex, view);
                repeat._adjustBufferHeights();
            });
        }
        else if (view) {
            repeat.viewSlot.insert(viewAddIndex, view);
        }
        repeat._adjustBufferHeights();
    }
    _isIndexBeforeViewSlot(repeat, viewSlot, index) {
        let viewIndex = this._getViewIndex(repeat, viewSlot, index);
        return viewIndex < 0;
    }
    _isIndexAfterViewSlot(repeat, viewSlot, index) {
        let viewIndex = this._getViewIndex(repeat, viewSlot, index);
        return viewIndex > repeat._viewsLength - 1;
    }
    _getViewIndex(repeat, viewSlot, index) {
        if (repeat.viewCount() === 0) {
            return -1;
        }
        let topBufferItems = repeat._topBufferHeight / repeat.itemHeight;
        return index - topBufferItems;
    }
    _handleAddedSplices(repeat, array, splices) {
        let arrayLength = array.length;
        let viewSlot = repeat.viewSlot;
        for (let i = 0, ii = splices.length; i < ii; ++i) {
            let splice = splices[i];
            let addIndex = splice.index;
            let end = splice.index + splice.addedCount;
            for (; addIndex < end; ++addIndex) {
                let hasDistanceToBottomViewPort = getElementDistanceToBottomViewPort(repeat.templateStrategy.getLastElement(repeat.bottomBuffer)) > 0;
                if (repeat.viewCount() === 0 || (!this._isIndexBeforeViewSlot(repeat, viewSlot, addIndex) && !this._isIndexAfterViewSlot(repeat, viewSlot, addIndex)) || hasDistanceToBottomViewPort) {
                    let overrideContext = createFullOverrideContext(repeat, array[addIndex], addIndex, arrayLength);
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
    }
}

class NullVirtualRepeatStrategy extends NullRepeatStrategy {
    instanceMutated() {
    }
    instanceChanged(repeat) {
        super.instanceChanged(repeat);
        repeat._resetCalculation();
    }
}

class VirtualRepeatStrategyLocator extends RepeatStrategyLocator {
    constructor() {
        super();
        this.matchers = [];
        this.strategies = [];
        this.addStrategy(items => items === null || items === undefined, new NullVirtualRepeatStrategy());
        this.addStrategy(items => items instanceof Array, new ArrayVirtualRepeatStrategy());
    }
}

class TemplateStrategyLocator {
    constructor(container) {
        this.container = container;
    }
    getStrategy(element) {
        if (element.parentNode && element.parentNode.tagName === 'TBODY') {
            return this.container.get(TableStrategy);
        }
        return this.container.get(DefaultTemplateStrategy);
    }
}
TemplateStrategyLocator.inject = [Container];
class TableStrategy {
    constructor(domHelper) {
        this.tableCssReset = '\
    display: block;\
    width: auto;\
    height: auto;\
    margin: 0;\
    padding: 0;\
    border: none;\
    border-collapse: inherit;\
    border-spacing: 0;\
    background-color: transparent;\
    -webkit-border-horizontal-spacing: 0;\
    -webkit-border-vertical-spacing: 0;';
        this.domHelper = domHelper;
    }
    getScrollContainer(element) {
        return element.parentNode;
    }
    moveViewFirst(view, topBuffer) {
        const tbody = this._getTbodyElement(topBuffer.nextSibling);
        const tr = tbody.firstChild;
        const firstElement = DOM.nextElementSibling(tr);
        insertBeforeNode(view, firstElement);
    }
    moveViewLast(view, bottomBuffer) {
        const lastElement = this.getLastElement(bottomBuffer).nextSibling;
        const referenceNode = lastElement.nodeType === 8 && lastElement.data === 'anchor' ? lastElement : lastElement;
        insertBeforeNode(view, referenceNode);
    }
    createTopBufferElement(element) {
        const elementName = /^[UO]L$/.test(element.parentNode.tagName) ? 'li' : 'div';
        const buffer = DOM.createElement(elementName);
        const tableElement = element.parentNode.parentNode;
        tableElement.parentNode.insertBefore(buffer, tableElement);
        buffer.innerHTML = '&nbsp;';
        return buffer;
    }
    createBottomBufferElement(element) {
        const elementName = /^[UO]L$/.test(element.parentNode.tagName) ? 'li' : 'div';
        const buffer = DOM.createElement(elementName);
        const tableElement = element.parentNode.parentNode;
        tableElement.parentNode.insertBefore(buffer, tableElement.nextSibling);
        return buffer;
    }
    removeBufferElements(element, topBuffer, bottomBuffer) {
        topBuffer.parentNode.removeChild(topBuffer);
        bottomBuffer.parentNode.removeChild(bottomBuffer);
    }
    getFirstElement(topBuffer) {
        const tbody = this._getTbodyElement(DOM.nextElementSibling(topBuffer));
        const tr = tbody.firstChild;
        return tr;
    }
    getLastElement(bottomBuffer) {
        const tbody = this._getTbodyElement(bottomBuffer.previousSibling);
        const trs = tbody.children;
        return trs[trs.length - 1];
    }
    getTopBufferDistance(topBuffer) {
        const tbody = this._getTbodyElement(topBuffer.nextSibling);
        return this.domHelper.getElementDistanceToTopOfDocument(tbody) - this.domHelper.getElementDistanceToTopOfDocument(topBuffer);
    }
    getLastView(bottomBuffer) {
        throw new Error('Method getLastView() not implemented.');
    }
    _getTbodyElement(tableElement) {
        let tbodyElement;
        const children = tableElement.children;
        for (let i = 0, ii = children.length; i < ii; ++i) {
            if (children[i].localName === 'tbody') {
                tbodyElement = children[i];
                break;
            }
        }
        return tbodyElement;
    }
}
TableStrategy.inject = [DomHelper];
class DefaultTemplateStrategy {
    getLastView(bottomBuffer) {
        throw new Error("Method getLastView() not implemented.");
    }
    getScrollContainer(element) {
        return element.parentNode;
    }
    moveViewFirst(view, topBuffer) {
        insertBeforeNode(view, DOM.nextElementSibling(topBuffer));
    }
    moveViewLast(view, bottomBuffer) {
        const previousSibling = bottomBuffer.previousSibling;
        const referenceNode = previousSibling.nodeType === 8 && previousSibling.data === 'anchor' ? previousSibling : bottomBuffer;
        insertBeforeNode(view, referenceNode);
    }
    createTopBufferElement(element) {
        const elementName = /^[UO]L$/.test(element.parentNode.tagName) ? 'li' : 'div';
        const buffer = DOM.createElement(elementName);
        element.parentNode.insertBefore(buffer, element);
        return buffer;
    }
    createBottomBufferElement(element) {
        const elementName = /^[UO]L$/.test(element.parentNode.tagName) ? 'li' : 'div';
        const buffer = DOM.createElement(elementName);
        element.parentNode.insertBefore(buffer, element.nextSibling);
        return buffer;
    }
    removeBufferElements(element, topBuffer, bottomBuffer) {
        element.parentNode.removeChild(topBuffer);
        element.parentNode.removeChild(bottomBuffer);
    }
    getFirstElement(topBuffer) {
        return DOM.nextElementSibling(topBuffer);
    }
    getLastElement(bottomBuffer) {
        return bottomBuffer.previousElementSibling;
    }
    getTopBufferDistance(topBuffer) {
        return 0;
    }
}

class VirtualRepeat extends AbstractRepeater {
    constructor(element, viewFactory, instruction, viewSlot, viewResources, observerLocator, strategyLocator, templateStrategyLocator, domHelper) {
        super({
            local: 'item',
            viewsRequireLifecycle: viewsRequireLifecycle(viewFactory)
        });
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
        this._isAtTop = true;
        this._calledGetMore = false;
        this._skipNextScrollHandle = false;
        this._handlingMutations = false;
        this._isScrolling = false;
        this.element = element;
        this.viewFactory = viewFactory;
        this.instruction = instruction;
        this.viewSlot = viewSlot;
        this.lookupFunctions = viewResources['lookupFunctions'];
        this.observerLocator = observerLocator;
        this.strategyLocator = strategyLocator;
        this.templateStrategyLocator = templateStrategyLocator;
        this.sourceExpression = getItemsSourceExpression(this.instruction, 'virtual-repeat.for');
        this.isOneTime = isOneTime(this.sourceExpression);
        this.domHelper = domHelper;
    }
    static inject() {
        return [DOM.Element, BoundViewFactory, TargetInstruction, ViewSlot, ViewResources, ObserverLocator, VirtualRepeatStrategyLocator, TemplateStrategyLocator, DomHelper];
    }
    attached() {
        this._isAttached = true;
        let element = this.element;
        this._itemsLength = this.items.length;
        this.templateStrategy = this.templateStrategyLocator.getStrategy(element);
        this.scrollContainer = this.templateStrategy.getScrollContainer(element);
        this.topBuffer = this.templateStrategy.createTopBufferElement(element);
        this.bottomBuffer = this.templateStrategy.createBottomBufferElement(element);
        this.itemsChanged();
        this.scrollListener = () => this._onScroll();
        this.calcDistanceToTopInterval = setInterval(() => {
            let distanceToTop = this.distanceToTop;
            this.distanceToTop = this.domHelper.getElementDistanceToTopOfDocument(this.topBuffer);
            this.distanceToTop += this.topBufferDistance;
            if (distanceToTop !== this.distanceToTop) {
                this._handleScroll();
            }
        }, 500);
        this.distanceToTop = this.domHelper.getElementDistanceToTopOfDocument(this.templateStrategy.getFirstElement(this.topBuffer));
        this.topBufferDistance = this.templateStrategy.getTopBufferDistance(this.topBuffer);
        if (this.domHelper.hasOverflowScroll(this.scrollContainer)) {
            this._fixedHeightContainer = true;
            this.scrollContainer.addEventListener('scroll', this.scrollListener);
        }
        else {
            document.addEventListener('scroll', this.scrollListener);
        }
    }
    bind(bindingContext, overrideContext) {
        this.scope = { bindingContext, overrideContext };
        if (this._isAttached) {
            this.itemsChanged();
        }
    }
    call(context, changes) {
        this[context](this.items, changes);
    }
    detached() {
        this.scrollContainer.removeEventListener('scroll', this.scrollListener);
        this._resetCalculation();
        this._isAttached = false;
        this.templateStrategy.removeBufferElements(this.element, this.topBuffer, this.bottomBuffer);
        this.scrollContainer = null;
        this.scrollContainerHeight = null;
        this.distanceToTop = null;
        this.removeAllViews(true, false);
        if (this.scrollHandler) {
            this.scrollHandler.dispose();
        }
        this._unsubscribeCollection();
        clearInterval(this.calcDistanceToTopInterval);
        if (this._sizeInterval) {
            clearInterval(this._sizeInterval);
        }
    }
    itemsChanged() {
        this._unsubscribeCollection();
        if (!this.scope || !this._isAttached) {
            return;
        }
        let reducingItems = false;
        let previousLastViewIndex = this._getIndexOfLastView();
        let items = this.items;
        let shouldCalculateSize = !!items;
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
                    let realScrollContainer = this.scrollContainer.parentNode.parentNode;
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
    }
    unbind() {
        this.scope = null;
        this.items = null;
        this._itemsLength = null;
    }
    handleCollectionMutated(collection, changes) {
        this._handlingMutations = true;
        this._itemsLength = collection.length;
        this.strategy.instanceMutated(this, collection, changes);
    }
    handleInnerCollectionMutated(collection, changes) {
        if (this.ignoreMutation) {
            return;
        }
        this.ignoreMutation = true;
        let newItems = this.sourceExpression.evaluate(this.scope, this.lookupFunctions);
        this.observerLocator.taskQueue.queueMicroTask(() => this.ignoreMutation = false);
        if (newItems === this.items) {
            this.itemsChanged();
        }
        else {
            this.items = newItems;
        }
    }
    _resetCalculation() {
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
    }
    _onScroll() {
        if (!this._ticking && !this._handlingMutations) {
            requestAnimationFrame(() => this._handleScroll());
            this._ticking = true;
        }
        if (this._handlingMutations) {
            this._handlingMutations = false;
        }
    }
    _handleScroll() {
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
        let itemHeight = this.itemHeight;
        let scrollTop = this._fixedHeightContainer ? this.scrollContainer.scrollTop : pageYOffset - this.distanceToTop;
        this._first = Math.floor(scrollTop / itemHeight);
        this._first = this._first < 0 ? 0 : this._first;
        if (this._first > this.items.length - this.elementsInView) {
            this._first = this.items.length - this.elementsInView;
            this._first = this._first < 0 ? 0 : this._first;
        }
        this._checkScrolling();
        if (this._scrollingDown) {
            let viewsToMove = this._first - this._lastRebind;
            if (this._switchedDirection) {
                viewsToMove = this._isAtTop ? this._first : this._bufferSize - (this._lastRebind - this._first);
            }
            this._isAtTop = false;
            this._lastRebind = this._first;
            let movedViewsCount = this._moveViews(viewsToMove);
            let adjustHeight = movedViewsCount < viewsToMove ? this._bottomBufferHeight : itemHeight * movedViewsCount;
            if (viewsToMove > 0) {
                this._getMore();
            }
            this._switchedDirection = false;
            this._topBufferHeight = this._topBufferHeight + adjustHeight;
            this._bottomBufferHeight = this._bottomBufferHeight - adjustHeight;
            if (this._bottomBufferHeight >= 0) {
                this._adjustBufferHeights();
            }
        }
        else if (this._scrollingUp) {
            let viewsToMove = this._lastRebind - this._first;
            let initialScrollState = this.isLastIndex === undefined;
            if (this._switchedDirection) {
                if (this.isLastIndex) {
                    viewsToMove = this.items.length - this._first - this.elementsInView;
                }
                else {
                    viewsToMove = this._bufferSize - (this._first - this._lastRebind);
                }
            }
            this.isLastIndex = false;
            this._lastRebind = this._first;
            let movedViewsCount = this._moveViews(viewsToMove);
            this.movedViewsCount = movedViewsCount;
            let adjustHeight = movedViewsCount < viewsToMove ? this._topBufferHeight : itemHeight * movedViewsCount;
            if (viewsToMove > 0) {
                let force = this.movedViewsCount === 0 && initialScrollState && this._first <= 0 ? true : false;
                this._getMore(force);
            }
            this._switchedDirection = false;
            this._topBufferHeight = this._topBufferHeight - adjustHeight;
            this._bottomBufferHeight = this._bottomBufferHeight + adjustHeight;
            if (this._topBufferHeight >= 0) {
                this._adjustBufferHeights();
            }
        }
        this._previousFirst = this._first;
        this._ticking = false;
    }
    _getMore(force) {
        if (this.isLastIndex || this._first === 0 || force) {
            if (!this._calledGetMore) {
                let executeGetMore = () => {
                    this._calledGetMore = true;
                    let func = (this.view(0) && this.view(0).firstChild && this.view(0).firstChild.au && this.view(0).firstChild.au['infinite-scroll-next']) ? this.view(0).firstChild.au['infinite-scroll-next'].instruction.attributes['infinite-scroll-next'] : undefined;
                    let topIndex = this._first;
                    let isAtBottom = this._bottomBufferHeight === 0;
                    let isAtTop = this._isAtTop;
                    let scrollContext = {
                        topIndex: topIndex,
                        isAtBottom: isAtBottom,
                        isAtTop: isAtTop
                    };
                    this.scope.overrideContext.$scrollContext = scrollContext;
                    if (func === undefined) {
                        return null;
                    }
                    else if (typeof func === 'string') {
                        let getMoreFuncName = this.view(0).firstChild.getAttribute('infinite-scroll-next');
                        let funcCall = this.scope.overrideContext.bindingContext[getMoreFuncName];
                        if (typeof funcCall === 'function') {
                            let result = funcCall.call(this.scope.overrideContext.bindingContext, topIndex, isAtBottom, isAtTop);
                            if (!(result instanceof Promise)) {
                                this._calledGetMore = false;
                            }
                            else {
                                return result.then(() => {
                                    this._calledGetMore = false;
                                });
                            }
                        }
                        else {
                            throw new Error("'infinite-scroll-next' must be a function or evaluate to one");
                        }
                    }
                    else if (func.sourceExpression) {
                        this._calledGetMore = false;
                        return func.sourceExpression.evaluate(this.scope);
                    }
                    else {
                        throw new Error("'infinite-scroll-next' must be a function or evaluate to one");
                    }
                    return null;
                };
                this.observerLocator.taskQueue.queueMicroTask(executeGetMore);
            }
        }
    }
    _checkScrolling() {
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
    }
    _checkFixedHeightContainer() {
        if (this.domHelper.hasOverflowScroll(this.scrollContainer)) {
            this._fixedHeightContainer = true;
        }
    }
    _adjustBufferHeights() {
        this.topBuffer.style.height = `${this._topBufferHeight}px`;
        this.bottomBuffer.style.height = `${this._bottomBufferHeight}px`;
    }
    _unsubscribeCollection() {
        if (this.collectionObserver) {
            this.collectionObserver.unsubscribe(this.callContext, this);
            this.collectionObserver = null;
            this.callContext = null;
        }
    }
    _moveViews(length) {
        let getNextIndex = this._scrollingDown ? (index, i) => index + i : (index, i) => index - i;
        let isAtFirstOrLastIndex = () => this._scrollingDown ? this.isLastIndex : this._isAtTop;
        let childrenLength = this.viewCount();
        let viewIndex = this._scrollingDown ? 0 : childrenLength - 1;
        let items = this.items;
        let index = this._scrollingDown ? this._getIndexOfLastView() + 1 : this._getIndexOfFirstView() - 1;
        let i = 0;
        let viewToMoveLimit = length - (childrenLength * 2);
        while (i < length && !isAtFirstOrLastIndex()) {
            let view = this.view(viewIndex);
            let nextIndex = getNextIndex(index, i);
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
    }
    _getIndexOfLastView() {
        const view = this.view(this.viewCount() - 1);
        if (view) {
            return view.overrideContext.$index;
        }
        return -1;
    }
    _getLastViewItem() {
        let children = this.viewSlot.children;
        if (!children.length) {
            return undefined;
        }
        let lastViewItem = children[children.length - 1].bindingContext[this.local];
        return lastViewItem;
    }
    _getIndexOfFirstView() {
        return this.view(0) ? this.view(0).overrideContext.$index : -1;
    }
    _calcInitialHeights(itemsLength) {
        const isSameLength = this._viewsLength > 0 && this._itemsLength === itemsLength;
        if (isSameLength) {
            return;
        }
        if (itemsLength < 1) {
            this._resetCalculation();
            return;
        }
        this._hasCalculatedSizes = true;
        let firstViewElement = this.view(0).lastChild;
        this.itemHeight = calcOuterHeight(firstViewElement);
        if (this.itemHeight <= 0) {
            this._sizeInterval = setInterval(() => {
                let newCalcSize = calcOuterHeight(firstViewElement);
                if (newCalcSize > 0) {
                    clearInterval(this._sizeInterval);
                    this.itemsChanged();
                }
            }, 500);
            return;
        }
        this._itemsLength = itemsLength;
        this.scrollContainerHeight = this._fixedHeightContainer ? this._calcScrollHeight(this.scrollContainer) : document.documentElement.clientHeight;
        this.elementsInView = Math.ceil(this.scrollContainerHeight / this.itemHeight) + 1;
        this._viewsLength = (this.elementsInView * 2) + this._bufferSize;
        let newBottomBufferHeight = this.itemHeight * itemsLength - this.itemHeight * this._viewsLength;
        if (newBottomBufferHeight < 0) {
            newBottomBufferHeight = 0;
        }
        if (this._topBufferHeight >= newBottomBufferHeight) {
            this._topBufferHeight = newBottomBufferHeight;
            this._bottomBufferHeight = 0;
            this._first = this._itemsLength - this._viewsLength;
            if (this._first < 0) {
                this._first = 0;
            }
        }
        else {
            this._first = this._getIndexOfFirstView();
            let adjustedTopBufferHeight = this._first * this.itemHeight;
            this._topBufferHeight = adjustedTopBufferHeight;
            this._bottomBufferHeight = newBottomBufferHeight - adjustedTopBufferHeight;
            if (this._bottomBufferHeight < 0) {
                this._bottomBufferHeight = 0;
            }
        }
        this._adjustBufferHeights();
        return;
    }
    _calcScrollHeight(element) {
        let height;
        height = element.getBoundingClientRect().height;
        height -= getStyleValue(element, 'borderTopWidth');
        height -= getStyleValue(element, 'borderBottomWidth');
        return height;
    }
    _observeInnerCollection() {
        let items = this._getInnerCollection();
        let strategy = this.strategyLocator.getStrategy(items);
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
    }
    _getInnerCollection() {
        let expression = unwrapExpression(this.sourceExpression);
        if (!expression) {
            return null;
        }
        return expression.evaluate(this.scope, null);
    }
    _observeCollection() {
        let items = this.items;
        this.collectionObserver = this.strategy.getCollectionObserver(this.observerLocator, items);
        if (this.collectionObserver) {
            this.callContext = 'handleCollectionMutated';
            this.collectionObserver.subscribe(this.callContext, this);
        }
    }
    viewCount() { return this.viewSlot.children.length; }
    views() { return this.viewSlot.children; }
    view(index) { return this.viewSlot.children[index]; }
    addView(bindingContext, overrideContext) {
        let view = this.viewFactory.create();
        view.bind(bindingContext, overrideContext);
        this.viewSlot.add(view);
    }
    insertView(index, bindingContext, overrideContext) {
        let view = this.viewFactory.create();
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
        let j = view.bindings.length;
        while (j--) {
            updateOneTimeBinding(view.bindings[j]);
        }
        j = view.controllers.length;
        while (j--) {
            let k = view.controllers[j].boundProperties.length;
            while (k--) {
                let binding = view.controllers[j].boundProperties[k].binding;
                updateOneTimeBinding(binding);
            }
        }
    }
}
VirtualRepeat.$resource = {
    type: 'attribute',
    name: 'virtual-repeat',
    templateController: true,
    bindables: ['items', 'local']
};

class InfiniteScrollNext {
    bind(bindingContext, overrideContext) {
        this.scope = { bindingContext, overrideContext };
    }
    unbind() {
        this.scope = undefined;
    }
}
InfiniteScrollNext.$resource = {
    type: 'attribute',
    name: 'infinite-scroll-next'
};

function configure(config) {
    config.globalResources(VirtualRepeat, InfiniteScrollNext);
}

export { configure, VirtualRepeat, InfiniteScrollNext };
