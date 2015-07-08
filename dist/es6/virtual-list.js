import {bindable} from 'aurelia-templating';

export class VirtualList {
    @bindable items

    bind(context){
      this.$parent = context;
    }
}
