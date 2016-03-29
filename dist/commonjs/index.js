'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.VirtualRepeat = undefined;
exports.configure = configure;

var _virtualRepeat = require('./virtual-repeat');

function configure(config) {
  config.globalResources('./virtual-repeat');
}

exports.VirtualRepeat = _virtualRepeat.VirtualRepeat;