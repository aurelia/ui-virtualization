import { updateOverrideContext } from 'aurelia-templating-resources';

export function calcOuterHeight(element) {
  let height;
  height = element.getBoundingClientRect().height;
  height += getStyleValue(element, 'marginTop');
  height += getStyleValue(element, 'marginBottom');
  return height;
}

export function insertBeforeNode(view, bottomBuffer) {
  let viewStart = view.firstChild;
  let element = viewStart.nextSibling;
  let viewEnd = view.lastChild;
  let parentElement;

  if (bottomBuffer.parentElement) {
    parentElement = bottomBuffer.parentElement;
  } else if (bottomBuffer.parentNode) {
    parentElement = bottomBuffer.parentNode;
  }

  parentElement.insertBefore(viewEnd, bottomBuffer);
  parentElement.insertBefore(element, viewEnd);
  parentElement.insertBefore(viewStart, element);
}

export function updateVirtualOverrideContexts(repeat, startIndex) {
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

export function rebindAndMoveView(repeat, view, index, moveToBottom) {
  let items = repeat.items;
  let viewSlot = repeat.viewSlot;
  updateOverrideContext(view.overrideContext, index, items.length);
  view.bindingContext[repeat.local] = items[index];
  if (moveToBottom) {
    viewSlot.children.push(viewSlot.children.shift());
    repeat.viewStrategy.moveViewLast(view, repeat.bottomBuffer);
  } else {
    viewSlot.children.unshift(viewSlot.children.splice(-1, 1)[0]);
    repeat.viewStrategy.moveViewFirst(view, repeat.topBuffer);
  }
}

export function getStyleValue(element, style) {
  let currentStyle;
  let styleValue;
  currentStyle = element.currentStyle || window.getComputedStyle(element);
  styleValue = parseInt(currentStyle[style], 10);
  return Number.isNaN(styleValue) ? 0 : styleValue;
}

export function getElementDistanceToBottomViewPort(element) {
  return document.documentElement.clientHeight - element.getBoundingClientRect().bottom;
}

export function getElementDistanceToTopViewPort(element) {
  return element.getBoundingClientRect().top;
}