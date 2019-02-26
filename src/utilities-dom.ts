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
}

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
}
