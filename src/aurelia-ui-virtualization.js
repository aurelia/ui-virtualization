import {VirtualRepeat} from './virtual-repeat';
import {InfiniteScrollNext} from './infinite-scroll-next';

export function configure(config) {
  config.globalResources(
    './virtual-repeat',
    './infinite-scroll-next'
  );
}

export {
  VirtualRepeat,
  InfiniteScrollNext
};
