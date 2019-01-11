import { NullRepeatStrategy, RepeatStrategy } from 'aurelia-templating-resources';
import { IVirtualRepeat } from './interfaces';

export class NullVirtualRepeatStrategy extends NullRepeatStrategy {
  instanceMutated() {

  }

  instanceChanged(repeat: IVirtualRepeat) {
    super.instanceChanged(repeat);
    repeat._resetCalculation();
  }
}
