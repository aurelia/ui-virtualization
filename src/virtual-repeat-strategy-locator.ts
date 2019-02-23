import { ArrayVirtualRepeatStrategy } from './array-virtual-repeat-strategy';
import { IVirtualRepeatStrategy } from './interfaces';
import { NullVirtualRepeatStrategy } from './null-virtual-repeat-strategy';

/**
 * Locates the best strategy to best repeating a template over different types of collections.
 * Custom strategies can be plugged in as well.
 */
export class VirtualRepeatStrategyLocator {

  /**@internal */
  private matchers: Array<(items: any) => boolean>;
  /**@internal */
  private strategies: IVirtualRepeatStrategy[];

  constructor() {
    this.matchers = [];
    this.strategies = [];

    this.addStrategy(items => items === null || items === undefined, new NullVirtualRepeatStrategy());
    this.addStrategy(items => items instanceof Array, new ArrayVirtualRepeatStrategy());
  }

  /**
   * Adds a repeat strategy to be located when repeating a template over different collection types.
   * @param strategy A repeat strategy that can iterate a specific collection type.
   */
  addStrategy(matcher: (items: any) => boolean, strategy: IVirtualRepeatStrategy): void {
    this.matchers.push(matcher);
    this.strategies.push(strategy);
  }

  /**
   * Gets the best strategy to handle iteration.
   */
  getStrategy(items: any): IVirtualRepeatStrategy {
    let matchers = this.matchers;

    for (let i = 0, ii = matchers.length; i < ii; ++i) {
      if (matchers[i](items)) {
        return this.strategies[i];
      }
    }

    return null;
  }
}
