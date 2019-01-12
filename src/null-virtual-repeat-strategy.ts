import { NullRepeatStrategy, RepeatStrategy } from 'aurelia-templating-resources';
import { IVirtualRepeat } from './interfaces';

export class NullVirtualRepeatStrategy extends NullRepeatStrategy {
  instanceMutated() {
    // empty
  }

  instanceChanged(repeat: IVirtualRepeat) {
    super.instanceChanged(repeat);
    repeat.resetCalculation();
  }
}
