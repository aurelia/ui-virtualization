export let DomHelper = class DomHelper {
  getElementDistanceToTopOfDocument(element) {
    let box = element.getBoundingClientRect();
    let documentElement = document.documentElement;
    let scrollTop = window.pageYOffset;
    let clientTop = documentElement.clientTop;
    let top = box.top + scrollTop - clientTop;
    return Math.round(top);
  }

  hasOverflowScroll(element) {
    let style = element.style;
    return style.overflowY === 'scroll' || style.overflow === 'scroll' || style.overflowY === 'auto' || style.overflow === 'auto';
  }
};