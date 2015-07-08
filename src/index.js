import {VirtualRepeat} from './virtual-repeat';
import {VirtualList} from './virtual-list';

export function configure(aurelia){
  aurelia.globalizeResources(
    './virtual-repeat',
    './virtual-list'
  );
}

export {
  VirtualRepeat,
  VirtualList
};
