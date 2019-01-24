import { DefaultTemplateStrategy } from './template-strategy-default';
import { ITemplateStrategy } from './interfaces';
import { DOM } from 'aurelia-pal';
import { DomHelper } from './dom-helper';

export class ListTemplateStrategy extends DefaultTemplateStrategy implements ITemplateStrategy {

  /**@override */
  getScrollContainer(element: Element): HTMLElement {
    let listElement = this.getList(element);
    return DomHelper.hasOverflowScroll(listElement)
      ? listElement
      : listElement.parentNode as HTMLElement;
  }

  /**@override */
  createTopBufferElement(element: Element): HTMLElement {
    // append tbody with empty row before the element
    return element.parentNode.insertBefore(DOM.createElement('li'), element);
  }

  /**@override */
  createBottomBufferElement(element: Element): HTMLElement {
    // append tbody with empty row after the element
    // element is a comment node
    return element.parentNode.insertBefore(DOM.createElement('li'), element.nextSibling);
  }

  private getList(element: Element): HTMLOListElement | HTMLUListElement {
    return element.parentNode as HTMLOListElement | HTMLUListElement;
  }
}
