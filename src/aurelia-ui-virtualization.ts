import { VirtualRepeat } from './virtual-repeat';
import { InfiniteScrollNext } from './infinite-scroll-next';

export function configure(config: { globalResources(...args: any[]): any; }) {
  config.globalResources(
    VirtualRepeat,
    InfiniteScrollNext
  );
}

export {
  VirtualRepeat,
  InfiniteScrollNext
};

export {
  IScrollNextScrollContext,
  VirtualizationEvents
} from './interfaces';
