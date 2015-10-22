import {VirtualRepeat} from './virtual-repeat';
import {VirtualList} from './virtual-list';

export function configure(config){
  config.globalResources(
    './virtual-repeat',
    './virtual-list'
  );
}

export {
  VirtualRepeat,
  VirtualList
};
