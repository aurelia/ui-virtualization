import { Binding, Scope, ICollectionObserverSplice } from 'aurelia-binding';
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
   * @override
   * Handle the repeat's collection instance changing.
   * @param repeat The repeater instance.
   * @param items The new array instance.
   */
  instanceChanged(repeat: VirtualRepeat, items: any[], ...rest: any[]): void;

  /**
   * @override
   * Handle the repeat's collection instance mutating.
   * @param repeat The virtual repeat instance.
   * @param array The modified array.
   * @param splices Records of array changes.
   */
  instanceMutated(repeat: VirtualRepeat, array: any[], splices: ICollectionObserverSplice[]): void;
}

/**
 * Templating strategy to handle virtual repeat views
 * Typically related to moving views, creating buffer and locating view range range in the DOM
 */
export interface ITemplateStrategy {
  /**
   * Determine the scroll container of a [repeat] based on its anchor (`element` is a comment node)
   */
  getScrollContainer(element: Element): HTMLElement;
  moveViewFirst(view: View, topBuffer: Element): void;
  moveViewLast(view: View, bottomBuffer: Element): void;
  /**
   * Create top and bottom buffer elements for an anchor (`element` is a comment node)
   */
  createBuffers(element: Element): [HTMLElement, HTMLElement];
  removeBufferElements(element: Element, topBuffer: Element, bottomBuffer: Element): void;
  getFirstElement(topBuffer: Element): Element;
  getLastElement(bottomBuffer: Element): Element;
  /**
   * Distance of top buffer to the top of its offseting parent
   */
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

/**
 * Object with information about current state of a scrollable element
 * Capturing:
 * - current scroll height
 * - current scroll top
 * - real height
 */
export interface IScrollerInfo {
  scrollHeight: number;
  scrollTop: number;
  height: number;
}

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
