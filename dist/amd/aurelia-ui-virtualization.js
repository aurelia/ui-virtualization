define(['exports', './virtual-repeat', './virtual-repeat-next'], function (exports, _virtualRepeat, _virtualRepeatNext) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.VirtualRepeatNext = exports.VirtualRepeat = undefined;
  exports.configure = configure;
  function configure(config) {
    config.globalResources('./virtual-repeat', './virtual-repeat-next');
  }

  exports.VirtualRepeat = _virtualRepeat.VirtualRepeat;
  exports.VirtualRepeatNext = _virtualRepeatNext.VirtualRepeatNext;
});