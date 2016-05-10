import { RepeatStrategyLocator } from 'aurelia-templating-resources';
import { ArrayVirtualRepeatStrategy } from './array-virtual-repeat-strategy';

export let VirtualRepeatStrategyLocator = class VirtualRepeatStrategyLocator extends RepeatStrategyLocator {
  constructor() {
    super();
    this.matchers = [];
    this.strategies = [];

    this.addStrategy(items => items instanceof Array, new ArrayVirtualRepeatStrategy());
  }
};