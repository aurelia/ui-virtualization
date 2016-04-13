export let DomHelper = class DomHelper {
  getElementDistanceToTopViewPort(element) {
    return element.getBoundingClientRect().top;
  }

  hasOverflowScroll(element) {
    let style = element.style;
    return style.overflowY === 'scroll' || style.overflow === 'scroll' || style.overflowY === 'auto' || style.overflow === 'auto';
  }
};