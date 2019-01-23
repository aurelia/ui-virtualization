import { $round } from './utilities';

export class DomHelper {

  /**
   * Walk up the DOM tree and determine what element will be scroller for an element
   *
   * If none is found, return `document.documentElement`
   */
  static getScrollContainer(element: Node): HTMLElement {
    let current = element.parentNode as HTMLElement;
    while (current !== null) {
      if (this.hasOverflowScroll(current)) {
        return current;
      }
      current = current.parentNode as HTMLElement;
    }
    return document.documentElement;
  }

  static getElementDistanceToTopOfDocument(element: Element): number {
    let box = element.getBoundingClientRect();
    let documentElement = document.documentElement;
    let scrollTop = window.pageYOffset;
    let clientTop = documentElement.clientTop;
    let top  = box.top + scrollTop - clientTop;
    return $round(top);
  }

  static hasOverflowScroll(element: HTMLElement): boolean {
    let style = element.style;
    return style.overflowY === 'scroll' || style.overflow === 'scroll' || style.overflowY === 'auto' || style.overflow === 'auto';
  }
}
