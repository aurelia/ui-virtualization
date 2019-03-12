import { Math$round } from './utilities';

/**
 * Walk up the DOM tree and determine what element will be scroller for an element
 *
 * If none is found, return `document.documentElement`
 */
export const getScrollContainer = (element: Node): HTMLElement => {
  let current = element.parentNode as HTMLElement;
  while (current !== null) {
    if (this.hasOverflowScroll(current)) {
      return current;
    }
    current = current.parentNode as HTMLElement;
  }
  return document.documentElement;
};

/**
 * Determine real distance of an element to top of current document
 */
export const getElementDistanceToTopOfDocument = (element: Element): number => {
  let box = element.getBoundingClientRect();
  let documentElement = document.documentElement;
  let scrollTop = window.pageYOffset;
  let clientTop = documentElement.clientTop;
  let top  = box.top + scrollTop - clientTop;
  return Math$round(top);
}

/**
 * Check if an element has inline style scroll/auto for overflow/overflowY
 */
export const hasOverflowScroll = (element: HTMLElement): boolean => {
  let style = element.style;
  return style.overflowY === 'scroll' || style.overflow === 'scroll' || style.overflowY === 'auto' || style.overflow === 'auto';
};

/**
 * A naive utility to calculate distance of a child element to one of its ancestor, typically used for scroller/buffer combo
 * Calculation is done based on offsetTop, with formula:
 * child.offsetTop - parent.offsetTop
 * There are steps in the middle to account for offsetParent but it's basically that
 */
export const getDistanceToParent = (child: HTMLElement, parent: HTMLElement) => {
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
