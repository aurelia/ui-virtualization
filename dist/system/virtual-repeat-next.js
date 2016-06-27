'use strict';

System.register(['aurelia-templating'], function (_export, _context) {
    "use strict";

    var customAttribute, _dec, _class, VirtualRepeatNext;

    

    return {
        setters: [function (_aureliaTemplating) {
            customAttribute = _aureliaTemplating.customAttribute;
        }],
        execute: function () {
            _export('VirtualRepeatNext', VirtualRepeatNext = (_dec = customAttribute('virtual-repeat-next'), _dec(_class = function () {
                function VirtualRepeatNext() {
                    
                }

                VirtualRepeatNext.prototype.attached = function attached() {};

                VirtualRepeatNext.prototype.bind = function bind(bindingContext, overrideContext) {
                    this.scope = { bindingContext: bindingContext, overrideContext: overrideContext };
                };

                return VirtualRepeatNext;
            }()) || _class));

            _export('VirtualRepeatNext', VirtualRepeatNext);
        }
    };
});