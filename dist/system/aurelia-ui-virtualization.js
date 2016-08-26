'use strict';

System.register(['./virtual-repeat', './infinite-scroll-next'], function (_export, _context) {
  "use strict";

  var VirtualRepeat, InfiniteScrollNext;
  function configure(config) {
    config.globalResources('./virtual-repeat', './infinite-scroll-next');
  }

  _export('configure', configure);

  return {
    setters: [function (_virtualRepeat) {
      VirtualRepeat = _virtualRepeat.VirtualRepeat;
    }, function (_infiniteScrollNext) {
      InfiniteScrollNext = _infiniteScrollNext.InfiniteScrollNext;
    }],
    execute: function () {
      _export('VirtualRepeat', VirtualRepeat);

      _export('InfiniteScrollNext', InfiniteScrollNext);
    }
  };
});