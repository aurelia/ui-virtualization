import { VirtualRepeat } from './virtual-repeat';
import { VirtualRepeatNext } from './virtual-repeat-next';

export function configure(config) {
  config.globalResources('./virtual-repeat', './virtual-repeat-next');
}

export { VirtualRepeat, VirtualRepeatNext };