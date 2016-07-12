'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.VirtualRepeatNext = exports.VirtualRepeat = undefined;
exports.configure = configure;

var _virtualRepeat = require('./virtual-repeat');

var _virtualRepeatNext = require('./virtual-repeat-next');

function configure(config) {
  config.globalResources('./virtual-repeat', './virtual-repeat-next');
}

exports.VirtualRepeat = _virtualRepeat.VirtualRepeat;
exports.VirtualRepeatNext = _virtualRepeatNext.VirtualRepeatNext;