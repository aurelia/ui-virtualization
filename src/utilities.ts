import {updateOverrideContext} from 'aurelia-templating-resources';
import {View} from 'aurelia-templating';
import { IVirtualRepeat, IView } from './interfaces';

export function calcOuterHeight(element: Element): number {
  let height = element.getBoundingClientRect().height;
  height += getStyleValues(element, 'marginTop', 'marginBottom');
  return height;
}

export function insertBeforeNode(view: View, bottomBuffer: Element): void {
  let parentElement = bottomBuffer.parentElement || bottomBuffer.parentNode;
  parentElement.insertBefore(view.lastChild, bottomBuffer);
}

/**
* Update the override context.
* @param startIndex index in collection where to start updating.
*/
export function updateVirtualOverrideContexts(repeat: IVirtualRepeat, startIndex: number): void {
  let views = repeat.viewSlot.children;
  let viewLength = views.length;
  let collectionLength = repeat.items.length;

  if (startIndex > 0) {
    startIndex = startIndex - 1;
  }

  let delta = repeat._topBufferHeight / repeat.itemHeight;

  for (; startIndex < viewLength; ++startIndex) {
    updateOverrideContext(views[startIndex].overrideContext, startIndex + delta, collectionLength);
  }
}

/**
 * Update a view by re-assigning item value in binding context of associated view of an `collectionIndex`
 */
export function rebindView(repeat: IVirtualRepeat, selectedView: IView, collectionIndex: number) {
  let items = repeat.items;
  updateOverrideContext(selectedView.overrideContext, collectionIndex, items.length);
  selectedView.bindingContext[repeat.local] = items[collectionIndex];
}

/**
 * Update local value of a binding context created on the fly by repeat.
 *
 * Additionally move specified view to either top/bottom based on 4th parameter value:
 * - `true` = move to bottom of children list of `repeat.viewSlot`
 * - `false` = move to top of children list of `repeat.viewSlot`
 *
 * The value of 4th parameter should be defined by scrolling direction:
 * - `true` = scrolling down
 * - `false` = scrolling up
 */
export function rebindAndMoveView(repeat: IVirtualRepeat, view: IView, collectionIndex: number, moveToBottom: boolean): void {
  // let items = repeat.items;
  // updateOverrideContext(view.overrideContext, index, items.length);
  // view.bindingContext[repeat.local] = items[index];
  // rebindView(repeat, view, index);
  let items = repeat.items;
  updateOverrideContext(view.overrideContext, collectionIndex, items.length);
  view.bindingContext[repeat.local] = items[collectionIndex];

  let viewSlot = repeat.viewSlot;
  if (moveToBottom) {
    viewSlot.children.push(viewSlot.children.shift());
    repeat.templateStrategy.moveViewLast(view, repeat.bottomBuffer);
  } else {
    viewSlot.children.unshift(viewSlot.children.splice(-1, 1)[0]);
    repeat.templateStrategy.moveViewFirst(view, repeat.topBuffer);
  }
}

export function getStyleValues(element: Element, ...styles: string[]): number {
  let currentStyle = window.getComputedStyle(element);
  let value: number = 0;
  let styleValue: number = 0;
  for (let i = 0, ii = styles.length; ii > i; ++i) {
    styleValue = parseInt(currentStyle[styles[i]], 10);
    value += Number.isNaN(styleValue) ? 0 : styleValue;
  }
  return value;
}

export function getInlineStyleValue(element: HTMLElement, propertyName: string): number {
  return parseFloat(element.style.getPropertyValue(propertyName));
}

export function getElementDistanceToBottomViewPort(element: Element): number {
  return document.documentElement.clientHeight - element.getBoundingClientRect().bottom;
}

export function getElementDistanceToTopViewPort(element: Element): number {
  return element.getBoundingClientRect().top;
}

export const $max = Math.max;
export const $min = Math.min;
export const $round = Math.round;
export const $isNaN = isNaN;
export const $toClosestMultiplicationOf = (value: number, base: number) => $round(value / base) * base;
