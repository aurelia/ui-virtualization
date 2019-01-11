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
  getLastView(bottomBuffer: Element): Element;
  getTopBufferDistance(topBuffer: Element): number;
}

export class TemplateStrategyLocator {

  static inject = [Container];

  container: Container;

  constructor(container: Container) {
    this.container = container;
  }

  getStrategy(element: Element): ITemplateStrategy {
    if (element.parentNode && (element.parentNode as Element).tagName === 'TBODY') {
      return this.container.get(TableStrategy);
    }
    return this.container.get(DefaultTemplateStrategy);
  }
}

export class TableStrategy implements ITemplateStrategy {

  static inject = [DomHelper];

  tableCssReset = '\
    display: block;\
    width: auto;\
    height: auto;\
    margin: 0;\
    padding: 0;\
    border: none;\
    border-collapse: inherit;\
    border-spacing: 0;\
    background-color: transparent;\
    -webkit-border-horizontal-spacing: 0;\
    -webkit-border-vertical-spacing: 0;';

  domHelper: DomHelper;

  constructor(domHelper: DomHelper) {
    this.domHelper = domHelper;
  }

  getScrollContainer(element: Element): HTMLElement {
    return element.parentNode as HTMLElement;
  }

  moveViewFirst(view: View, topBuffer: Element): void {
    const tbody = this._getTbodyElement(topBuffer.nextSibling as Element);
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
    const tbody = this._getTbodyElement(DOM.nextElementSibling(topBuffer));
    const tr = tbody.firstChild as HTMLTableRowElement;
    return tr; //since the buffer is outside table, first element _is_ first element.
  }

  getLastElement(bottomBuffer: Element): Element {
    const tbody = this._getTbodyElement(bottomBuffer.previousSibling as Element);
    const trs = tbody.children;
    return trs[trs.length - 1];
  }

  getTopBufferDistance(topBuffer: Element): number {
    const tbody = this._getTbodyElement(topBuffer.nextSibling as Element);
    return this.domHelper.getElementDistanceToTopOfDocument(tbody) - this.domHelper.getElementDistanceToTopOfDocument(topBuffer);
  }

  getLastView(bottomBuffer: Element): Element {
    throw new Error('Method getLastView() not implemented.');
  }

  private _getTbodyElement(tableElement: Element): Element {
    let tbodyElement: Element;
    const children = tableElement.children;
    for (let i = 0, ii = children.length; i < ii; ++i) {
      if (children[i].localName === 'tbody') {
        tbodyElement = children[i];
        break;
      }
    }
    return tbodyElement;
  }
}

export class DefaultTemplateStrategy implements ITemplateStrategy {

  getLastView(bottomBuffer: Element): Element {
    throw new Error("Method getLastView() not implemented.");
  }
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
