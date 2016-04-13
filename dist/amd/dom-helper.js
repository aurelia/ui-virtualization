define(['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  var DomHelper = exports.DomHelper = function () {
    function DomHelper() {
      _classCallCheck(this, DomHelper);
    }

    DomHelper.prototype.getElementDistanceToTopViewPort = function getElementDistanceToTopViewPort(element) {
      return element.getBoundingClientRect().top;
    };

    DomHelper.prototype.hasOverflowScroll = function hasOverflowScroll(element) {
      var style = element.style;
      return style.overflowY === 'scroll' || style.overflow === 'scroll' || style.overflowY === 'auto' || style.overflow === 'auto';
    };

    return DomHelper;
  }();
});