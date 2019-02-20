import { DefaultTemplateStrategy } from './template-strategy-default';
import { ITemplateStrategy } from './interfaces';
import { DOM } from 'aurelia-pal';
import { DomHelper } from './dom-helper';

/**
 * Handle virtual repeat on a list item <li/> element
 * There are two way a list may be used in a template:
 *
 * List as scroll container itself
 * ```html
 * <template>
 *  <ul style="overflow: scroll; height: 500px;">
 *    <li virtual-repeat.for="item of items">...</li>
 *  </ul>
 * </template>
 * ```
 *
 * List inside another scroll container
 * ```html
 * <template>
 *  <div style="overflow: scroll; height: 500px;">
 *    <ul>
 *      <li virtual-repeat.for="item of items"></li>
 *    <ul>
 *  </div>
 * </template>
 * ```
 *
 * For both cases, buffer should still stay inside the list <ul/> (or <ol/>)
 * This template is to handle those scenarios better than default template strategy
 */
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
