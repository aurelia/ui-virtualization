import {VirtualRepeat} from './virtual-repeat';
import {InfiniteScrollNext} from './infinite-scroll-next';

export function configure(config) {
  config.globalResources(
    VirtualRepeat,
    InfiniteScrollNext
  );
}

export {
  VirtualRepeat,
  InfiniteScrollNext
};
