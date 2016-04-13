'use strict';

System.register([], function (_export, _context) {
  var DomHelper;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  return {
    setters: [],
    execute: function () {
      _export('DomHelper', DomHelper = function () {
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
      }());

      _export('DomHelper', DomHelper);
    }
  };
});