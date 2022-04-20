/* eslint-disable @typescript-eslint/no-unused-vars */
import { NullRepeatStrategy } from 'aurelia-templating-resources';
import { VirtualRepeat } from './virtual-repeat';
import { IVirtualRepeatStrategy, IView, VirtualizationCalculation, IScrollerInfo } from './interfaces';

export class NullVirtualRepeatStrategy extends NullRepeatStrategy implements IVirtualRepeatStrategy {

  // a violation of base contract, won't work in strict mode
  // todo: fix this API design
  createFirstRow(): IView | null {
    return null;
  }

  count(items: any) {
    return 0;
  }

  getViewRange(repeat: VirtualRepeat, scrollerInfo: IScrollerInfo): [number, number] {
    return [0, 0];
  }

  updateBuffers(repeat: VirtualRepeat, firstIndex: number): void {/*empty*/}

  onAttached() {/*empty*/}

  isNearTop(): boolean {
    return false;
  }

  isNearBottom(): boolean {
    return false;
  }

  initCalculation(repeat: VirtualRepeat, items: any): VirtualizationCalculation {
    repeat.itemHeight
      = repeat.minViewsRequired
      // = repeat._viewsLength
      = 0;
    // null/undefined virtual repeat strategy does not require any calculation
    // returning has_sizing to signal that
    return VirtualizationCalculation.has_sizing;
  }

  instanceMutated() {/*empty*/}

  instanceChanged(repeat: VirtualRepeat): void {
    repeat.removeAllViews(/**return to cache?*/true, /**skip animation?*/false);
    repeat.resetCalculation();
  }

  remeasure(repeat: VirtualRepeat): void {/*empty*/}

  updateAllViews(): void {/*empty*/}

  getCollectionObserver(observerLocator: any, items: any): any {
    // empty
  }
}
