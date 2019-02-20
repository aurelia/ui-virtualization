import { Binding, Scope } from 'aurelia-binding';
import { TaskQueue } from 'aurelia-task-queue';
import { View, ViewSlot } from 'aurelia-templating';
import { RepeatStrategy } from 'aurelia-templating-resources';
import { VirtualRepeat } from './virtual-repeat';

export interface IScrollNextScrollContext {
  topIndex: number;
  isAtBottom: boolean;
  isAtTop: boolean;
}

/**@internal */
declare module 'aurelia-binding' {
  interface ObserverLocator {
    taskQueue: TaskQueue;
  }

  interface OverrideContext {
    $index: number;
    $scrollContext: IScrollNextScrollContext;
    $first: boolean;
    $last: boolean;
    $middle: boolean;
    $odd: boolean;
    $even: boolean;
  }
}

/**@internal */
declare module 'aurelia-templating' {
  interface View {
    firstChild: Node & { au?: any };
    lastChild: Node & { au?: any };

    bindings: Binding[];

    controllers: Controller[];
  }

  interface Controller {
    boundProperties: { binding: Binding }[];
  }
}

export interface IVirtualRepeatStrategy extends RepeatStrategy {
  /**
   * create first item to calculate the heights
   */
  createFirstItem(repeat: VirtualRepeat): void;
    /**
  * Handle the repeat's collection instance changing.
  * @param repeat The repeater instance.
  * @param items The new array instance.
  */
  instanceChanged(repeat: VirtualRepeat, items: Array<any>, ...rest: any[]): void;
}

/**
 * Templating strategy to handle virtual repeat views
 * Typically related to moving views, creating buffer and locating view range range in the DOM
 */
export interface ITemplateStrategy {
  getScrollContainer(element: Element): HTMLElement;
  moveViewFirst(view: View, topBuffer: Element): void;
  moveViewLast(view: View, bottomBuffer: Element): void;
  createTopBufferElement(element: Element): HTMLElement;
  createBottomBufferElement(element: Element): HTMLElement;
  removeBufferElements(element: Element, topBuffer: Element, bottomBuffer: Element): void;
  getFirstElement(topBuffer: Element): Element;
  getLastElement(bottomBuffer: Element): Element;
  getTopBufferDistance(topBuffer: Element): number;
}

/**
 * Override `bindingContext` and `overrideContext` on `View` interface
 */
export type IView = View & Scope;

/**
 * Expose property `children` to help manipulation/calculation
 */
export type IViewSlot = ViewSlot & { children: IView[] };

// export const enum IVirtualRepeatState {
//   isAtTop = 0b0_000000_000,
//   isLastIndex = 0b0_000000_000,
//   scrollingDown = 0b0_000000_000,
//   scrollingUp = 0b0_000000_000,
//   switchedDirection = 0b0_000000_000,
//   isAttached = 0b0_000000_000,
//   ticking = 0b0_000000_000,
//   fixedHeightContainer = 0b0_000000_000,
//   hasCalculatedSizes = 0b0_000000_000,
//   calledGetMore = 0b0_000000_000,
//   skipNextScrollHandle = 0b0_000000_000,
//   handlingMutations = 0b0_000000_000,
//   isScrolling = 0b0_000000_000
// }
