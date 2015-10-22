System.register(['./virtual-repeat', './virtual-list'], function (_export) {
  'use strict';

  var VirtualRepeat, VirtualList;

  _export('configure', configure);

  function configure(config) {
    config.globalResources('./virtual-repeat', './virtual-list');
  }

  return {
    setters: [function (_virtualRepeat) {
      VirtualRepeat = _virtualRepeat.VirtualRepeat;
    }, function (_virtualList) {
      VirtualList = _virtualList.VirtualList;
    }],
    execute: function () {
      _export('VirtualRepeat', VirtualRepeat);

      _export('VirtualList', VirtualList);
    }
  };
});