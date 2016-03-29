define(['exports', './virtual-repeat'], function (exports, _virtualRepeat) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.VirtualRepeat = undefined;
  exports.configure = configure;
  function configure(config) {
    config.globalResources('./virtual-repeat');
  }

  exports.VirtualRepeat = _virtualRepeat.VirtualRepeat;
});