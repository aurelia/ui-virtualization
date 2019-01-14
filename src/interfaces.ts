import { Repeat, RepeatStrategy } from 'aurelia-templating-resources';
import { ViewSlot, View, ViewFactory, BoundViewFactory, Controller } from 'aurelia-templating';
import { Scope, Binding } from 'aurelia-binding';
import { TaskQueue } from 'aurelia-task-queue';

/**@internal */
declare module 'aurelia-binding' {
  interface ObserverLocator {
    taskQueue: TaskQueue;
  }

  interface OverrideContext {
    $index: number;
    $scrollContext: {
      topIndex: number;
      isAtBottom: boolean;
      isAtTop: boolean;
    };
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
  createFirstItem(repeat: IVirtualRepeat): void;
    /**
  * Handle the repeat's collection instance changing.
  * @param repeat The repeater instance.
  * @param items The new array instance.
  */
  instanceChanged(repeat: IVirtualRepeat, items: Array<any>, ...rest: any[]): void;
}

export interface IVirtualRepeat extends Repeat {

  /**@internal */ _first: number;

  /**@internal */ _previousFirst: number;

  /**@internal */ _viewsLength: number;

  /**@internal */ _lastRebind: number;

  /**@internal */ _topBufferHeight: number;

  /**@internal */ _bottomBufferHeight: number;

  /**@internal */ _bufferSize: number;

  /**@internal */ _scrollingDown: boolean;

  /**@internal */ _scrollingUp: boolean;

  /**@internal */ _switchedDirection: boolean;

  /**@internal */ _isAttached: boolean;

  /**@internal */ _ticking: boolean;

  /**@internal */ _fixedHeightContainer: boolean;

  /**@internal */ _hasCalculatedSizes: boolean;

  /**@internal */ _isAtTop: boolean;

  /**@internal */ _calledGetMore: boolean;

  /**@internal */ viewSlot: ViewSlot & { children: (View & Scope)[] };

  itemHeight: number;

  strategy: IVirtualRepeatStrategy;

  templateStrategy: ITemplateStrategy;

  topBuffer: HTMLElement;
  bottomBuffer: HTMLElement;

  isLastIndex: boolean;

  readonly viewFactory: BoundViewFactory;

  /**@internal*/ _adjustBufferHeights(): void;

  /**@internal*/ _calcInitialHeights(itemsLength: number): void;

  /**@internal*/ _getIndexOfFirstView(): number;

  /**@internal*/ _getLastViewItem(): any;

  /**
   * Set all calculation to default state
   */
  resetCalculation(): void;

  // Array repeat specific properties
  /**@internal*/ __queuedSplices: any[];
  /**@internal*/ __array: any[];
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
