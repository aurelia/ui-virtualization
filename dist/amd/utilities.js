define(['exports'], function (exports) {
  'use strict';

  exports.__esModule = true;
  exports.calcOuterHeight = calcOuterHeight;
  exports.calcScrollHeight = calcScrollHeight;
  exports.insertBeforeNode = insertBeforeNode;

  function calcOuterHeight(element) {
    var height;
    height = element.getBoundingClientRect().height;
    height += getStyleValue(element, 'marginTop');
    height += getStyleValue(element, 'marginBottom');
    return height;
  }

  function calcScrollHeight(element) {
    var height;
    height = element.getBoundingClientRect().height;
    height -= getStyleValue(element, 'borderTopWidth');
    height -= getStyleValue(element, 'borderBottomWidth');
    return height;
  }

  function insertBeforeNode(view, scrollView, node) {
    var viewStart = view.firstChild;
    var element = viewStart.nextSibling;
    var viewEnd = view.lastChild;

    scrollView.insertBefore(viewEnd, node);
    scrollView.insertBefore(element, viewEnd);
    scrollView.insertBefore(viewStart, element);
  }

  function getStyleValue(element, style) {
    var currentStyle, styleValue;
    currentStyle = element.currentStyle || window.getComputedStyle(element);
    styleValue = parseInt(currentStyle[style]);
    return Number.isNaN(styleValue) ? 0 : styleValue;
  }
});