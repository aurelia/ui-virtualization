import { DefaultTemplateStrategy } from './template-strategy-default';
import { ITemplateStrategy } from './interfaces';
import { DOM } from 'aurelia-pal';

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
 *    ... some content
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
  createBuffers(element: Element): [HTMLElement, HTMLElement] {
    const parent = element.parentNode;
    return [
      parent.insertBefore(DOM.createElement('li'), element),
      parent.insertBefore(DOM.createElement('li'), element.nextSibling),
    ];
  }
}
