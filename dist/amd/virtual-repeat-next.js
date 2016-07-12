define(['exports', 'aurelia-templating'], function (exports, _aureliaTemplating) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.VirtualRepeatNext = undefined;

  

  var _dec, _class;

  var VirtualRepeatNext = exports.VirtualRepeatNext = (_dec = (0, _aureliaTemplating.customAttribute)('virtual-repeat-next'), _dec(_class = function () {
    function VirtualRepeatNext() {
      
    }

    VirtualRepeatNext.prototype.attached = function attached() {};

    VirtualRepeatNext.prototype.bind = function bind(bindingContext, overrideContext) {
      this.scope = { bindingContext: bindingContext, overrideContext: overrideContext };
    };

    return VirtualRepeatNext;
  }()) || _class);
});