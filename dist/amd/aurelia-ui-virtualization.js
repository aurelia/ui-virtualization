define(['exports', './virtual-repeat', './infinite-scroll-next'], function (exports, _virtualRepeat, _infiniteScrollNext) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.InfiniteScrollNext = exports.VirtualRepeat = undefined;
  exports.configure = configure;
  function configure(config) {
    config.globalResources('./virtual-repeat', './infinite-scroll-next');
  }

  exports.VirtualRepeat = _virtualRepeat.VirtualRepeat;
  exports.InfiniteScrollNext = _infiniteScrollNext.InfiniteScrollNext;
});