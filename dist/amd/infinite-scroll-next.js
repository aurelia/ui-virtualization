define(['exports', 'aurelia-templating'], function (exports, _aureliaTemplating) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.InfiniteScrollNext = undefined;

  

  var _dec, _class;

  var InfiniteScrollNext = exports.InfiniteScrollNext = (_dec = (0, _aureliaTemplating.customAttribute)('infinite-scroll-next'), _dec(_class = function () {
    function InfiniteScrollNext() {
      
    }

    InfiniteScrollNext.prototype.attached = function attached() {};

    InfiniteScrollNext.prototype.bind = function bind(bindingContext, overrideContext) {
      this.scope = { bindingContext: bindingContext, overrideContext: overrideContext };
    };

    return InfiniteScrollNext;
  }()) || _class);
});