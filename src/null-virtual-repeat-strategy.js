import { NullRepeatStrategy } from "aurelia-templating-resources";

export class NullVirtualRepeatStrategy extends NullRepeatStrategy {
  instanceChanged(repeat) {
    super.instanceChanged(repeat);
    repeat._resetCalculation();
  }
}
