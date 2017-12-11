import {PLATFORM} from 'aurelia-pal'
import {VirtualRepeat} from './virtual-repeat';
import {InfiniteScrollNext} from './infinite-scroll-next';

export function configure(config) {
  config.globalResources(
    PLATFORM.moduleName('./virtual-repeat'),
    PLATFORM.moduleName('./infinite-scroll-next')
  );
}

export {
  VirtualRepeat,
  InfiniteScrollNext
};
