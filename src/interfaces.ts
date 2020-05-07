import { Binding, Scope, ICollectionObserverSplice, ObserverLocator, InternalCollectionObserver, OverrideContext } from 'aurelia-binding';
import { TaskQueue } from 'aurelia-task-queue';
import { View, ViewSlot, Controller } from 'aurelia-templating';
import { RepeatStrategy, AbstractRepeater } from 'aurelia-templating-resources';
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

export interface IVirtualRepeater extends AbstractRepeater {

  items: any;

  local?: string;

  /**
   * First view index, for proper follow up calculations
   */
  $first: number;

  /**
   * Defines how many items there should be for a given index to be considered at edge
   */
  edgeDistance: number;

  /**
   * Template handling strategy for this repeat.
   */
  templateStrategy: ITemplateStrategy;

  /**
   * The element hosting the scrollbar for this repeater
   */
  scrollerEl: HTMLElement;

  /**
   * Top buffer element, used to reflect the visualization of amount of items `before` the first visible item
   * @internal
   */
  topBufferEl: HTMLElement;

  /**
   * Bot buffer element, used to reflect the visualization of amount of items `after` the first visible item
   */
  bottomBufferEl: HTMLElement;

  /**
   * Height of top buffer to properly push the visible rendered list items into right position
   * Usually determined by `_first` visible index * `itemHeight`
   */
  topBufferHeight: number;

  /**
   * Height of bottom buffer to properly push the visible rendered list items into right position
   */
  bottomBufferHeight: number;

  /**
   * Height of each item. Calculated based on first item
   */
  itemHeight: number;

  /**
   * Calculate current scrolltop position
   */
  distanceToTop: number;

  /**
   * Number indicating minimum elements required to render to fill up the visible viewport
   */
  minViewsRequired: number;

  // /**
  //  * Indicates whether virtual repeat attribute is inside a fixed height container with overflow
  //  *
  //  * This helps identifies place to add scroll event listener
  //  */
  // fixedHeightContainer: boolean;

  /**
   * ViewSlot that encapsulates the repeater views operations in the template
   */
  readonly viewSlot: ViewSlot;

  /**
   * Aurelia change handler by convention for property `items`. Used to properly determine action
   * needed when items value has been changed
   */
  itemsChanged(): void;

  /**
   * Get first visible view
   */
  firstView(): IView | null;

  /**
   * Get last visible view
   */
  lastView(): IView | null;

  /**
   * Get index of first visible view
   */
  firstViewIndex(): number;

  /**
   * Get index of last visible view
   */
  lastViewIndex(): number;

  /**
   * Virtual repeater normally employs scroll handling buffer for performance reasons.
   * As syncing between scrolling state and visible views could be expensive.
   */
  enableScroll(): void;

  /**
   * Invoke infinite scroll next function expression with currently bound scope of the repeater
   */
  getMore(topIndex: number, isNearTop: boolean, isNearBottom: boolean, force?: boolean): void;

  /**
   * Get the real scroller element of the DOM tree this repeat resides in
   */
  getScroller(): HTMLElement;

  /**
   * Get scrolling information of the real scroller element of the DOM tree this repeat resides in
   */
  getScrollerInfo(): IScrollerInfo;

  /**
   * Observe scroller element to react upon sizing changes
   */
  observeScroller(scrollerEl: HTMLElement): void;

  /**
   * Dispose scroller content size observer, if has
   * Dispose all event listeners related to sizing of scroller, if any
   */
  unobserveScroller(): void;

  /**
   * Signal the repeater to reset all its internal calculation states.
   * Typically used when items value is null, undefined, empty collection.
   * Or the repeater has been detached
   */
  resetCalculation(): void;

  /**
   * Update buffer elements height/width with corresponding
   * @param skipUpdate `true` to signal this repeater that the update won't trigger scroll event
   */
  updateBufferElements(skipUpdate?: boolean): void;
}

export interface IVirtualRepeatStrategy {
  /**
   * create first item to calculate the heights
   */
  createFirstRow(repeat: IVirtualRepeater): IView;

  /**
   * Calculate required variables for a virtual repeat instance to operate properly
   *
   * @returns `false` to notify that calculation hasn't been finished
   */
  initCalculation(repeat: IVirtualRepeater, items: number | any[] | Map<any, any> | Set<any>): VirtualizationCalculation;

  /**
   * Handle special initialization if any, depends on different strategy
   */
  onAttached(repeat: IVirtualRepeater): void;

  /**
   * Calculate the start and end index of a repeat based on its container current scroll position
   */
  getViewRange(repeat: IVirtualRepeater, scrollerInfo: IScrollerInfo): [number, number];

  /**
   * Returns true if first index is approaching start of the collection
   * Virtual repeat can use this to invoke infinite scroll next
   */
  isNearTop(repeat: IVirtualRepeater, firstIndex: number): boolean;

  /**
   * Returns true if last index is approaching end of the collection
   * Virtual repeat can use this to invoke infinite scroll next
   */
  isNearBottom(repeat: IVirtualRepeater, lastIndex: number): boolean;

  /**
   * Update repeat buffers height based on repeat.items
   */
  updateBuffers(repeat: IVirtualRepeater, firstIndex: number): void;

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
  instanceChanged(repeat: IVirtualRepeater, items: any[] | Map<any, any> | Set<any>, firstIndex?: number): void;

  /**
   * @override
   * Handle the repeat's collection instance mutating.
   * @param repeat The virtual repeat instance.
   * @param array The modified array.
   * @param splices Records of array changes.
   */
  instanceMutated(repeat: IVirtualRepeater, array: any[], splices: ICollectionObserverSplice[]): void;

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
  remeasure(repeat: IVirtualRepeater): void;

  /**
   * Update all visible views of a repeater, starting from given `startIndex`
   */
  updateAllViews(repeat: IVirtualRepeater, startIndex: number): void;
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

export const enum ScrollingState {
  none                          = 0,
  isScrollingDown               = 0b0_00001,
  isScrollingUp                 = 0b0_00010,
  isNearTop                     = 0b0_00100,
  isNearBottom                  = 0b0_01000,
  /**@internal */
  isScrollingDownAndNearBottom  = isScrollingDown | isNearBottom,
  /**@internal */
  isScrollingUpAndNearTop       = isScrollingUp | isNearTop
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
