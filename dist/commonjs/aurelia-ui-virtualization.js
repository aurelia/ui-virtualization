'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.InfiniteScrollNext = exports.VirtualRepeat = undefined;
exports.configure = configure;

var _aureliaPal = require('aurelia-pal');

var _virtualRepeat = require('./virtual-repeat');

var _infiniteScrollNext = require('./infinite-scroll-next');

function configure(config) {
  config.globalResources(_aureliaPal.PLATFORM.moduleName('./virtual-repeat'), _aureliaPal.PLATFORM.moduleName('./infinite-scroll-next'));
}

exports.VirtualRepeat = _virtualRepeat.VirtualRepeat;
exports.InfiniteScrollNext = _infiniteScrollNext.InfiniteScrollNext;