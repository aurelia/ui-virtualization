import { NullRepeatStrategy, RepeatStrategy } from 'aurelia-templating-resources';
import { VirtualRepeat } from './virtual-repeat';
import { IVirtualRepeatStrategy, IView } from './interfaces';

export class NullVirtualRepeatStrategy extends NullRepeatStrategy implements IVirtualRepeatStrategy {

  initCalculation(repeat: VirtualRepeat, items: any) {
    repeat.elementsInView
      = repeat.itemHeight
      = repeat._viewsLength = 0;
    return false;
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
