export class DomHelper {
  getElementDistanceToTopViewPort(element: Element): number {
    return element.getBoundingClientRect().top;
  }

  hasOverflowScroll(element: Element): boolean {
    let style = element.style;
    return style.overflowY === 'scroll' || style.overflow === 'scroll' || style.overflowY === 'auto' || style.overflow === 'auto';
  }
}
