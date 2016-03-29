declare module 'aurelia-ui-virtualization' {
  import {
    updateOverrideContext,
    createFullOverrideContext,
    getItemsSourceExpression,
    isOneTime,
    unwrapExpression,
    updateOneTimeBinding
  } from 'aurelia-templating-resources/repeat-utilities';
  import {
    ArrayRepeatStrategy
  } from 'aurelia-templating-resources/array-repeat-strategy';
  import {
    RepeatStrategyLocator
  } from 'aurelia-templating-resources/repeat-strategy-locator';
  import {
    inject
  } from 'aurelia-dependency-injection';
  import {
    ObserverLocator
  } from 'aurelia-binding';
  import {
    BoundViewFactory,
    ViewSlot,
    TargetInstruction,
    customAttribute,
    bindable,
    templateController
  } from 'aurelia-templating';
  import {
    AbstractRepeater
  } from 'aurelia-templating-resources';
  import {
    viewsRequireLifecycle
  } from 'aurelia-templating-resources/analyze-view-factory';
  export function calcOuterHeight(element: any): any;
  export function insertBeforeNode(view: any, bottomBuffer: any): any;
  
  /**
  * Update the override context.
  * @param startIndex index in collection where to start updating.
  */
  export function updateVirtualOverrideContexts(repeat: any, startIndex: any): any;
  export function rebindAndMoveView(repeat: VirtualRepeat, view: View, index: number, moveToBottom: boolean): void;
  export function getStyleValue(element: any, style: any): any;
  export function getElementDistanceToBottomViewPort(element: any): any;
  
  /**
  * A strategy for repeating a template over an array.
  */
  export class ArrayVirtualRepeatStrategy extends ArrayRepeatStrategy {
    
    // create first item to calculate the heights
    createFirstItem(repeat: any): any;
    
    /**
      * Handle the repeat's collection instance changing.
      * @param repeat The repeater instance.
      * @param items The new array instance.
      */
    instanceChanged(repeat: any, items: any): any;
    
    /**
      * Handle the repeat's collection instance mutating.
      * @param repeat The repeat instance.
      * @param array The modified array.
      * @param splices Records of array changes.
      */
    instanceMutated(repeat: any, array: any, splices: any): any;
  }
  export class ViewStrategyLocator {
    getStrategy(element: any): any;
  }
  export class TableStrategy {
    getScrollContainer(element: any): any;
    moveViewFirst(view: any, topBuffer: any): any;
    moveViewLast(view: any, bottomBuffer: any): any;
    createTopBufferElement(element: any): any;
    createBottomBufferElement(element: any): any;
    removeBufferElements(element: any, topBuffer: any, bottomBuffer: any): any;
  }
  export class DefaultStrategy {
    getScrollContainer(element: any): any;
    moveViewFirst(view: any, topBuffer: any): any;
    moveViewLast(view: any, bottomBuffer: any): any;
    createTopBufferElement(element: any): any;
    createBottomBufferElement(element: any): any;
    removeBufferElements(element: any, topBuffer: any, bottomBuffer: any): any;
  }
  export class VirtualRepeatStrategyLocator extends RepeatStrategyLocator {
    constructor();
  }
  export class VirtualRepeat extends AbstractRepeater {
    _first: any;
    _previousFirst: any;
    _viewsLength: any;
    _lastRebind: any;
    _topBufferHeight: any;
    _bottomBufferHeight: any;
    _bufferSize: any;
    _scrollingDown: any;
    _scrollingUp: any;
    _switchedDirection: any;
    _isAttached: any;
    _ticking: any;
    _fixedHeightContainer: any;
    _hasCalculatedSizes: any;
    _isAtTop: any;
    items: any;
    local: any;
    constructor(element: any, viewFactory: any, instruction: any, viewSlot: any, observerLocator: any, strategyLocator: any, viewStrategyLocator: any);
    attached(): any;
    bind(bindingContext: any, overrideContext: any): any;
    call(context: any, changes: any): any;
    detached(): any;
    itemsChanged(): any;
    unbind(): any;
    handleCollectionMutated(collection: any, changes: any): any;
    handleInnerCollectionMutated(collection: any, changes: any): any;
    
    // @override AbstractRepeater
    viewCount(): any;
    views(): any;
    view(index: any): any;
    addView(bindingContext: any, overrideContext: any): any;
    insertView(index: any, bindingContext: any, overrideContext: any): any;
    removeAllViews(returnToCache: any, skipAnimation: any): any;
    removeView(index: any, returnToCache: any, skipAnimation: any): any;
    updateBindings(view: View): any;
  }
}