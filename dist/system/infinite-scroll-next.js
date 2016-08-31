'use strict';

System.register(['aurelia-templating'], function (_export, _context) {
  "use strict";

  var customAttribute, _dec, _class, InfiniteScrollNext;

  

  return {
    setters: [function (_aureliaTemplating) {
      customAttribute = _aureliaTemplating.customAttribute;
    }],
    execute: function () {
      _export('InfiniteScrollNext', InfiniteScrollNext = (_dec = customAttribute('infinite-scroll-next'), _dec(_class = function () {
        function InfiniteScrollNext() {
          
        }

        InfiniteScrollNext.prototype.attached = function attached() {};

        InfiniteScrollNext.prototype.bind = function bind(bindingContext, overrideContext) {
          this.scope = { bindingContext: bindingContext, overrideContext: overrideContext };
        };

        return InfiniteScrollNext;
      }()) || _class));

      _export('InfiniteScrollNext', InfiniteScrollNext);
    }
  };
});