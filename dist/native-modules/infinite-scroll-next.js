var _dec, _class;



import { customAttribute } from 'aurelia-templating';

export var InfiniteScrollNext = (_dec = customAttribute('infinite-scroll-next'), _dec(_class = function () {
  function InfiniteScrollNext() {
    
  }

  InfiniteScrollNext.prototype.attached = function attached() {};

  InfiniteScrollNext.prototype.bind = function bind(bindingContext, overrideContext) {
    this.scope = { bindingContext: bindingContext, overrideContext: overrideContext };
  };

  return InfiniteScrollNext;
}()) || _class);