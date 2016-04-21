export class DomHelper {
  getElementDistanceToTopOfDocument(element: Element): number {
    let box = element.getBoundingClientRect();
    let documentElement = document.documentElement;
    let scrollTop = window.pageYOffset;
    let clientTop = documentElement.clientTop;
    let top  = box.top +  scrollTop - clientTop;
    return  Math.round(top);
  }

  hasOverflowScroll(element: Element): boolean {
    let style = element.style;
    return style.overflowY === 'scroll' || style.overflow === 'scroll' || style.overflowY === 'auto' || style.overflow === 'auto';
  }
}
