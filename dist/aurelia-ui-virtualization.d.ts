import {
  customAttribute,
  View,
  BoundViewFactory,
  ViewSlot,
  ViewResources,
  TargetInstruction,
  bindable,
  templateController
} from 'aurelia-templating';
import {
  updateOverrideContext,
  ArrayRepeatStrategy,
  createFullOverrideContext,
  RepeatStrategyLocator,
  AbstractRepeater,
  getItemsSourceExpression,
  isOneTime,
  unwrapExpression,
  updateOneTimeBinding,
  viewsRequireLifecycle
} from 'aurelia-templating-resources';
import {
  inject,
  Container
} from 'aurelia-dependency-injection';
import {
  DOM
} from 'aurelia-pal';
import {
  ObserverLocator
} from 'aurelia-binding';
export declare interface TemplateStrategy {
  getScrollContainer(element: Element): Element;
  moveViewFirst(view: View, topBuffer: Element): void;
  moveViewLast(view: View, bottomBuffer: Element): void;
  createTopBufferElement(element: Element): Element;
  createBottomBufferElement(element: Element): Element;
  removeBufferElements(element: Element, topBuffer: Element, bottomBuffer: Element): void;
  getFirstElement(topBuffer: Element): Element;
  getLastView(bottomBuffer: Element): Element;
  getTopBufferDistance(topBuffer: Element): number;
}
export declare class DomHelper {
  getElementDistanceToTopOfDocument(element: Element): number;
  hasOverflowScroll(element: Element): boolean;
}

//Placeholder attribute to prohibit use of this attribute name in other places
export declare class InfiniteScrollNext {
  constructor();
  attached(): any;
  bind(bindingContext?: any, overrideContext?: any): void;
}
export declare function calcOuterHeight(element: Element): number;
export declare function insertBeforeNode(view: View, bottomBuffer: number): void;

/**
* Update the override context.
* @param startIndex index in collection where to start updating.
*/
export declare function updateVirtualOverrideContexts(repeat: VirtualRepeat, startIndex: number): void;
export declare function rebindAndMoveView(repeat: VirtualRepeat, view: View, index: number, moveToBottom: boolean): void;
export declare function getStyleValue(element: Element, style: string): any;
export declare function getElementDistanceToBottomViewPort(element: Element): number;
export declare function getElementDistanceToTopViewPort(element: Element): number;

/**
* A strategy for repeating a template over an array.
*/
export declare class ArrayVirtualRepeatStrategy extends ArrayRepeatStrategy {
  
  // create first item to calculate the heights
  createFirstItem(repeat: VirtualRepeat): void;
  
  /**
    * Handle the repeat's collection instance changing.
    * @param repeat The repeater instance.
    * @param items The new array instance.
    */
  instanceChanged(repeat: VirtualRepeat, items: Array<any>): void;
  
  /**
    * Handle the repeat's collection instance mutating.
    * @param repeat The repeat instance.
    * @param array The modified array.
    * @param splices Records of array changes.
    */
  instanceMutated(repeat: VirtualRepeat, array: Array<any>, splices: any): void;
}
export declare class TemplateStrategyLocator {
  constructor(container: Container);
  getStrategy(element: Element): TemplateStrategy;
}
export declare class TableStrategy {
  tableCssReset: any;
  constructor(domHelper?: any);
  getScrollContainer(element: Element): Element;
  moveViewFirst(view: View, topBuffer: Element): void;
  moveViewLast(view: View, bottomBuffer: Element): void;
  createTopBufferElement(element: Element): Element;
  createBottomBufferElement(element: Element): Element;
  removeBufferElements(element: Element, topBuffer: Element, bottomBuffer: Element): void;
  getFirstElement(topBuffer: Element): Element;
  getLastElement(bottomBuffer: Element): Element;
  getTopBufferDistance(topBuffer: Element): number;
}
export declare class DefaultTemplateStrategy {
  getScrollContainer(element: Element): Element;
  moveViewFirst(view: View, topBuffer: Element): void;
  moveViewLast(view: View, bottomBuffer: Element): void;
  createTopBufferElement(element: Element): Element;
  createBottomBufferElement(element: Element): Element;
  removeBufferElements(element: Element, topBuffer: Element, bottomBuffer: Element): void;
  getFirstElement(topBuffer: Element): Element;
  getLastElement(bottomBuffer: Element): Element;
  getTopBufferDistance(topBuffer: Element): number;
}
export declare class VirtualRepeatStrategyLocator extends RepeatStrategyLocator {
  constructor();
}
export declare class VirtualRepeat extends AbstractRepeater {
  items: any;
  local: any;
  constructor(element: Element, viewFactory: BoundViewFactory, instruction: TargetInstruction, viewSlot: ViewSlot, viewResources: ViewResources, observerLocator: ObserverLocator, strategyLocator: VirtualRepeatStrategyLocator, templateStrategyLocator: TemplateStrategyLocator, domHelper: DomHelper);
  attached(): void;
  bind(bindingContext?: any, overrideContext?: any): void;
  call(context?: any, changes?: any): void;
  detached(): void;
  itemsChanged(): void;
  unbind(): void;
  handleCollectionMutated(collection?: any, changes?: any): void;
  handleInnerCollectionMutated(collection?: any, changes?: any): void;
  
  // @override AbstractRepeater
  viewCount(): any;
  views(): any;
  view(index?: any): any;
  addView(bindingContext?: any, overrideContext?: any): any;
  insertView(index?: any, bindingContext?: any, overrideContext?: any): any;
  removeAllViews(returnToCache?: any, skipAnimation?: any): any;
  removeView(index?: any, returnToCache?: any, skipAnimation?: any): any;
  updateBindings(view: View): any;
}