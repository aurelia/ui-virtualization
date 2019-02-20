import { NullRepeatStrategy } from 'aurelia-templating-resources';
import { VirtualRepeat } from './virtual-repeat';

export class NullVirtualRepeatStrategy extends NullRepeatStrategy {
  instanceMutated() {
    // empty
  }

  instanceChanged(repeat: VirtualRepeat) {
    super.instanceChanged(repeat);
    repeat._resetCalculation();
  }
}
