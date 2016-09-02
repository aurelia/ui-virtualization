import {customAttribute} from 'aurelia-templating';

//Placeholder attribute to prohibit use of this attribute name in other places

@customAttribute('infinite-scroll-next')
export class InfiniteScrollNext {

  constructor() {}

  attached() {}

  bind(bindingContext, overrideContext): void {
    this.scope = { bindingContext, overrideContext };
  }

}
