import { OverrideContext, Scope } from 'aurelia-binding';

//Placeholder attribute to prohibit use of this attribute name in other places
export class InfiniteScrollNext {

  static $resource = {
    type: 'attribute',
    name: 'infinite-scroll-next'
  }

  scope: Scope;

  bind(bindingContext: any, overrideContext: OverrideContext): void {
    this.scope = { bindingContext, overrideContext };
  }

  unbind() {
    this.scope = undefined;
  }
}
