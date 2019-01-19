(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('aurelia-binding'), require('aurelia-templating'), require('aurelia-templating-resources'), require('aurelia-pal'), require('aurelia-dependency-injection')) :
  typeof define === 'function' && define.amd ? define(['exports', 'aurelia-binding', 'aurelia-templating', 'aurelia-templating-resources', 'aurelia-pal', 'aurelia-dependency-injection'], factory) :
  (global = global || self, factory((global.au = global.au || {}, global.au.uiVirtualization = {}), global.au, global.au, global.au, global.au, global.au));
}(this, function (exports, aureliaBinding, aureliaTemplating, aureliaTemplatingResources, aureliaPal, aureliaDependencyInjection) { 'use strict';

  function calcOuterHeight(element) {
      let height = element.getBoundingClientRect().height;
      height += getStyleValues(element, 'marginTop', 'marginBottom');
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
          aureliaTemplatingResources.updateOverrideContext(views[startIndex].overrideContext, startIndex + delta, collectionLength);
      }
  }
  function rebindAndMoveView(repeat, view, index, moveToBottom) {
      let items = repeat.items;
      let viewSlot = repeat.viewSlot;
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
  function getStyleValues(element, ...styles) {
      let currentStyle = window.getComputedStyle(element);
      let value = 0;
      let styleValue = 0;
      for (let i = 0, ii = styles.length; ii > i; ++i) {
          styleValue = parseInt(currentStyle[styles[i]], 10);
          value += Number.isNaN(styleValue) ? 0 : styleValue;
      }
      return value;
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

  class ArrayVirtualRepeatStrategy extends aureliaTemplatingResources.ArrayRepeatStrategy {
      createFirstItem(repeat) {
          let overrideContext = aureliaTemplatingResources.createFullOverrideContext(repeat, repeat.items[0], 0, 1);
          repeat.addView(overrideContext.bindingContext, overrideContext);
      }
      instanceChanged(repeat, items, ...rest) {
          this._inPlaceProcessItems(repeat, items, rest[0]);
      }
      instanceMutated(repeat, array, splices) {
          this._standardProcessInstanceMutated(repeat, array, splices);
      }
      _standardProcessInstanceChanged(repeat, items) {
          for (let i = 1, ii = repeat._viewsLength; i < ii; ++i) {
              let overrideContext = aureliaTemplatingResources.createFullOverrideContext(repeat, items[i], i, ii);
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
              let overrideContext = aureliaTemplatingResources.createFullOverrideContext(repeat, items[i], i, itemsLength);
              repeat.addView(overrideContext.bindingContext, overrideContext);
          }
      }
      _standardProcessInstanceMutated(repeat, array, splices) {
          if (repeat.__queuedSplices) {
              for (let i = 0, ii = splices.length; i < ii; ++i) {
                  let { index, removed, addedCount } = splices[i];
                  aureliaBinding.mergeSplice(repeat.__queuedSplices, index, removed, addedCount);
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
                      if (!this._isIndexBeforeViewSlot(repeat, repeat.viewSlot, collectionIndex)
                          && !this._isIndexAfterViewSlot(repeat, repeat.viewSlot, collectionIndex)) {
                          let viewIndex = this._getViewIndex(repeat, repeat.viewSlot, collectionIndex);
                          let overrideContext = aureliaTemplatingResources.createFullOverrideContext(repeat, array[collectionIndex], collectionIndex, array.length);
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
      _removeViewAt(repeat, collectionIndex, returnToCache, removeIndex, removedLength) {
          let viewOrPromise;
          let view;
          let viewSlot = repeat.viewSlot;
          let viewCount = repeat.viewCount();
          let viewAddIndex;
          let removeMoreThanInDom = removedLength > viewCount;
          if (repeat._viewsLength <= removeIndex) {
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
                          collectionAddIndex = removeIndex;
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
                      let overrideContext = aureliaTemplatingResources.createFullOverrideContext(repeat, data, collectionAddIndex, repeat.items.length);
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
                  if (repeat.viewCount() === 0
                      || (!this._isIndexBeforeViewSlot(repeat, viewSlot, addIndex)
                          && !this._isIndexAfterViewSlot(repeat, viewSlot, addIndex))
                      || hasDistanceToBottomViewPort) {
                      let overrideContext = aureliaTemplatingResources.createFullOverrideContext(repeat, array[addIndex], addIndex, arrayLength);
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

  class NullVirtualRepeatStrategy extends aureliaTemplatingResources.NullRepeatStrategy {
      instanceMutated() {
      }
      instanceChanged(repeat) {
          super.instanceChanged(repeat);
          repeat._resetCalculation();
      }
  }

  class VirtualRepeatStrategyLocator extends aureliaTemplatingResources.RepeatStrategyLocator {
      constructor() {
          super();
          this.matchers = [];
          this.strategies = [];
          this.addStrategy(items => items === null || items === undefined, new NullVirtualRepeatStrategy());
          this.addStrategy(items => items instanceof Array, new ArrayVirtualRepeatStrategy());
      }
      getStrategy(items) {
          return super.getStrategy(items);
      }
  }

  class TemplateStrategyLocator {
      constructor(container) {
          this.container = container;
      }
      getStrategy(element) {
          const parent = element.parentNode;
          if (parent === null) {
              return this.container.get(DefaultTemplateStrategy);
          }
          const parentTagName = parent.tagName;
          if (parentTagName === 'TBODY' || parentTagName === 'THEAD' || parentTagName === 'TFOOT') {
              return this.container.get(TableRowStrategy);
          }
          if (parentTagName === 'TABLE') {
              return this.container.get(TableBodyStrategy);
          }
          return this.container.get(DefaultTemplateStrategy);
      }
  }
  TemplateStrategyLocator.inject = [aureliaDependencyInjection.Container];
  class TableBodyStrategy {
      getScrollContainer(element) {
          return this.getTable(element).parentNode;
      }
      moveViewFirst(view, topBuffer) {
          insertBeforeNode(view, aureliaPal.DOM.nextElementSibling(topBuffer));
      }
      moveViewLast(view, bottomBuffer) {
          const previousSibling = bottomBuffer.previousSibling;
          const referenceNode = previousSibling.nodeType === 8 && previousSibling.data === 'anchor' ? previousSibling : bottomBuffer;
          insertBeforeNode(view, referenceNode);
      }
      createTopBufferElement(element) {
          return element.parentNode.insertBefore(aureliaPal.DOM.createElement('tr'), element);
      }
      createBottomBufferElement(element) {
          return element.parentNode.insertBefore(aureliaPal.DOM.createElement('tr'), element.nextSibling);
      }
      removeBufferElements(element, topBuffer, bottomBuffer) {
          aureliaPal.DOM.removeNode(topBuffer);
          aureliaPal.DOM.removeNode(bottomBuffer);
      }
      getFirstElement(topBuffer) {
          return topBuffer.nextElementSibling;
      }
      getLastElement(bottomBuffer) {
          return bottomBuffer.previousElementSibling;
      }
      getTopBufferDistance(topBuffer) {
          return 0;
      }
      getTable(element) {
          return element.parentNode;
      }
  }
  class TableRowStrategy {
      constructor(domHelper) {
          this.domHelper = domHelper;
      }
      getScrollContainer(element) {
          return this.getTable(element).parentNode;
      }
      moveViewFirst(view, topBuffer) {
          insertBeforeNode(view, topBuffer.nextElementSibling);
      }
      moveViewLast(view, bottomBuffer) {
          const previousSibling = bottomBuffer.previousSibling;
          const referenceNode = previousSibling.nodeType === 8 && previousSibling.data === 'anchor' ? previousSibling : bottomBuffer;
          insertBeforeNode(view, referenceNode);
      }
      createTopBufferElement(element) {
          return element.parentNode.insertBefore(aureliaPal.DOM.createElement('tr'), element);
      }
      createBottomBufferElement(element) {
          return element.parentNode.insertBefore(aureliaPal.DOM.createElement('tr'), element.nextSibling);
      }
      removeBufferElements(element, topBuffer, bottomBuffer) {
          aureliaPal.DOM.removeNode(topBuffer);
          aureliaPal.DOM.removeNode(bottomBuffer);
      }
      getFirstElement(topBuffer) {
          return topBuffer.nextElementSibling;
      }
      getLastElement(bottomBuffer) {
          return bottomBuffer.previousElementSibling;
      }
      getTopBufferDistance(topBuffer) {
          return 0;
      }
      getTable(element) {
          return element.parentNode.parentNode;
      }
  }
  TableRowStrategy.inject = [DomHelper];
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
      createTopBufferElement(element) {
          const elementName = /^[UO]L$/.test(element.parentNode.tagName) ? 'li' : 'div';
          const buffer = aureliaPal.DOM.createElement(elementName);
          element.parentNode.insertBefore(buffer, element);
          return buffer;
      }
      createBottomBufferElement(element) {
          const elementName = /^[UO]L$/.test(element.parentNode.tagName) ? 'li' : 'div';
          const buffer = aureliaPal.DOM.createElement(elementName);
          element.parentNode.insertBefore(buffer, element.nextSibling);
          return buffer;
      }
      removeBufferElements(element, topBuffer, bottomBuffer) {
          element.parentNode.removeChild(topBuffer);
          element.parentNode.removeChild(bottomBuffer);
      }
      getFirstElement(topBuffer) {
          return aureliaPal.DOM.nextElementSibling(topBuffer);
      }
      getLastElement(bottomBuffer) {
          return bottomBuffer.previousElementSibling;
      }
      getTopBufferDistance(topBuffer) {
          return 0;
      }
  }

  class VirtualRepeat extends aureliaTemplatingResources.AbstractRepeater {
      constructor(element, viewFactory, instruction, viewSlot, viewResources, observerLocator, strategyLocator, templateStrategyLocator, domHelper) {
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
          this._bufferSize = 0;
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
          this.taskQueue = observerLocator.taskQueue;
          this.strategyLocator = strategyLocator;
          this.templateStrategyLocator = templateStrategyLocator;
          this.sourceExpression = aureliaTemplatingResources.getItemsSourceExpression(this.instruction, 'virtual-repeat.for');
          this.isOneTime = aureliaTemplatingResources.isOneTime(this.sourceExpression);
          this.domHelper = domHelper;
      }
      static inject() {
          return [aureliaPal.DOM.Element, aureliaTemplating.BoundViewFactory, aureliaTemplating.TargetInstruction, aureliaTemplating.ViewSlot, aureliaTemplating.ViewResources, aureliaBinding.ObserverLocator, VirtualRepeatStrategyLocator, TemplateStrategyLocator, DomHelper];
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
          this._itemsLength = this.items.length;
          let element = this.element;
          let templateStrategy = this.templateStrategy = this.templateStrategyLocator.getStrategy(element);
          let scrollListener = this.scrollListener = () => this._onScroll();
          let scrollContainer = this.scrollContainer = templateStrategy.getScrollContainer(element);
          let topBuffer = this.topBuffer = templateStrategy.createTopBufferElement(element);
          this.bottomBuffer = templateStrategy.createBottomBufferElement(element);
          this.itemsChanged();
          this._calcDistanceToTopInterval = aureliaPal.PLATFORM.global.setInterval(() => {
              let prevDistanceToTop = this.distanceToTop;
              let currDistanceToTop = this.domHelper.getElementDistanceToTopOfDocument(topBuffer) + this.topBufferDistance;
              this.distanceToTop = currDistanceToTop;
              if (prevDistanceToTop !== currDistanceToTop) {
                  this._handleScroll();
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
      }
      call(context, changes) {
          this[context](this.items, changes);
      }
      detached() {
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
      }
      unbind() {
          this.scope = null;
          this.items = null;
          this._itemsLength = 0;
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
      handleCollectionMutated(collection, changes) {
          if (this.ignoreMutation) {
              return;
          }
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
          this.taskQueue.queueMicroTask(() => this.ignoreMutation = false);
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
              requestAnimationFrame(() => {
                  this._handleScroll();
                  this._ticking = false;
              });
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
          let scrollTop = this._fixedHeightContainer
              ? this.scrollContainer.scrollTop
              : (pageYOffset - this.distanceToTop);
          let firstViewIndex = itemHeight > 0 ? Math.floor(scrollTop / itemHeight) : 0;
          this._first = firstViewIndex < 0 ? 0 : firstViewIndex;
          if (this._first > this.items.length - this.elementsInView) {
              firstViewIndex = this.items.length - this.elementsInView;
              this._first = firstViewIndex < 0 ? 0 : firstViewIndex;
          }
          this._checkScrolling();
          let currentTopBufferHeight = this._topBufferHeight;
          let currentBottomBufferHeight = this._bottomBufferHeight;
          if (this._scrollingDown) {
              let viewsToMoveCount = this._first - this._lastRebind;
              if (this._switchedDirection) {
                  viewsToMoveCount = this._isAtTop ? this._first : this._bufferSize - (this._lastRebind - this._first);
              }
              this._isAtTop = false;
              this._lastRebind = this._first;
              let movedViewsCount = this._moveViews(viewsToMoveCount);
              let adjustHeight = movedViewsCount < viewsToMoveCount ? currentBottomBufferHeight : itemHeight * movedViewsCount;
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
              let viewsToMoveCount = this._lastRebind - this._first;
              let initialScrollState = this.isLastIndex === undefined;
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
              let movedViewsCount = this._moveViews(viewsToMoveCount);
              this.movedViewsCount = movedViewsCount;
              let adjustHeight = movedViewsCount < viewsToMoveCount
                  ? currentTopBufferHeight
                  : itemHeight * movedViewsCount;
              if (viewsToMoveCount > 0) {
                  let force = this.movedViewsCount === 0 && initialScrollState && this._first <= 0 ? true : false;
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
      }
      _getMore(force) {
          if (this.isLastIndex || this._first === 0 || force === true) {
              if (!this._calledGetMore) {
                  let executeGetMore = () => {
                      this._calledGetMore = true;
                      let firstView = this._getFirstView();
                      let scrollNextAttrName = 'infinite-scroll-next';
                      let func = (firstView
                          && firstView.firstChild
                          && firstView.firstChild.au
                          && firstView.firstChild.au[scrollNextAttrName])
                          ? firstView.firstChild.au[scrollNextAttrName].instruction.attributes[scrollNextAttrName]
                          : undefined;
                      let topIndex = this._first;
                      let isAtBottom = this._bottomBufferHeight === 0;
                      let isAtTop = this._isAtTop;
                      let scrollContext = {
                          topIndex: topIndex,
                          isAtBottom: isAtBottom,
                          isAtTop: isAtTop
                      };
                      let overrideContext = this.scope.overrideContext;
                      overrideContext.$scrollContext = scrollContext;
                      if (func === undefined) {
                          this._calledGetMore = false;
                          return null;
                      }
                      else if (typeof func === 'string') {
                          let getMoreFuncName = firstView.firstChild.getAttribute(scrollNextAttrName);
                          let funcCall = overrideContext.bindingContext[getMoreFuncName];
                          if (typeof funcCall === 'function') {
                              let result = funcCall.call(overrideContext.bindingContext, topIndex, isAtBottom, isAtTop);
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
          let collectionObserver = this.collectionObserver;
          if (collectionObserver) {
              collectionObserver.unsubscribe(this.callContext, this);
              this.collectionObserver = this.callContext = null;
          }
      }
      _getFirstView() {
          return this.view(0);
      }
      _getLastView() {
          return this.view(this.viewCount() - 1);
      }
      _moveViews(viewsCount) {
          let getNextIndex = this._scrollingDown ? $plus : $minus;
          let childrenCount = this.viewCount();
          let viewIndex = this._scrollingDown ? 0 : childrenCount - 1;
          let items = this.items;
          let currentIndex = this._scrollingDown ? this._getIndexOfLastView() + 1 : this._getIndexOfFirstView() - 1;
          let i = 0;
          let viewToMoveLimit = viewsCount - (childrenCount * 2);
          while (i < viewsCount && !this._isAtFirstOrLastIndex) {
              let view = this.view(viewIndex);
              let nextIndex = getNextIndex(currentIndex, i);
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
      }
      get _isAtFirstOrLastIndex() {
          return this._scrollingDown ? this.isLastIndex : this._isAtTop;
      }
      _getIndexOfLastView() {
          const lastView = this._getLastView();
          return lastView === null ? -1 : lastView.overrideContext.$index;
      }
      _getLastViewItem() {
          let lastView = this._getLastView();
          return lastView === null ? undefined : lastView.bindingContext[this.local];
      }
      _getIndexOfFirstView() {
          let firstView = this._getFirstView();
          return firstView === null ? -1 : firstView.overrideContext.$index;
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
              this._sizeInterval = aureliaPal.PLATFORM.global.setInterval(() => {
                  let newCalcSize = calcOuterHeight(firstViewElement);
                  if (newCalcSize > 0) {
                      aureliaPal.PLATFORM.global.clearInterval(this._sizeInterval);
                      this.itemsChanged();
                  }
              }, 500);
              return;
          }
          this._itemsLength = itemsLength;
          this.scrollContainerHeight = this._fixedHeightContainer
              ? this._calcScrollHeight(this.scrollContainer)
              : document.documentElement.clientHeight;
          this.elementsInView = Math.ceil(this.scrollContainerHeight / this.itemHeight) + 1;
          let viewsCount = this._viewsLength = (this.elementsInView * 2) + this._bufferSize;
          let newBottomBufferHeight = this.itemHeight * (itemsLength - viewsCount);
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
              let adjustedTopBufferHeight = this._first * this.itemHeight;
              this._topBufferHeight = adjustedTopBufferHeight;
              this._bottomBufferHeight = newBottomBufferHeight - adjustedTopBufferHeight;
              if (this._bottomBufferHeight < 0) {
                  this._bottomBufferHeight = 0;
              }
          }
          this._adjustBufferHeights();
      }
      _calcScrollHeight(element) {
          let height = element.getBoundingClientRect().height;
          height -= getStyleValues(element, 'borderTopWidth', 'borderBottomWidth');
          return height;
      }
      _observeInnerCollection() {
          let items = this._getInnerCollection();
          let strategy = this.strategyLocator.getStrategy(items);
          if (!strategy) {
              return false;
          }
          let collectionObserver = strategy.getCollectionObserver(this.observerLocator, items);
          if (!collectionObserver) {
              return false;
          }
          let context = "handleInnerCollectionMutated";
          this.collectionObserver = collectionObserver;
          this.callContext = context;
          collectionObserver.subscribe(context, this);
          return true;
      }
      _getInnerCollection() {
          let expression = aureliaTemplatingResources.unwrapExpression(this.sourceExpression);
          if (!expression) {
              return null;
          }
          return expression.evaluate(this.scope, null);
      }
      _observeCollection() {
          let collectionObserver = this.strategy.getCollectionObserver(this.observerLocator, this.items);
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
              aureliaTemplatingResources.updateOneTimeBinding(view.bindings[j]);
          }
          j = view.controllers.length;
          while (j--) {
              let k = view.controllers[j].boundProperties.length;
              while (k--) {
                  let binding = view.controllers[j].boundProperties[k].binding;
                  aureliaTemplatingResources.updateOneTimeBinding(binding);
              }
          }
      }
  }
  const $minus = (index, i) => index - i;
  const $plus = (index, i) => index + i;
  const $max = Math.max;

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

  Object.defineProperty(exports, '__esModule', { value: true });

}));
