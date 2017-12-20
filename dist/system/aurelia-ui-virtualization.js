'use strict';

System.register(['aurelia-pal', './virtual-repeat', './infinite-scroll-next'], function (_export, _context) {
  "use strict";

  var PLATFORM, VirtualRepeat, InfiniteScrollNext;
  function configure(config) {
    config.globalResources(PLATFORM.moduleName('./virtual-repeat'), PLATFORM.moduleName('./infinite-scroll-next'));
  }

  _export('configure', configure);

  return {
    setters: [function (_aureliaPal) {
      PLATFORM = _aureliaPal.PLATFORM;
    }, function (_virtualRepeat) {
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