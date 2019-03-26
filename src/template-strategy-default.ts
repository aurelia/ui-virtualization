import { IView, ITemplateStrategy } from './interfaces';
import { insertBeforeNode, getScrollContainer } from './utilities-dom';
import { DOM } from 'aurelia-pal';

export class DefaultTemplateStrategy implements ITemplateStrategy {

  getScrollContainer(element: Element): HTMLElement {
    return getScrollContainer(element);
  }

  moveViewFirst(view: IView, topBuffer: Element): void {
    insertBeforeNode(view, DOM.nextElementSibling(topBuffer));
  }

  moveViewLast(view: IView, bottomBuffer: Element): void {
    const previousSibling = bottomBuffer.previousSibling;
    const referenceNode = previousSibling.nodeType === 8 && (previousSibling as Comment).data === 'anchor' ? previousSibling : bottomBuffer;
    insertBeforeNode(view, referenceNode as Element);
  }

  createBuffers(element: Element): [HTMLElement, HTMLElement] {
    const parent = element.parentNode;
    return [
      parent.insertBefore(DOM.createElement('div'), element),
      parent.insertBefore(DOM.createElement('div'), element.nextSibling)
    ];
  }

  removeBuffers(el: Element, topBuffer: Element, bottomBuffer: Element): void {
    const parent = el.parentNode;
    parent.removeChild(topBuffer);
    parent.removeChild(bottomBuffer);
  }

  getFirstElement(topBuffer: Element, bottomBuffer: Element): Element {
    const firstEl = topBuffer.nextElementSibling;
    return firstEl === bottomBuffer ? null : firstEl;
  }

  getLastElement(topBuffer: Element, bottomBuffer: Element): Element {
    const lastEl = bottomBuffer.previousElementSibling;
    return lastEl === topBuffer ? null : lastEl;
  }
}
