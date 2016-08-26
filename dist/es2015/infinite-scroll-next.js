var _dec, _class;

import { customAttribute } from 'aurelia-templating';

export let InfiniteScrollNext = (_dec = customAttribute('infinite-scroll-next'), _dec(_class = class InfiniteScrollNext {

  constructor() {}

  attached() {}

  bind(bindingContext, overrideContext) {
    this.scope = { bindingContext, overrideContext };
  }

}) || _class);