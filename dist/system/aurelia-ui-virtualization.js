'use strict';

System.register(['./virtual-repeat', './virtual-repeat-next'], function (_export, _context) {
  "use strict";

  var VirtualRepeat, VirtualRepeatNext;
  return {
    setters: [function (_virtualRepeat) {
      VirtualRepeat = _virtualRepeat.VirtualRepeat;
    }, function (_virtualRepeatNext) {
      VirtualRepeatNext = _virtualRepeatNext.VirtualRepeatNext;
    }],
    execute: function () {
      function configure(config) {
        config.globalResources('./virtual-repeat', './virtual-repeat-next');
      }

      _export('configure', configure);

      _export('VirtualRepeat', VirtualRepeat);

      _export('VirtualRepeatNext', VirtualRepeatNext);
    }
  };
});