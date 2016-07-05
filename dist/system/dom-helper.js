'use strict';

System.register([], function (_export, _context) {
  "use strict";

  var DomHelper;

  

  return {
    setters: [],
    execute: function () {
      _export('DomHelper', DomHelper = function () {
        function DomHelper() {
          
        }

        DomHelper.prototype.getElementDistanceToTopOfDocument = function getElementDistanceToTopOfDocument(element) {
          var box = element.getBoundingClientRect();
          var documentElement = document.documentElement;
          var scrollTop = window.pageYOffset;
          var clientTop = documentElement.clientTop;
          var top = box.top + scrollTop - clientTop;
          return Math.round(top);
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