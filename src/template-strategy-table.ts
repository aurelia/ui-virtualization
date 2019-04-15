import { DOM } from 'aurelia-pal';
import { ITemplateStrategy } from './interfaces';
import { DefaultTemplateStrategy } from './template-strategy-default';
import { getScrollerElement } from './utilities-dom';

abstract class BaseTableTemplateStrategy extends DefaultTemplateStrategy implements ITemplateStrategy {

  /**@override */
  getScrollContainer(element: Element): HTMLElement {
    return getScrollerElement(this.getTable(element));
  }

  createBuffers(element: Element): [HTMLElement, HTMLElement] {
    const parent = element.parentNode;
    // element is a comment node
    return [
      // append tbody with empty row before the element
      parent.insertBefore(DOM.createElement('tr'), element),
      // append tbody with empty row after the element
      parent.insertBefore(DOM.createElement('tr'), element.nextSibling)
    ];
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
