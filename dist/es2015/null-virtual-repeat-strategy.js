import { NullRepeatStrategy } from 'aurelia-templating-resources';

export let NullVirtualRepeatStrategy = class NullVirtualRepeatStrategy extends NullRepeatStrategy {
  instanceChanged(repeat) {
    super.instanceChanged(repeat);
    repeat._resetCalculation();
  }
};