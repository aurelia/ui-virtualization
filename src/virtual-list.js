import {bindable} from 'aurelia-templating';

export class VirtualList {
    @bindable items

    bind(bindingContext, overrideContext){
      this.$parent = bindingContext;
    }
}
