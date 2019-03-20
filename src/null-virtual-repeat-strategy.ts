import { NullRepeatStrategy, RepeatStrategy } from 'aurelia-templating-resources';
import { VirtualRepeat } from './virtual-repeat';
import { IVirtualRepeatStrategy, IView, VirtualizationCalculation } from './interfaces';

export class NullVirtualRepeatStrategy extends NullRepeatStrategy implements IVirtualRepeatStrategy {

  initCalculation(repeat: VirtualRepeat, items: any): VirtualizationCalculation {
    repeat.itemHeight
      = repeat.elementsInView
      = repeat._viewsLength = 0;
    // null/undefined virtual repeat strategy does not require any calculation
    // returning has_sizing to signal that
    return VirtualizationCalculation.has_sizing;
  }

  // a violation of base contract, won't work in strict mode
  // todo: fix this API design
  createFirstItem(): IView | null {
    return null;
  }

  instanceMutated() {/**/}

  instanceChanged(repeat: VirtualRepeat): void {
    repeat.removeAllViews(/**return to cache?*/true, /**skip animation?*/false);
    repeat._resetCalculation();
  }
}
