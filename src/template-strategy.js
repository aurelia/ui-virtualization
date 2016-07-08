import {inject, Container} from 'aurelia-dependency-injection';
import {DOM} from 'aurelia-pal';
import {View} from 'aurelia-templating';
import {insertBeforeNode} from './utilities';
import {DomHelper} from './dom-helper';

interface TemplateStrategy {
  getScrollContainer(element: Element): Element;
  moveViewFirst(view: View, topBuffer: Element): void;
  moveViewLast(view: View, bottomBuffer: Element): void;
  createTopBufferElement(element: Element): Element;
  createBottomBufferElement(element: Element): Element;
  removeBufferElements(element: Element, topBuffer: Element, bottomBuffer: Element): void;
  getFirstElement(topBuffer: Element): Element;
  getLastView(bottomBuffer: Element): Element;
  getTopBufferDistance(topBuffer: Element): number;
}

@inject(Container)
export class TemplateStrategyLocator {

  constructor(container: Container) {
    this.container = container;
  }

  getStrategy(element: Element): TemplateStrategy {
    if (element.parentNode && element.parentNode.localName === 'tbody') {
      return this.container.get(TableStrategy);
    }
    return this.container.get(DefaultTemplateStrategy);
  }
}

@inject(DomHelper)
export class TableStrategy {
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

  constructor(domHelper) {
    this.domHelper = domHelper;
  }

  getScrollContainer(element: Element): Element {
    return element.parentNode;
  }

  moveViewFirst(view: View, topBuffer: Element): void {
    const tbody = this._getTbodyElement(topBuffer.nextSibling);
    const tr = tbody.firstChild;
    const firstElement = DOM.nextElementSibling(tr);
    insertBeforeNode(view, firstElement);
  }

  moveViewLast(view: View, bottomBuffer: Element): void {
    const lastElement = this.getLastElement(bottomBuffer).nextSibling;
    const referenceNode = lastElement.nodeType === 8 && lastElement.data === 'anchor' ? lastElement : lastElement;
    insertBeforeNode(view, referenceNode);
  }

  createTopBufferElement(element: Element): Element {
    const elementName = element.parentNode.localName === 'ul' ? 'li' : 'div';
    const buffer = DOM.createElement(elementName);
    const tableElement = element.parentNode.parentNode;
    tableElement.parentNode.insertBefore(buffer, tableElement);
    buffer.innerHTML = '&nbsp;';
    return buffer;
  }

  createBottomBufferElement(element: Element): Element {
    const elementName = element.parentNode.localName === 'ul' ? 'li' : 'div';
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
    const tr = tbody.firstChild;
    return DOM.nextElementSibling(tr);
  }

  getLastElement(bottomBuffer: Element): Element {
    const tbody = this._getTbodyElement(bottomBuffer.previousSibling);
    const trs = tbody.children;
    return trs[trs.length - 1];
  }

  getTopBufferDistance(topBuffer: Element): number {
    const tbody = this._getTbodyElement(topBuffer.nextSibling);
    return this.domHelper.getElementDistanceToTopOfDocument(tbody) - this.domHelper.getElementDistanceToTopOfDocument(topBuffer);
  }

  _getTbodyElement(tableElement: Element): Element {
    let tbodyElement;
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

export class DefaultTemplateStrategy {
  getScrollContainer(element: Element): Element {
    return element.parentNode;
  }

  moveViewFirst(view: View, topBuffer: Element): void {
    insertBeforeNode(view, DOM.nextElementSibling(topBuffer));
  }

  moveViewLast(view: View, bottomBuffer: Element): void {
    const previousSibling = bottomBuffer.previousSibling;
    const referenceNode = previousSibling.nodeType === 8 && previousSibling.data === 'anchor' ? previousSibling : bottomBuffer;
    insertBeforeNode(view, referenceNode);
  }

  createTopBufferElement(element: Element): Element {
    const elementName = element.parentNode.localName === 'ul' ? 'li' : 'div';
    const buffer = DOM.createElement(elementName);
    element.parentNode.insertBefore(buffer, element);
    return buffer;
  }

  createBottomBufferElement(element: Element): Element {
    const elementName = element.parentNode.localName === 'ul' ? 'li' : 'div';
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
