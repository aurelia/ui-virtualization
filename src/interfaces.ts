import { Repeat, RepeatStrategy } from 'aurelia-templating-resources';
import { ViewSlot, View, ViewFactory, BoundViewFactory, Controller } from 'aurelia-templating';
import { Scope, Binding } from 'aurelia-binding';
import { ITemplateStrategy } from './template-strategy';
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
    boundProperties: { binding: Binding }[]
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

  /**@internal */
  _first: number;
  
  /**@internal */
  _previousFirst: number;
  
  /**@internal */
  _viewsLength: number;
  
  /**@internal */
  _lastRebind: number;
  
  /**@internal */
  _topBufferHeight: number;
  
  /**@internal */
  _bottomBufferHeight: number;
  
  /**@internal */
  _bufferSize: number;
  
  /**@internal */
  _scrollingDown: boolean;
  
  /**@internal */
  _scrollingUp: boolean;
  
  /**@internal */
  _switchedDirection: boolean;
  
  /**@internal */
  _isAttached: boolean;
  
  /**@internal */
  _ticking: boolean;
  
  /**@internal */
  _fixedHeightContainer: boolean;
  
  /**@internal */
  _hasCalculatedSizes: boolean;
  
  /**@internal */
  _isAtTop: boolean;
  
  /**@internal */
  _calledGetMore: boolean;

  /**@internal */
  viewSlot: ViewSlot & { children: (View & Scope)[] };

  itemHeight: number;

  strategy: IVirtualRepeatStrategy;

  templateStrategy: ITemplateStrategy;

  topBuffer: Element;
  bottomBuffer: Element;

  isLastIndex: boolean;

  readonly viewFactory: BoundViewFactory;

  _adjustBufferHeights(): void;

  _calcInitialHeights(itemsLength: number): void;

  _getIndexOfFirstView(): number;

  _getLastViewItem(): any;

  _resetCalculation(): void;

  // Array repeat specific properties
  __queuedSplices: any[];
  __array: any[];
}
