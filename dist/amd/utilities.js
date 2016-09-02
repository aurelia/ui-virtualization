define(['exports', 'aurelia-templating-resources', 'aurelia-templating'], function (exports, _aureliaTemplatingResources, _aureliaTemplating) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.calcOuterHeight = calcOuterHeight;
  exports.insertBeforeNode = insertBeforeNode;
  exports.updateVirtualOverrideContexts = updateVirtualOverrideContexts;
  exports.rebindAndMoveView = rebindAndMoveView;
  exports.getStyleValue = getStyleValue;
  exports.getElementDistanceToBottomViewPort = getElementDistanceToBottomViewPort;
  exports.getElementDistanceToTopViewPort = getElementDistanceToTopViewPort;
  function calcOuterHeight(element) {
    var height = void 0;
    height = element.getBoundingClientRect().height;
    height += getStyleValue(element, 'marginTop');
    height += getStyleValue(element, 'marginBottom');
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
      (0, _aureliaTemplatingResources.updateOverrideContext)(views[startIndex].overrideContext, startIndex + delta, collectionLength);
    }
  }

  function rebindAndMoveView(repeat, view, index, moveToBottom) {
    var items = repeat.items;
    var viewSlot = repeat.viewSlot;
    (0, _aureliaTemplatingResources.updateOverrideContext)(view.overrideContext, index, items.length);
    view.bindingContext[repeat.local] = items[index];
    if (moveToBottom) {
      viewSlot.children.push(viewSlot.children.shift());
      repeat.templateStrategy.moveViewLast(view, repeat.bottomBuffer);
    } else {
      viewSlot.children.unshift(viewSlot.children.splice(-1, 1)[0]);
      repeat.templateStrategy.moveViewFirst(view, repeat.topBuffer);
    }
  }

  function getStyleValue(element, style) {
    var currentStyle = void 0;
    var styleValue = void 0;
    currentStyle = element.currentStyle || window.getComputedStyle(element);
    styleValue = parseInt(currentStyle[style], 10);
    return Number.isNaN(styleValue) ? 0 : styleValue;
  }

  function getElementDistanceToBottomViewPort(element) {
    return document.documentElement.clientHeight - element.getBoundingClientRect().bottom;
  }

  function getElementDistanceToTopViewPort(element) {
    return element.getBoundingClientRect().top;
  }
});