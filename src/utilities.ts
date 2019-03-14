import { updateOverrideContext } from 'aurelia-templating-resources';
import { View } from 'aurelia-templating';
import { VirtualRepeat } from './virtual-repeat';
import { IView } from './interfaces';

/**
 * Get total value of a list of css style property on an element
 */
export const getStyleValues = (element: Element, ...styles: string[]): number => {
  let currentStyle = window.getComputedStyle(element);
  let value: number = 0;
  let styleValue: number = 0;
  for (let i = 0, ii = styles.length; ii > i; ++i) {
    styleValue = parseInt(currentStyle[styles[i]], 10);
    value += $isNaN(styleValue) ? 0 : styleValue;
  }
  return value;
};

export const calcOuterHeight = (element: Element): number => {
  let height = element.getBoundingClientRect().height;
  height += getStyleValues(element, 'marginTop', 'marginBottom');
  return height;
};

export const insertBeforeNode = (view: View, bottomBuffer: Element): void => {
  // todo: account for anchor comment
  bottomBuffer.parentNode.insertBefore(view.lastChild, bottomBuffer);
};

/**
* Update the override context.
* @param startIndex index in collection where to start updating.
*/
export const updateVirtualOverrideContexts = (repeat: VirtualRepeat, startIndex: number): void => {
  const views = repeat.viewSlot.children;
  const viewLength = views.length;
  const collectionLength = repeat.items.length;

  if (startIndex > 0) {
    startIndex = startIndex - 1;
  }

  const delta = repeat._topBufferHeight / repeat.itemHeight;

  for (; viewLength > startIndex; ++startIndex) {
    updateOverrideContext(views[startIndex].overrideContext, startIndex + delta, collectionLength);
  }
};

export const updateAllViews = (repeat: VirtualRepeat, startIndex: number): void => {
  const views = repeat.viewSlot.children;
  const viewLength = views.length;
  const collection = repeat.items;

  const delta = Math$floor(repeat._topBufferHeight / repeat.itemHeight);
  let collectionIndex = 0;
  let view;

  for (; viewLength > startIndex; ++startIndex) {
    collectionIndex = startIndex + delta;
    view = repeat.view(startIndex);
    rebindView(repeat, view, collectionIndex, collection);
    repeat.updateBindings(view);
  }
};

export const rebindView = (repeat: VirtualRepeat, view: IView, collectionIndex: number, collection: any[]): void => {
  view.bindingContext[repeat.local] = collection[collectionIndex];
  updateOverrideContext(view.overrideContext, collectionIndex, collection.length);
};

export const rebindAndMoveView = (repeat: VirtualRepeat, view: View, index: number, moveToBottom: boolean): void => {
  const items = repeat.items;
  const viewSlot = repeat.viewSlot;

  updateOverrideContext(view.overrideContext, index, items.length);
  view.bindingContext[repeat.local] = items[index];
  if (moveToBottom) {
    viewSlot.children.push(viewSlot.children.shift());
    repeat.templateStrategy.moveViewLast(view, repeat.bottomBufferEl);
  } else {
    viewSlot.children.unshift(viewSlot.children.splice(-1, 1)[0]);
    repeat.templateStrategy.moveViewFirst(view, repeat.topBufferEl);
  }
};


export const getElementDistanceToBottomViewPort = (element: Element): number => {
  return document.documentElement.clientHeight - element.getBoundingClientRect().bottom;
};

export const Math$abs = Math.abs;
export const Math$max = Math.max;
export const Math$min = Math.min;
export const Math$round = Math.round;
export const Math$ceil = Math.ceil;
export const Math$floor = Math.floor;
export const $isNaN = isNaN;
