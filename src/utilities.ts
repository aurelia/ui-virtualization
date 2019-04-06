import { updateOverrideContext } from 'aurelia-templating-resources';
import { VirtualRepeat } from './virtual-repeat';
import { IView, IVirtualRepeater, IViewSlot } from './interfaces';

/**
* Update the override context.
* @param startIndex index in collection where to start updating.
*/
export const updateVirtualOverrideContexts = (repeat: IVirtualRepeater, startIndex: number): void => {
  const views = (repeat.viewSlot as IViewSlot).children;
  const viewLength = views.length;
  const collectionLength = repeat.items.length;

  if (startIndex > 0) {
    startIndex = startIndex - 1;
  }

  const delta = repeat.topBufferHeight / repeat.itemHeight;

  for (; viewLength > startIndex; ++startIndex) {
    updateOverrideContext(views[startIndex].overrideContext, startIndex + delta, collectionLength);
  }
};

export const updateAllViews = (repeat: IVirtualRepeater, startIndex: number): void => {
  const views = (repeat.viewSlot as IViewSlot).children;
  const viewLength = views.length;
  const collection = repeat.items;

  const delta = Math$floor(repeat.topBufferHeight / repeat.itemHeight);
  let collectionIndex = 0;
  let view: IView;

  for (; viewLength > startIndex; ++startIndex) {
    collectionIndex = startIndex + delta;
    view = repeat.view(startIndex);
    rebindView(repeat, view, collectionIndex, collection);
    repeat.updateBindings(view);
  }
};

export const rebindView = (repeat: IVirtualRepeater, view: IView, collectionIndex: number, collection: any[]): void => {
  view.bindingContext[repeat.local] = collection[collectionIndex];
  updateOverrideContext(view.overrideContext, collectionIndex, collection.length);
};

export const rebindAndMoveView = (repeat: IVirtualRepeater, view: IView, index: number, moveToBottom: boolean): void => {
  const items = repeat.items;
  const viewSlot = repeat.viewSlot as IViewSlot;

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

/**
 * Calculate min number of views required to fill up the viewport based on viewport height and item height
 */
export const calcMinViewsRequired = (scrollerHeight: number, itemHeight: number) => {
  // extra 1 item to make sure it always fill up the viewport
  // in case first item is scroll up but not enough to completely pushed out of the viewport
  return Math$floor(scrollerHeight / itemHeight) + 1;
};

export const Math$abs = Math.abs;
export const Math$max = Math.max;
export const Math$min = Math.min;
export const Math$round = Math.round;
export const Math$ceil = Math.ceil;
export const Math$floor = Math.floor;
export const $isNaN = isNaN;
