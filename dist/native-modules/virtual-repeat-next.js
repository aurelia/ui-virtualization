var _dec, _class;



import { customAttribute } from 'aurelia-templating';

export var VirtualRepeatNext = (_dec = customAttribute('virtual-repeat-next'), _dec(_class = function () {
    function VirtualRepeatNext() {
        
    }

    VirtualRepeatNext.prototype.attached = function attached() {};

    VirtualRepeatNext.prototype.bind = function bind(bindingContext, overrideContext) {
        this.scope = { bindingContext: bindingContext, overrideContext: overrideContext };
    };

    return VirtualRepeatNext;
}()) || _class);