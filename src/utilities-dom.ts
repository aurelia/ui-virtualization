import { Math$round, $isNaN } from './utilities';
import { IView } from './interfaces';
import { htmlElement, doc } from './constants';

/**
 * Walk up the DOM tree and determine what element will be scroller for an element
 *
 * If none is found, return `document.documentElement`
 */
export const getScrollerElement = (element: Node): HTMLElement => {
  let current = element.parentNode as Element;
  while (current !== null && current !== htmlElement) {
    if (hasOverflowScroll(current)) {
      return current as HTMLElement;
    }
    current = current.parentNode as HTMLElement;
  }
  return doc.scrollingElement as HTMLElement || htmlElement;
};

/**
 * Determine real distance of an element to top of current document
 */
export const getElementDistanceToTopOfDocument = (element: Element): number => {
  let box = element.getBoundingClientRect();
  let scrollTop = window.pageYOffset;
  let clientTop = htmlElement.clientTop;
  let top  = box.top + scrollTop - clientTop;
  return Math$round(top);
};

/**
 * Check if an element has style scroll/auto for overflow/overflowY
 */
export const hasOverflowScroll = (element: Element): boolean => {
  const style = window.getComputedStyle(element);
  return style && (style.overflowY === 'scroll' || style.overflow === 'scroll' || style.overflowY === 'auto' || style.overflow === 'auto');
};

/**
 * Get total value of a list of css style property on an element
 */
export const getStyleValues = (element: Element, ...styles: string[]): number => {
  let currentStyle = window.getComputedStyle(element);
  let value = 0;
  let styleValue = 0;
  for (let i = 0, ii = styles.length; ii > i; ++i) {
    styleValue = parseFloat(currentStyle[styles[i]]);
    value += $isNaN(styleValue) ? 0 : styleValue;
  }
  return value;
};

export const calcOuterHeight = (element: Element): number => {
  let height = element.getBoundingClientRect().height;
  height += getStyleValues(element, 'marginTop', 'marginBottom');
  return height;
};

export const calcScrollHeight = (element: Element): number => {
  let height = element.getBoundingClientRect().height;
  height -= getStyleValues(element, 'borderTopWidth', 'borderBottomWidth');
  return height;
};

export const insertBeforeNode = (view: IView, bottomBuffer: Element): void => {
  // todo: account for anchor comment
  bottomBuffer.parentNode.insertBefore(view.lastChild, bottomBuffer);
};

/**
 * A naive utility to calculate distance of a child element to one of its ancestor, typically used for scroller/buffer combo
 * Calculation is done based on offsetTop, with formula:
 * child.offsetTop - parent.offsetTop
 * There are steps in the middle to account for offsetParent but it's basically that
 */
export const getDistanceToParent = (child: HTMLElement, parent: HTMLElement): number => {
  const offsetParent = child.offsetParent as HTMLElement;
  const childOffsetTop = child.offsetTop;
  // [el] <-- offset parent === parent
  //  ...
  //   [el] <-- child
  if (offsetParent === null || offsetParent === parent) {
    return childOffsetTop;
  }
  else {
    // [el] <-- offset parent
    //   [el] <-- parent
    //     [el] <-- child
    if (offsetParent.contains(parent)) {
      return childOffsetTop - parent.offsetTop;
    }
    // [el] <-- parent
    //   [el] <-- offset parent
    //     [el] <-- child
    else {
      return childOffsetTop + getDistanceToParent(offsetParent, parent);
    }
  }
};
