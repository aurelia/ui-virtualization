import { NullRepeatStrategy, RepeatStrategy } from 'aurelia-templating-resources';
import { VirtualRepeat } from './virtual-repeat';
import { IVirtualRepeatStrategy } from './interfaces';


export class NullVirtualRepeatStrategy extends NullRepeatStrategy implements IVirtualRepeatStrategy {
  
  createFirstItem() {/**/}

  instanceMutated() {/**/}

  instanceChanged(repeat: VirtualRepeat): void {
    repeat.removeAllViews(/**return to cache?*/true, /**skip animation?*/false);
    repeat._resetCalculation();
  }

  onScroll() {}
}
