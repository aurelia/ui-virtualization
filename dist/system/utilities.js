'use strict';

System.register(['aurelia-templating-resources', 'aurelia-templating'], function (_export, _context) {
  "use strict";

  var updateOverrideContext, View;
  function calcOuterHeight(element) {
    var height = void 0;
    height = element.getBoundingClientRect().height;
    height += getStyleValue(element, 'marginTop');
    height += getStyleValue(element, 'marginBottom');
    return height;
  }

  _export('calcOuterHeight', calcOuterHeight);

  function insertBeforeNode(view, bottomBuffer) {
    var parentElement = bottomBuffer.parentElement || bottomBuffer.parentNode;
    parentElement.insertBefore(view.lastChild, bottomBuffer);
  }

  _export('insertBeforeNode', insertBeforeNode);

  function updateVirtualOverrideContexts(repeat, startIndex) {
    var views = repeat.viewSlot.children;
    var viewLength = views.length;
    var collectionLength = repeat.items.length;

    if (startIndex > 0) {
      startIndex = startIndex - 1;
    }

    var delta = repeat._topBufferHeight / repeat.itemHeight;

    for (; startIndex < viewLength; ++startIndex) {
      updateOverrideContext(views[startIndex].overrideContext, startIndex + delta, collectionLength);
    }
  }

  _export('updateVirtualOverrideContexts', updateVirtualOverrideContexts);

  function rebindAndMoveView(repeat, view, index, moveToBottom) {
    var items = repeat.items;
    var viewSlot = repeat.viewSlot;
    updateOverrideContext(view.overrideContext, index, items.length);
    view.bindingContext[repeat.local] = items[index];
    if (moveToBottom) {
      viewSlot.children.push(viewSlot.children.shift());
      repeat.templateStrategy.moveViewLast(view, repeat.bottomBuffer);
    } else {
      viewSlot.children.unshift(viewSlot.children.splice(-1, 1)[0]);
      repeat.templateStrategy.moveViewFirst(view, repeat.topBuffer);
    }
  }

  _export('rebindAndMoveView', rebindAndMoveView);

  function getStyleValue(element, style) {
    var currentStyle = void 0;
    var styleValue = void 0;
    currentStyle = element.currentStyle || window.getComputedStyle(element);
    styleValue = parseInt(currentStyle[style], 10);
    return Number.isNaN(styleValue) ? 0 : styleValue;
  }

  _export('getStyleValue', getStyleValue);

  function getElementDistanceToBottomViewPort(element) {
    return document.documentElement.clientHeight - element.getBoundingClientRect().bottom;
  }

  _export('getElementDistanceToBottomViewPort', getElementDistanceToBottomViewPort);

  function getElementDistanceToTopViewPort(element) {
    return element.getBoundingClientRect().top;
  }

  _export('getElementDistanceToTopViewPort', getElementDistanceToTopViewPort);

  return {
    setters: [function (_aureliaTemplatingResources) {
      updateOverrideContext = _aureliaTemplatingResources.updateOverrideContext;
    }, function (_aureliaTemplating) {
      View = _aureliaTemplating.View;
    }],
    execute: function () {}
  };
});