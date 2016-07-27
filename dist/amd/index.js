define(['exports', './aurelia-ui-virtualization'], function (exports, _aureliaUiVirtualization) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.keys(_aureliaUiVirtualization).forEach(function (key) {
    if (key === "default" || key === "__esModule") return;
    Object.defineProperty(exports, key, {
      enumerable: true,
      get: function () {
        return _aureliaUiVirtualization[key];
      }
    });
  });
});