import { RepeatStrategyLocator, RepeatStrategy } from 'aurelia-templating-resources';
import { ArrayVirtualRepeatStrategy } from './array-virtual-repeat-strategy';
import { NullVirtualRepeatStrategy } from './null-virtual-repeat-strategy';
import { IVirtualRepeatStrategy } from './interfaces';

export class VirtualRepeatStrategyLocator extends RepeatStrategyLocator {

  /**@internal */
  private matchers: Array<(items: any) => boolean>;
  /**@internal */
  private strategies: RepeatStrategy[];

  constructor() {
    super();
    this.matchers = [];
    this.strategies = [];

    this.addStrategy(items => items === null || items === undefined, new NullVirtualRepeatStrategy());
    this.addStrategy(items => items instanceof Array, new ArrayVirtualRepeatStrategy());
  }

  getStrategy(items: any): IVirtualRepeatStrategy {
    return super.getStrategy(items) as IVirtualRepeatStrategy;
  }
}
