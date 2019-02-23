import { $round } from './utilities';

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
  return $round(top);
}

/**
 * Check if an element has inline style scroll/auto for overflow/overflowY
 */
export const hasOverflowScroll = (element: HTMLElement): boolean => {
  let style = element.style;
  return style.overflowY === 'scroll' || style.overflow === 'scroll' || style.overflowY === 'auto' || style.overflow === 'auto';
}

// export class RepeatDomManager {
  
//   private repeat: VirtualRepeat;

//   private templateStrategyLocator: TemplateStrategyLocator;

//   private topBufferEl: HTMLElement;
//   private botBufferEl: HTMLElement;

//   constructor(repeat: VirtualRepeat) {
//     this.repeat = repeat;
//     this.templateStrategyLocator = repeat.container.get(TemplateStrategyLocator);
//   }

//   initContainer() {
//     const vRepeat: VirtualRepeat = this.repeat;
//     const element = vRepeat.element;
//     const templateStrategy = vRepeat.templateStrategy = this.templateStrategyLocator.getStrategy(element);
    
//     let scrollContainer = vRepeat.scrollContainer = templateStrategy.getScrollContainer(element);
//     const [topBufferEl, bottomBufferEl] = templateStrategy.createBuffers(element);
//     this.topBufferEl = topBufferEl;
//     this.botBufferEl = bottomBufferEl;
//   }

//   init() {
//     const vRepeat: VirtualRepeat = this.repeat;
//     const element = vRepeat.element;
//     const templateStrategy = vRepeat.templateStrategy = this.templateStrategyLocator.getStrategy(element);

//     let scrollListener = vRepeat.scrollListener = () => vRepeat._onScroll();
//     let scrollContainer = vRepeat.scrollContainer = templateStrategy.getScrollContainer(element);
//     const [topBufferEl, bottomBufferEl] = templateStrategy.createBuffers(element);
//     this.topBufferEl = topBufferEl;
//     this.botBufferEl = bottomBufferEl;
//     vRepeat.itemsChanged();

//     vRepeat._calcDistanceToTopInterval = PLATFORM.global.setInterval(() => {
//       let prevDistanceToTop = vRepeat.distanceToTop;
//       let currDistanceToTop = DomHelper.getElementDistanceToTopOfDocument(topBufferEl) + vRepeat.topBufferDistance;
//       vRepeat.distanceToTop = currDistanceToTop;
//       if (prevDistanceToTop !== currDistanceToTop) {
//         vRepeat._handleScroll();
//       }
//     }, 500);

//     // When dealing with tables, there can be gaps between elements, causing distances to be messed up. Might need to handle vRepeat case here.
//     vRepeat.topBufferDistance = templateStrategy.getTopBufferDistance(topBufferEl);
//     vRepeat.distanceToTop = DomHelper
//       .getElementDistanceToTopOfDocument(templateStrategy.getFirstElement(topBufferEl));

//     if (DomHelper.hasOverflowScroll(scrollContainer)) {
//       vRepeat._fixedHeightContainer = true;
//       scrollContainer.addEventListener('scroll', scrollListener);
//     } else {
//       document.addEventListener('scroll', scrollListener);
//     }
//     if (vRepeat.items.length < vRepeat.elementsInView && vRepeat.isLastIndex === undefined) {
//       vRepeat._getMore(true);
//     }
//   }
  
// }
