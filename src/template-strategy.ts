import { Container } from 'aurelia-dependency-injection';
import { DOM } from 'aurelia-pal';
import { View } from 'aurelia-templating';
import { DomHelper } from './dom-helper';
import { insertBeforeNode } from './utilities';
import { ITemplateStrategy } from './interfaces';

export class TemplateStrategyLocator {

  static inject = [Container];

  container: Container;

  constructor(container: Container) {
    this.container = container;
  }

  /**
   * Selects the template strategy based on element hosting `virtual-repeat` custom attribute
   */
  getStrategy(element: Element): ITemplateStrategy {
    const parent = element.parentElement;
    if (parent === null) {
      return this.container.get(DefaultTemplateStrategy);
    }
    const parentTagName = parent.tagName;
    // placed on tr, as it is automatically wrapped in a TBODY
    // if not wrapped, then it is already inside a thead or tfoot
    if (parentTagName === 'TBODY' || parentTagName === 'THEAD' || parentTagName === 'TFOOT') {
      return this.container.get(TableRowStrategy);
    }
    // place on a tbody/thead/tfoot
    if (parentTagName === 'TABLE') {
      return this.container.get(TableBodyStrategy);
    }
    // if (element.parentNode && (element.parentNode as Element).tagName === 'TBODY') {
    //   return this.container.get(TableStrategy);
    // }
    return this.container.get(DefaultTemplateStrategy);
  }
}

export class TableBodyStrategy implements ITemplateStrategy {


  getScrollContainer(element: Element): HTMLElement {
    return this.getTable(element).parentNode as HTMLElement;
  }

  moveViewFirst(view: View, topBuffer: Element): void {
    insertBeforeNode(view, DOM.nextElementSibling(topBuffer));
  }

  moveViewLast(view: View, bottomBuffer: Element): void {
    const previousSibling = bottomBuffer.previousSibling;
    const referenceNode = previousSibling.nodeType === 8 && (previousSibling as Comment).data === 'anchor' ? previousSibling : bottomBuffer;
    insertBeforeNode(view, referenceNode as Element);
  }

  createTopBufferElement(element: Element): HTMLElement {
    // append tbody with empty row before the element
    return element.parentNode.insertBefore(DOM.createElement('tr'), element);
  }

  createBottomBufferElement(element: Element): HTMLElement {
    return element.parentNode.insertBefore(DOM.createElement('tr'), element.nextSibling);
  }

  removeBufferElements(element: Element, topBuffer: Element, bottomBuffer: Element): void {
    DOM.removeNode(topBuffer);
    DOM.removeNode(bottomBuffer);
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

  private getFirstTbody(tableElement: HTMLTableElement): HTMLTableSectionElement {
    let child = tableElement.firstElementChild;
    while (child !== null && child.tagName !== 'TBODY') {
      child = child.nextElementSibling;
    }
    return child.tagName === 'TBODY' ? child as HTMLTableSectionElement : null;
  }

  private _getLastTbody(tableElement: HTMLTableElement): HTMLTableSectionElement {
    let child = tableElement.lastElementChild;
    while (child !== null && child.tagName !== 'TBODY') {
      child = child.previousElementSibling;
    }
    return child.tagName === 'TBODY' ? child as HTMLTableSectionElement : null;
  }

  /**
   * `element` is actually a comment, acting as anchor for `virtual-repeat` attribute
   * `element` will be placed next to a tbody
   */
  private getTable(element: Element): HTMLTableElement {
    return element.parentNode as HTMLTableElement;
  }
}

export class TableRowStrategy implements ITemplateStrategy {

  static inject = [DomHelper];

  // tableCssReset = '\
  //   display: block;\
  //   width: auto;\
  //   height: auto;\
  //   margin: 0;\
  //   padding: 0;\
  //   border: none;\
  //   border-collapse: inherit;\
  //   border-spacing: 0;\
  //   background-color: transparent;\
  //   -webkit-border-horizontal-spacing: 0;\
  //   -webkit-border-vertical-spacing: 0;';

  domHelper: DomHelper;

  constructor(domHelper: DomHelper) {
    this.domHelper = domHelper;
  }

  getScrollContainer(element: Element): HTMLElement {
    return element.parentNode as HTMLElement;
  }

  moveViewFirst(view: View, topBuffer: Element): void {
    const tbody = this._getFirstTbody(topBuffer.nextSibling as HTMLTableElement);
    const tr = tbody.firstChild;
    const firstElement = DOM.nextElementSibling(tr);
    insertBeforeNode(view, firstElement);
  }

  moveViewLast(view: View, bottomBuffer: Element): void {
    const lastElement = this.getLastElement(bottomBuffer).nextSibling;
    const referenceNode = lastElement.nodeType === 8 && (lastElement as Comment).data === 'anchor' ? lastElement : lastElement;
    insertBeforeNode(view, referenceNode as Element);
  }

  createTopBufferElement(element: Element): HTMLElement {
    const elementName = /^[UO]L$/.test((element.parentNode as Element).tagName) ? 'li' : 'div';
    const buffer = DOM.createElement(elementName);
    const tableElement = this.getTable(element);
    tableElement.parentNode.insertBefore(buffer, tableElement);
    buffer.innerHTML = '&nbsp;';
    return buffer;
  }

  createBottomBufferElement(element: Element): HTMLElement {
    const elementName = /^[UO]L$/.test((element.parentNode as Element).tagName) ? 'li' : 'div';
    const buffer = DOM.createElement(elementName);
    const tableElement = this.getTable(element);
    tableElement.parentNode.insertBefore(buffer, tableElement.nextSibling);
    return buffer;
  }

  removeBufferElements(element: Element, topBuffer: Element, bottomBuffer: Element): void {
    topBuffer.parentNode.removeChild(topBuffer);
    bottomBuffer.parentNode.removeChild(bottomBuffer);
  }

  getFirstElement(topBuffer: Element): Element {
    const tbody = this._getFirstTbody(DOM.nextElementSibling(topBuffer) as HTMLTableElement);
    const tr = tbody.firstElementChild as HTMLTableRowElement;
    // since the buffer is outside table, first element _is_ first element.
    return tr;
  }

  getLastElement(bottomBuffer: Element): Element {
    const tbody = this._getLastTbody(bottomBuffer.previousSibling as HTMLTableElement);
    return tbody.lastElementChild as HTMLTableRowElement;
  }

  getTopBufferDistance(topBuffer: Element): number {
    const tbody = this._getFirstTbody(topBuffer.nextSibling as HTMLTableElement);
    return this.domHelper.getElementDistanceToTopOfDocument(tbody) - this.domHelper.getElementDistanceToTopOfDocument(topBuffer);
  }

  private _getFirstTbody(tableElement: HTMLTableElement): HTMLTableSectionElement {
    let child = tableElement.firstElementChild;
    while (child !== null && child.tagName !== 'TBODY') {
      child = child.nextElementSibling;
    }
    return child.tagName === 'TBODY' ? child as HTMLTableSectionElement : null;
  }

  private _getLastTbody(tableElement: HTMLTableElement): HTMLTableSectionElement {
    let child = tableElement.lastElementChild;
    while (child !== null && child.tagName !== 'TBODY') {
      child = child.previousElementSibling;
    }
    return child.tagName === 'TBODY' ? child as HTMLTableSectionElement : null;
  }

  /**
   * `element` is actually a comment, acting as anchor for `virtual-repeat` attribute
   */
  private getTable(element: Element): HTMLTableElement {
    return element.parentNode.parentNode as HTMLTableElement;
  }
}

export class DefaultTemplateStrategy implements ITemplateStrategy {

  getScrollContainer(element: Element): HTMLElement {
    return element.parentNode as HTMLElement;
  }

  moveViewFirst(view: View, topBuffer: Element): void {
    insertBeforeNode(view, DOM.nextElementSibling(topBuffer));
  }

  moveViewLast(view: View, bottomBuffer: Element): void {
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
    return DOM.nextElementSibling(topBuffer);
  }

  getLastElement(bottomBuffer: Element): Element {
    return bottomBuffer.previousElementSibling;
  }

  getTopBufferDistance(topBuffer: Element): number {
    return 0;
  }
}
