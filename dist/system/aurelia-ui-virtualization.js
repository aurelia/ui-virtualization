'use strict';

System.register(['./virtual-repeat'], function (_export, _context) {
  "use strict";

  var VirtualRepeat;
  return {
    setters: [function (_virtualRepeat) {
      VirtualRepeat = _virtualRepeat.VirtualRepeat;
    }],
    execute: function () {
      function configure(config) {
        config.globalResources('./virtual-repeat');
      }

      _export('configure', configure);

      _export('VirtualRepeat', VirtualRepeat);
    }
  };
});