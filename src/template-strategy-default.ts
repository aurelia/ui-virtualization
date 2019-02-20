import { IView, ITemplateStrategy } from './interfaces';
import { insertBeforeNode } from './utilities';
import { DOM } from 'aurelia-pal';

export class DefaultTemplateStrategy implements ITemplateStrategy {

  getScrollContainer(element: Element): HTMLElement {
    return element.parentNode as HTMLElement;
  }

  moveViewFirst(view: IView, topBuffer: Element): void {
    insertBeforeNode(view, DOM.nextElementSibling(topBuffer));
  }

  moveViewLast(view: IView, bottomBuffer: Element): void {
    const previousSibling = bottomBuffer.previousSibling;
    const referenceNode = previousSibling.nodeType === 8 && (previousSibling as Comment).data === 'anchor' ? previousSibling : bottomBuffer;
    insertBeforeNode(view, referenceNode as Element);
  }

  createTopBufferElement(element: Element): HTMLElement {
    const elementName = /^[UO]L$/.test((element.parentNode as Element).tagName) ? 'li' : 'div';
    const buffer = DOM.createElement(elementName);
    element.parentNode.insertBefore(buffer, element);
    return buffer;
  }

  createBottomBufferElement(element: Element): HTMLElement {
    const elementName = /^[UO]L$/.test((element.parentNode as Element).tagName) ? 'li' : 'div';
    const buffer = DOM.createElement(elementName);
    element.parentNode.insertBefore(buffer, element.nextSibling);
    return buffer;
  }

  removeBufferElements(element: Element, topBuffer: Element, bottomBuffer: Element): void {
    element.parentNode.removeChild(topBuffer);
    element.parentNode.removeChild(bottomBuffer);
  }

  getFirstElement(topBuffer: Element): Element {
    return topBuffer.nextElementSibling;
  }

  getLastElement(bottomBuffer: Element): Element {
    return bottomBuffer.previousElementSibling;
  }

  getTopBufferDistance(topBuffer: Element): number {
    return 0;
  }
}
