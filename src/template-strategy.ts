import { Container } from 'aurelia-dependency-injection';
import { DOM } from 'aurelia-pal';
import { View } from 'aurelia-templating';
import { DomHelper } from './dom-helper';
import { insertBeforeNode } from './utilities';

export interface ITemplateStrategy {
  getScrollContainer(element: Element): HTMLElement;
  moveViewFirst(view: View, topBuffer: Element): void;
  moveViewLast(view: View, bottomBuffer: Element): void;
  createTopBufferElement(element: Element): HTMLElement;
  createBottomBufferElement(element: Element): HTMLElement;
  removeBufferElements(element: Element, topBuffer: Element, bottomBuffer: Element): void;
  getFirstElement(topBuffer: Element): Element;
  getLastElement(bottomBuffer: Element): Element;
  getTopBufferDistance(topBuffer: Element): number;
}

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
    if (element.parentNode && (element.parentNode as Element).tagName === 'TBODY') {
      return this.container.get(TableStrategy);
    }
    return this.container.get(DefaultTemplateStrategy);
  }
}

export class TableStrategy implements ITemplateStrategy {

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
    const tableElement = element.parentNode.parentNode;
    tableElement.parentNode.insertBefore(buffer, tableElement);
    buffer.innerHTML = '&nbsp;';
    return buffer;
  }

  createBottomBufferElement(element: Element): HTMLElement {
    const elementName = /^[UO]L$/.test((element.parentNode as Element).tagName) ? 'li' : 'div';
    const buffer = DOM.createElement(elementName);
    const tableElement = element.parentNode.parentNode;
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
