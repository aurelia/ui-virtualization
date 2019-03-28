(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('aurelia-binding'), require('aurelia-templating'), require('aurelia-templating-resources'), require('aurelia-pal'), require('aurelia-dependency-injection')) :
  typeof define === 'function' && define.amd ? define(['exports', 'aurelia-binding', 'aurelia-templating', 'aurelia-templating-resources', 'aurelia-pal', 'aurelia-dependency-injection'], factory) :
  (global = global || self, factory((global.au = global.au || {}, global.au.uiVirtualization = {}), global.au, global.au, global.au, global.au, global.au));
}(this, function (exports, aureliaBinding, aureliaTemplating, aureliaTemplatingResources, aureliaPal, aureliaDependencyInjection) { 'use strict';

  const updateAllViews = (repeat, startIndex) => {
      const views = repeat.viewSlot.children;
      const viewLength = views.length;
      const collection = repeat.items;
      const delta = Math$floor(repeat._topBufferHeight / repeat.itemHeight);
      let collectionIndex = 0;
      let view;
      for (; viewLength > startIndex; ++startIndex) {
          collectionIndex = startIndex + delta;
          view = repeat.view(startIndex);
          rebindView(repeat, view, collectionIndex, collection);
          repeat.updateBindings(view);
      }
  };
  const rebindView = (repeat, view, collectionIndex, collection) => {
      view.bindingContext[repeat.local] = collection[collectionIndex];
      aureliaTemplatingResources.updateOverrideContext(view.overrideContext, collectionIndex, collection.length);
  };
  const rebindAndMoveView = (repeat, view, index, moveToBottom) => {
      const items = repeat.items;
      const viewSlot = repeat.viewSlot;
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
  const Math$abs = Math.abs;
  const Math$max = Math.max;
  const Math$min = Math.min;
  const Math$round = Math.round;
  const Math$floor = Math.floor;
  const $isNaN = isNaN;

  const getElementDistanceToTopOfDocument = (element) => {
      let box = element.getBoundingClientRect();
      let documentElement = document.documentElement;
      let scrollTop = window.pageYOffset;
      let clientTop = documentElement.clientTop;
      let top = box.top + scrollTop - clientTop;
      return Math$round(top);
  };
  const hasOverflowScroll = (element) => {
      let style = element.style;
      return style.overflowY === 'scroll' || style.overflow === 'scroll' || style.overflowY === 'auto' || style.overflow === 'auto';
  };
  const getStyleValues = (element, ...styles) => {
      let currentStyle = window.getComputedStyle(element);
      let value = 0;
      let styleValue = 0;
      for (let i = 0, ii = styles.length; ii > i; ++i) {
          styleValue = parseInt(currentStyle[styles[i]], 10);
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
      if (child.previousSibling === null && child.parentNode === parent) {
          return 0;
      }
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

  class ArrayVirtualRepeatStrategy extends aureliaTemplatingResources.ArrayRepeatStrategy {
      createFirstItem(repeat) {
          const overrideContext = aureliaTemplatingResources.createFullOverrideContext(repeat, repeat.items[0], 0, 1);
          return repeat.addView(overrideContext.bindingContext, overrideContext);
      }
      initCalculation(repeat, items) {
          const itemCount = items.length;
          if (!(itemCount > 0)) {
              return 1;
          }
          const containerEl = repeat.getScroller();
          const existingViewCount = repeat.viewCount();
          if (itemCount > 0 && existingViewCount === 0) {
              this.createFirstItem(repeat);
          }
          const isFixedHeightContainer = repeat._fixedHeightContainer = hasOverflowScroll(containerEl);
          const firstView = repeat._firstView();
          const itemHeight = calcOuterHeight(firstView.firstChild);
          if (itemHeight === 0) {
              return 0;
          }
          repeat.itemHeight = itemHeight;
          const scroll_el_height = isFixedHeightContainer
              ? calcScrollHeight(containerEl)
              : document.documentElement.clientHeight;
          const elementsInView = repeat.elementsInView = Math$floor(scroll_el_height / itemHeight) + 1;
          const viewsCount = repeat._viewsLength = elementsInView * 2;
          return 2 | 4;
      }
      instanceChanged(repeat, items, first) {
          if (this._inPlaceProcessItems(repeat, items, first)) {
              this._remeasure(repeat, repeat.itemHeight, repeat._viewsLength, items.length, repeat._first);
          }
      }
      instanceMutated(repeat, array, splices) {
          this._standardProcessInstanceMutated(repeat, array, splices);
      }
      _inPlaceProcessItems(repeat, items, firstIndex) {
          const currItemCount = items.length;
          if (currItemCount === 0) {
              repeat.removeAllViews(true, false);
              repeat._resetCalculation();
              repeat.__queuedSplices = repeat.__array = undefined;
              return false;
          }
          let realViewsCount = repeat.viewCount();
          while (realViewsCount > currItemCount) {
              realViewsCount--;
              repeat.removeView(realViewsCount, true, false);
          }
          while (realViewsCount > repeat._viewsLength) {
              realViewsCount--;
              repeat.removeView(realViewsCount, true, false);
          }
          realViewsCount = Math$min(realViewsCount, repeat._viewsLength);
          const local = repeat.local;
          const lastIndex = currItemCount - 1;
          if (firstIndex + realViewsCount > lastIndex) {
              firstIndex = Math$max(0, currItemCount - realViewsCount);
          }
          repeat._first = firstIndex;
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
          const minLength = Math$min(repeat._viewsLength, currItemCount);
          for (let i = realViewsCount; i < minLength; i++) {
              const overrideContext = aureliaTemplatingResources.createFullOverrideContext(repeat, items[i], i, currItemCount);
              repeat.addView(overrideContext.bindingContext, overrideContext);
          }
          return true;
      }
      _standardProcessInstanceMutated(repeat, array, splices) {
          if (repeat.__queuedSplices) {
              for (let i = 0, ii = splices.length; i < ii; ++i) {
                  const { index, removed, addedCount } = splices[i];
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
          const firstIndex = repeat._first;
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
              const lastIndex = repeat._lastViewIndex();
              const repeatViewSlot = repeat.viewSlot;
              for (i = 0; spliceCount > i; i++) {
                  splice = splices[i];
                  for (let collectionIndex = splice.index; collectionIndex < splice.index + splice.addedCount; collectionIndex++) {
                      if (collectionIndex >= firstIndex && collectionIndex <= lastIndex) {
                          const viewIndex = collectionIndex - firstIndex;
                          const overrideContext = aureliaTemplatingResources.createFullOverrideContext(repeat, newArray[collectionIndex], collectionIndex, newArraySize);
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
              repeat._resetCalculation();
              repeat.itemsChanged();
              return;
          }
          const lastViewIndex = repeat._lastViewIndex();
          const all_splices_are_after_view_port = currViewCount > repeat.elementsInView && splices.every(s => s.index > lastViewIndex);
          if (all_splices_are_after_view_port) {
              repeat._bottomBufferHeight = Math$max(0, newArraySize - firstIndex - currViewCount) * itemHeight;
              repeat._updateBufferElements(true);
          }
          else {
              let viewsRequiredCount = repeat._viewsLength;
              if (viewsRequiredCount === 0) {
                  const scrollerInfo = repeat.getScrollerInfo();
                  const minViewsRequired = Math$floor(scrollerInfo.height / itemHeight) + 1;
                  repeat.elementsInView = minViewsRequired;
                  viewsRequiredCount = repeat._viewsLength = minViewsRequired * 2;
              }
              for (i = 0; spliceCount > i; ++i) {
                  const { addedCount, removed: { length: removedCount }, index: spliceIndex } = splices[i];
                  const removeDelta = removedCount - addedCount;
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
              const newTopBufferItemCount = newArraySize >= firstIndexAfterMutation
                  ? firstIndexAfterMutation
                  : 0;
              const viewCountDelta = newViewCount - currViewCount;
              if (viewCountDelta > 0) {
                  for (i = 0; viewCountDelta > i; ++i) {
                      const collectionIndex = firstIndexAfterMutation + currViewCount + i;
                      const overrideContext = aureliaTemplatingResources.createFullOverrideContext(repeat, newArray[collectionIndex], collectionIndex, newArray.length);
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
      }
      _remeasure(repeat, itemHeight, newViewCount, newArraySize, firstIndexAfterMutation) {
          const scrollerInfo = repeat.getScrollerInfo();
          const topBufferDistance = getDistanceToParent(repeat.topBufferEl, scrollerInfo.scroller);
          const realScrolltop = Math$max(0, scrollerInfo.scrollTop === 0
              ? 0
              : (scrollerInfo.scrollTop - topBufferDistance));
          let first_index_after_scroll_adjustment = realScrolltop === 0
              ? 0
              : Math$floor(realScrolltop / itemHeight);
          if (first_index_after_scroll_adjustment + newViewCount >= newArraySize) {
              first_index_after_scroll_adjustment = Math$max(0, newArraySize - newViewCount);
          }
          const top_buffer_item_count_after_scroll_adjustment = first_index_after_scroll_adjustment;
          const bot_buffer_item_count_after_scroll_adjustment = Math$max(0, newArraySize - top_buffer_item_count_after_scroll_adjustment - newViewCount);
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
      }
      _isIndexBeforeViewSlot(repeat, viewSlot, index) {
          const viewIndex = this._getViewIndex(repeat, viewSlot, index);
          return viewIndex < 0;
      }
      _isIndexAfterViewSlot(repeat, viewSlot, index) {
          const viewIndex = this._getViewIndex(repeat, viewSlot, index);
          return viewIndex > repeat._viewsLength - 1;
      }
      _getViewIndex(repeat, viewSlot, index) {
          if (repeat.viewCount() === 0) {
              return -1;
          }
          const topBufferItems = repeat._topBufferHeight / repeat.itemHeight;
          return Math$floor(index - topBufferItems);
      }
  }

  class NullVirtualRepeatStrategy extends aureliaTemplatingResources.NullRepeatStrategy {
      initCalculation(repeat, items) {
          repeat.itemHeight
              = repeat.elementsInView
                  = repeat._viewsLength = 0;
          return 2;
      }
      createFirstItem() {
          return null;
      }
      instanceMutated() { }
      instanceChanged(repeat) {
          repeat.removeAllViews(true, false);
          repeat._resetCalculation();
      }
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
          return element.parentNode;
      }
      moveViewFirst(view, topBuffer) {
          insertBeforeNode(view, aureliaPal.DOM.nextElementSibling(topBuffer));
      }
      moveViewLast(view, bottomBuffer) {
          const previousSibling = bottomBuffer.previousSibling;
          const referenceNode = previousSibling.nodeType === 8 && previousSibling.data === 'anchor' ? previousSibling : bottomBuffer;
          insertBeforeNode(view, referenceNode);
      }
      createBuffers(element) {
          const parent = element.parentNode;
          return [
              parent.insertBefore(aureliaPal.DOM.createElement('div'), element),
              parent.insertBefore(aureliaPal.DOM.createElement('div'), element.nextSibling)
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
          return this.getTable(element).parentNode;
      }
      createBuffers(element) {
          const parent = element.parentNode;
          return [
              parent.insertBefore(aureliaPal.DOM.createElement('tr'), element),
              parent.insertBefore(aureliaPal.DOM.createElement('tr'), element.nextSibling)
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
      getScrollContainer(element) {
          let listElement = this.getList(element);
          return hasOverflowScroll(listElement)
              ? listElement
              : listElement.parentNode;
      }
      createBuffers(element) {
          const parent = element.parentNode;
          return [
              parent.insertBefore(aureliaPal.DOM.createElement('li'), element),
              parent.insertBefore(aureliaPal.DOM.createElement('li'), element.nextSibling)
          ];
      }
      getList(element) {
          return element.parentNode;
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
  TemplateStrategyLocator.inject = [aureliaDependencyInjection.Container];

  const VirtualizationEvents = Object.assign(Object.create(null), {
      scrollerSizeChange: 'virtual-repeat-scroller-size-changed',
      itemSizeChange: 'virtual-repeat-item-size-changed'
  });

  const getResizeObserverClass = () => aureliaPal.PLATFORM.global.ResizeObserver;

  class VirtualRepeat extends aureliaTemplatingResources.AbstractRepeater {
      constructor(element, viewFactory, instruction, viewSlot, viewResources, observerLocator, collectionStrategyLocator, templateStrategyLocator) {
          super({
              local: 'item',
              viewsRequireLifecycle: aureliaTemplatingResources.viewsRequireLifecycle(viewFactory)
          });
          this._first = 0;
          this._previousFirst = 0;
          this._viewsLength = 0;
          this._lastRebind = 0;
          this._topBufferHeight = 0;
          this._bottomBufferHeight = 0;
          this._isScrolling = false;
          this._scrollingDown = false;
          this._scrollingUp = false;
          this._switchedDirection = false;
          this._isAttached = false;
          this._ticking = false;
          this._fixedHeightContainer = false;
          this._isAtTop = true;
          this._calledGetMore = false;
          this._skipNextScrollHandle = false;
          this._handlingMutations = false;
          this.element = element;
          this.viewFactory = viewFactory;
          this.instruction = instruction;
          this.viewSlot = viewSlot;
          this.lookupFunctions = viewResources['lookupFunctions'];
          this.observerLocator = observerLocator;
          this.taskQueue = observerLocator.taskQueue;
          this.strategyLocator = collectionStrategyLocator;
          this.templateStrategyLocator = templateStrategyLocator;
          this.sourceExpression = aureliaTemplatingResources.getItemsSourceExpression(this.instruction, 'virtual-repeat.for');
          this.isOneTime = aureliaTemplatingResources.isOneTime(this.sourceExpression);
          this.itemHeight
              = this._prevItemsCount
                  = this.distanceToTop
                      = 0;
          this.revertScrollCheckGuard = () => {
              this._ticking = false;
          };
      }
      static inject() {
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
      }
      static $resource() {
          return {
              type: 'attribute',
              name: 'virtual-repeat',
              templateController: true,
              bindables: ['items', 'local']
          };
      }
      bind(bindingContext, overrideContext) {
          this.scope = { bindingContext, overrideContext };
      }
      attached() {
          this._isAttached = true;
          this._prevItemsCount = this.items.length;
          const element = this.element;
          const templateStrategy = this.templateStrategy = this.templateStrategyLocator.getStrategy(element);
          const scrollListener = this.scrollListener = () => {
              this._onScroll();
          };
          const containerEl = this.scrollerEl = templateStrategy.getScrollContainer(element);
          const [topBufferEl, bottomBufferEl] = templateStrategy.createBuffers(element);
          const isFixedHeightContainer = this._fixedHeightContainer = hasOverflowScroll(containerEl);
          this.topBufferEl = topBufferEl;
          this.bottomBufferEl = bottomBufferEl;
          this.itemsChanged();
          if (isFixedHeightContainer) {
              containerEl.addEventListener('scroll', scrollListener);
          }
          else {
              const firstElement = templateStrategy.getFirstElement(topBufferEl, bottomBufferEl);
              this.distanceToTop = firstElement === null ? 0 : getElementDistanceToTopOfDocument(topBufferEl);
              aureliaPal.DOM.addEventListener('scroll', scrollListener, false);
              this._calcDistanceToTopInterval = aureliaPal.PLATFORM.global.setInterval(() => {
                  const prevDistanceToTop = this.distanceToTop;
                  const currDistanceToTop = getElementDistanceToTopOfDocument(topBufferEl);
                  this.distanceToTop = currDistanceToTop;
                  if (prevDistanceToTop !== currDistanceToTop) {
                      this._handleScroll();
                  }
              }, 500);
          }
          if (this.items.length < this.elementsInView) {
              this._getMore(true);
          }
      }
      call(context, changes) {
          this[context](this.items, changes);
      }
      detached() {
          const scrollCt = this.scrollerEl;
          const scrollListener = this.scrollListener;
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
          const $clearInterval = aureliaPal.PLATFORM.global.clearInterval;
          $clearInterval(this._calcDistanceToTopInterval);
          $clearInterval(this._sizeInterval);
          this._prevItemsCount
              = this.distanceToTop
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
          strategy.instanceChanged(this, items, this._first);
          if (calculationSignals & 1) {
              this._resetCalculation();
          }
          if ((calculationSignals & 2) === 0) {
              const { setInterval: $setInterval, clearInterval: $clearInterval } = aureliaPal.PLATFORM.global;
              $clearInterval(this._sizeInterval);
              this._sizeInterval = $setInterval(() => {
                  if (this.items) {
                      const firstView = this._firstView() || this.strategy.createFirstItem(this);
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
              this._observeScroller(this.getScroller());
          }
      }
      handleCollectionMutated(collection, changes) {
          if (this._ignoreMutation) {
              return;
          }
          this._handlingMutations = true;
          this._prevItemsCount = collection.length;
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
      getScroller() {
          return this._fixedHeightContainer
              ? this.scrollerEl
              : document.documentElement;
      }
      getScrollerInfo() {
          const scroller = this.getScroller();
          return {
              scroller: scroller,
              scrollHeight: scroller.scrollHeight,
              scrollTop: scroller.scrollTop,
              height: calcScrollHeight(scroller)
          };
      }
      _resetCalculation() {
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
      }
      _onScroll() {
          const isHandlingMutations = this._handlingMutations;
          if (!this._ticking && !isHandlingMutations) {
              this.taskQueue.queueMicroTask(() => {
                  this._handleScroll();
                  this._ticking = false;
              });
              this._ticking = true;
          }
          if (isHandlingMutations) {
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
          const items = this.items;
          if (!items) {
              return;
          }
          const topBufferEl = this.topBufferEl;
          const scrollerEl = this.scrollerEl;
          const itemHeight = this.itemHeight;
          let realScrollTop = 0;
          const isFixedHeightContainer = this._fixedHeightContainer;
          if (isFixedHeightContainer) {
              const topBufferDistance = getDistanceToParent(topBufferEl, scrollerEl);
              const scrollerScrollTop = scrollerEl.scrollTop;
              realScrollTop = Math$max(0, scrollerScrollTop - Math$abs(topBufferDistance));
          }
          else {
              realScrollTop = pageYOffset - this.distanceToTop;
          }
          const elementsInView = this.elementsInView;
          let firstIndex = Math$max(0, itemHeight > 0 ? Math$floor(realScrollTop / itemHeight) : 0);
          const currLastReboundIndex = this._lastRebind;
          if (firstIndex > items.length - elementsInView) {
              firstIndex = Math$max(0, items.length - elementsInView);
          }
          this._first = firstIndex;
          this._checkScrolling();
          const isSwitchedDirection = this._switchedDirection;
          const currentTopBufferHeight = this._topBufferHeight;
          const currentBottomBufferHeight = this._bottomBufferHeight;
          if (this._scrollingDown) {
              let viewsToMoveCount = firstIndex - currLastReboundIndex;
              if (isSwitchedDirection) {
                  viewsToMoveCount = this._isAtTop
                      ? firstIndex
                      : (firstIndex - currLastReboundIndex);
              }
              this._isAtTop = false;
              this._lastRebind = firstIndex;
              const movedViewsCount = this._moveViews(viewsToMoveCount);
              const adjustHeight = movedViewsCount < viewsToMoveCount
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
              const isLastIndex = this._isLastIndex;
              let viewsToMoveCount = currLastReboundIndex - firstIndex;
              const initialScrollState = isLastIndex === undefined;
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
              const movedViewsCount = this._moveViews(viewsToMoveCount);
              const adjustHeight = movedViewsCount < viewsToMoveCount
                  ? currentTopBufferHeight
                  : itemHeight * movedViewsCount;
              if (viewsToMoveCount > 0) {
                  const force = movedViewsCount === 0 && initialScrollState && firstIndex <= 0 ? true : false;
                  this._getMore(force);
              }
              this._switchedDirection = false;
              this._topBufferHeight = Math$max(currentTopBufferHeight - adjustHeight, 0);
              this._bottomBufferHeight = currentBottomBufferHeight + adjustHeight;
              this._updateBufferElements(true);
          }
          this._previousFirst = firstIndex;
          this._isScrolling = false;
      }
      _getMore(force) {
          if (this._isLastIndex || this._first === 0 || force === true) {
              if (!this._calledGetMore) {
                  const executeGetMore = () => {
                      this._calledGetMore = true;
                      const firstView = this._firstView();
                      const scrollNextAttrName = 'infinite-scroll-next';
                      const func = (firstView
                          && firstView.firstChild
                          && firstView.firstChild.au
                          && firstView.firstChild.au[scrollNextAttrName])
                          ? firstView.firstChild.au[scrollNextAttrName].instruction.attributes[scrollNextAttrName]
                          : undefined;
                      const topIndex = this._first;
                      const isAtBottom = this._bottomBufferHeight === 0;
                      const isAtTop = this._isAtTop;
                      const scrollContext = {
                          topIndex: topIndex,
                          isAtBottom: isAtBottom,
                          isAtTop: isAtTop
                      };
                      const overrideContext = this.scope.overrideContext;
                      overrideContext.$scrollContext = scrollContext;
                      if (func === undefined) {
                          this._calledGetMore = false;
                          return null;
                      }
                      else if (typeof func === 'string') {
                          const bindingContext = overrideContext.bindingContext;
                          const getMoreFuncName = firstView.firstChild.getAttribute(scrollNextAttrName);
                          const funcCall = bindingContext[getMoreFuncName];
                          if (typeof funcCall === 'function') {
                              const result = funcCall.call(bindingContext, topIndex, isAtBottom, isAtTop);
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
                              throw new Error(`'${scrollNextAttrName}' must be a function or evaluate to one`);
                          }
                      }
                      else if (func.sourceExpression) {
                          this._calledGetMore = false;
                          return func.sourceExpression.evaluate(this.scope);
                      }
                      else {
                          throw new Error(`'${scrollNextAttrName}' must be a function or evaluate to one`);
                      }
                      return null;
                  };
                  this.taskQueue.queueMicroTask(executeGetMore);
              }
          }
      }
      _checkScrolling() {
          const { _first, _scrollingUp, _scrollingDown, _previousFirst } = this;
          let isScrolling = false;
          let isScrollingDown = _scrollingDown;
          let isScrollingUp = _scrollingUp;
          let isSwitchedDirection = false;
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
      }
      _updateBufferElements(skipUpdate) {
          this.topBufferEl.style.height = `${this._topBufferHeight}px`;
          this.bottomBufferEl.style.height = `${this._bottomBufferHeight}px`;
          if (skipUpdate) {
              this._ticking = true;
              requestAnimationFrame(this.revertScrollCheckGuard);
          }
      }
      _unsubscribeCollection() {
          const collectionObserver = this.collectionObserver;
          if (collectionObserver) {
              collectionObserver.unsubscribe(this.callContext, this);
              this.collectionObserver = this.callContext = null;
          }
      }
      _firstView() {
          return this.view(0);
      }
      _lastView() {
          return this.view(this.viewCount() - 1);
      }
      _moveViews(viewsCount) {
          const isScrollingDown = this._scrollingDown;
          const getNextIndex = isScrollingDown ? $plus : $minus;
          const childrenCount = this.viewCount();
          const viewIndex = isScrollingDown ? 0 : childrenCount - 1;
          const items = this.items;
          const currentIndex = isScrollingDown
              ? this._lastViewIndex() + 1
              : this._firstViewIndex() - 1;
          let i = 0;
          let nextIndex = 0;
          let view;
          const viewToMoveLimit = viewsCount - (childrenCount * 2);
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
      }
      get _isAtFirstOrLastIndex() {
          return !this._isScrolling || this._scrollingDown ? this._isLastIndex : this._isAtTop;
      }
      _firstViewIndex() {
          const firstView = this._firstView();
          return firstView === null ? -1 : firstView.overrideContext.$index;
      }
      _lastViewIndex() {
          const lastView = this._lastView();
          return lastView === null ? -1 : lastView.overrideContext.$index;
      }
      _observeScroller(scrollerEl) {
          const $raf = requestAnimationFrame;
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
          elEvents = this._scrollerEvents = new aureliaTemplating.ElementEvents(scrollerEl);
          elEvents.subscribe(VirtualizationEvents.scrollerSizeChange, sizeChangeEventsHandler, false);
          elEvents.subscribe(VirtualizationEvents.itemSizeChange, sizeChangeEventsHandler, false);
      }
      _unobserveScrollerSize() {
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
          const expression = aureliaTemplatingResources.unwrapExpression(this.sourceExpression);
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
              aureliaTemplatingResources.updateOneTimeBinding(bindings[j]);
          }
          const controllers = view.controllers;
          j = controllers.length;
          while (j--) {
              const boundProperties = controllers[j].boundProperties;
              let k = boundProperties.length;
              while (k--) {
                  let binding = boundProperties[k].binding;
                  aureliaTemplatingResources.updateOneTimeBinding(binding);
              }
          }
      }
  }
  const $minus = (index, i) => index - i;
  const $plus = (index, i) => index + i;

  class InfiniteScrollNext {
      static $resource() {
          return {
              type: 'attribute',
              name: 'infinite-scroll-next'
          };
      }
  }

  function configure(config) {
      config.globalResources(VirtualRepeat, InfiniteScrollNext);
  }

  exports.configure = configure;
  exports.VirtualRepeat = VirtualRepeat;
  exports.InfiniteScrollNext = InfiniteScrollNext;
  exports.VirtualizationEvents = VirtualizationEvents;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
