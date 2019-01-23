import { DOM } from 'aurelia-framework';
import { ITemplateStrategy } from './interfaces';
import { DefaultTemplateStrategy } from './template-strategy-default';

abstract class BaseTableTemplateStrategy extends DefaultTemplateStrategy implements ITemplateStrategy {

  /**@override */
  getScrollContainer(element: Element): HTMLElement {
    return this.getTable(element).parentNode as HTMLElement;
  }

  /**@override */
  createTopBufferElement(element: Element): HTMLElement {
    // append tbody with empty row before the element
    return element.parentNode.insertBefore(DOM.createElement('tr'), element);
  }

  /**@override */
  createBottomBufferElement(element: Element): HTMLElement {
    // append tbody with empty row after the element
    // element is a comment node
    return element.parentNode.insertBefore(DOM.createElement('tr'), element.nextSibling);
  }

  protected abstract getTable(element: Element): HTMLTableElement;
}

export class TableBodyStrategy extends BaseTableTemplateStrategy {

  /**
   * `element` is actually a comment, acting as anchor for `virtual-repeat` attribute
   * `element` will be placed next to a tbody
   */
  protected getTable(element: Element): HTMLTableElement {
    return element.parentNode as HTMLTableElement;
  }
}

export class TableRowStrategy extends BaseTableTemplateStrategy {

  /**
   * `element` is actually a comment, acting as anchor for `virtual-repeat` attribute
   * `element` will be placed next to a tbody
   */
  protected getTable(element: Element): HTMLTableElement {
    return element.parentNode.parentNode as HTMLTableElement;
  }
}
