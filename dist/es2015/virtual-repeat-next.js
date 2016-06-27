var _dec, _class;

import { customAttribute } from 'aurelia-templating';

export let VirtualRepeatNext = (_dec = customAttribute('virtual-repeat-next'), _dec(_class = class VirtualRepeatNext {

    constructor() {}

    attached() {}

    bind(bindingContext, overrideContext) {
        this.scope = { bindingContext, overrideContext };
    }

}) || _class);