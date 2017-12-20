define(['exports', 'aurelia-pal', './virtual-repeat', './infinite-scroll-next'], function (exports, _aureliaPal, _virtualRepeat, _infiniteScrollNext) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.InfiniteScrollNext = exports.VirtualRepeat = undefined;
  exports.configure = configure;
  function configure(config) {
    config.globalResources(_aureliaPal.PLATFORM.moduleName('./virtual-repeat'), _aureliaPal.PLATFORM.moduleName('./infinite-scroll-next'));
  }

  exports.VirtualRepeat = _virtualRepeat.VirtualRepeat;
  exports.InfiniteScrollNext = _infiniteScrollNext.InfiniteScrollNext;
});