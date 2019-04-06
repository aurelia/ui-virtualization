import { Binding, Scope, ICollectionObserverSplice, ObserverLocator, InternalCollectionObserver, OverrideContext } from 'aurelia-binding';
import { TaskQueue } from 'aurelia-task-queue';
import { View, ViewSlot, Controller } from 'aurelia-templating';
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
  createFirstRow(repeat: VirtualRepeat): IView;

  /**
   * Calculate required variables for a virtual repeat instance to operate properly
   *
   * @returns `false` to notify that calculation hasn't been finished
   */
  initCalculation(repeat: VirtualRepeat, items: number | any[] | Map<any, any> | Set<any>): VirtualizationCalculation;

  /**
   * Handle special initialization if any, depends on different strategy
   */
  onAttached(repeat: VirtualRepeat): void;

  /**
   * Calculate the start and end index of a repeat based on its container current scroll position
   */
  getViewRange(repeat: VirtualRepeat, scrollerInfo: IScrollerInfo): [number, number];

  /**
   * Returns true if first index is approaching start of the collection
   * Virtual repeat can use this to invoke infinite scroll next
   */
  isNearTop(repeat: VirtualRepeat, firstIndex: number): boolean;

  /**
   * Returns true if last index is approaching end of the collection
   * Virtual repeat can use this to invoke infinite scroll next
   */
  isNearBottom(repeat: VirtualRepeat, lastIndex: number): boolean;

  /**
   * Update repeat buffers height based on repeat.items
   */
  updateBuffers(repeat: VirtualRepeat, firstIndex: number): void;

  /**
   * Get the observer based on collection type of `items`
   */
  getCollectionObserver(observerLocator: ObserverLocator, items: any[] | Map<any, any> | Set<any>): InternalCollectionObserver;

  /**
   * @override
   * Handle the repeat's collection instance changing.
   * @param repeat The repeater instance.
   * @param items The new array instance.
   * @param firstIndex The index of first active view
   */
  instanceChanged(repeat: VirtualRepeat, items: any[] | Map<any, any> | Set<any>, firstIndex?: number): void;

  /**
   * @override
   * Handle the repeat's collection instance mutating.
   * @param repeat The virtual repeat instance.
   * @param array The modified array.
   * @param splices Records of array changes.
   */
  instanceMutated(repeat: VirtualRepeat, array: any[], splices: ICollectionObserverSplice[]): void;

  /**
   * Unlike normal repeat, virtualization repeat employs "padding" elements. Those elements
   * often are just blank block with proper height/width to adjust the height/width/scroll feeling
   * of virtualized repeat.
   *
   * Because of this, either mutation or change of the collection of repeat will potentially require
   * readjustment (or measurement) of those blank block, based on scroll position
   *
   * This is 2 phases scroll handle
   */
  remeasure(repeat: VirtualRepeat): void;
}

/**
 * Templating strategy to handle virtual repeat views
 * Typically related to moving views, creating buffer and locating view range range in the DOM
 */
export interface ITemplateStrategy {
  /**
   * Determine the scroll container of a [virtual-repeat] based on its anchor (`element` is a comment node)
   */
  getScrollContainer(element: Element): HTMLElement;
  /**
   * Move root element of a view to first position in the list, after top buffer
   * Note: [virtual-repeat] only supports single root node repeat
   */
  moveViewFirst(view: View, topBuffer: Element): void;
  /**
   * Move root element of a view to last position in the list, before bottomBuffer
   * Note: [virtual-repeat] only supports single root node repeat
   */
  moveViewLast(view: View, bottomBuffer: Element): void;
  /**
   * Create top and bottom buffer elements for an anchor (`element` is a comment node)
   */
  createBuffers(element: Element): [HTMLElement, HTMLElement];
  /**
   * Clean up buffers of a [virtual-repeat]
   */
  removeBuffers(element: Element, topBuffer: Element, bottomBuffer: Element): void;
  /**
   * Get the first element(or view) between top buffer and bottom buffer
   * Note: [virtual-repeat] only supports single root node repeat
   */
  getFirstElement(topBufer: Element, botBuffer: Element): Element;
  /**
   * Get the last element(or view) between top buffer and bottom buffer
   * Note: [virtual-repeat] only supports single root node repeat
   */
  getLastElement(topBuffer: Element, bottomBuffer: Element): Element;
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
 * Ability to have strong typings on bindingContext for OverrideContext
 */
export interface IOverrideContext<T> extends OverrideContext {
  bindingContext: T;
}

/**
 * Object with information about current state of a scrollable element
 * Capturing:
 * - current scroll height
 * - current scroll top
 * - real height
 */
export interface IScrollerInfo {
  scroller: HTMLElement;
  // scrollHeight: number;
  scrollTop: number;
  height: number;
}

export const enum VirtualizationCalculation {
  none              = 0b0_00000,
  reset             = 0b0_00001,
  has_sizing        = 0b0_00010,
  observe_scroller  = 0b0_00100
}

export interface IElement {
  au: {
    controller: Controller;
    [key: string]: any;
  };
}

/**
 * List of events that can be used to notify virtual repeat that size has changed
 */
export const VirtualizationEvents = Object.assign(Object.create(null), {
  scrollerSizeChange: 'virtual-repeat-scroller-size-changed' as 'virtual-repeat-scroller-size-changed',
  itemSizeChange: 'virtual-repeat-item-size-changed' as 'virtual-repeat-item-size-changed'
}) as {
  scrollerSizeChange: 'virtual-repeat-scroller-size-changed';
  itemSizeChange: 'virtual-repeat-item-size-changed';
};

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
