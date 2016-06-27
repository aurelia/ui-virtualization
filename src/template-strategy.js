import {DOM} from 'aurelia-pal';
import {View} from 'aurelia-templating';
import {insertBeforeNode} from './utilities';

interface TemplateStrategy {
  getScrollContainer(element: Element): Element;
  moveViewFirst(view: View, topBuffer: Element): void;
  moveViewLast(view: View, bottomBuffer: Element): void;
  createTopBufferElement(element: Element): Element;
  createBottomBufferElement(element: Element): Element;
  removeBufferElements(element: Element, topBuffer: Element, bottomBuffer: Element): void;
  getFirstElement(topBuffer: Element): Element;
  getLastView(bottomBuffer: Element): Element;
}

export class TemplateStrategyLocator {
  getStrategy(element: Element): TemplateStrategy {
    if (element.parentNode && element.parentNode.localName === 'tbody') {
      return new TableStrategy();
    }
    return new DefaultTemplateStrategy();
  }
}

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

  getScrollContainer(element: Element): Element {
    return element.parentNode;
  }

  moveViewFirst(view: View, topBuffer: Element): void {
    insertBeforeNode(view, DOM.nextElementSibling(topBuffer.parentNode));
  }

  moveViewLast(view: View, bottomBuffer: Element): void {
    let previousSibling = bottomBuffer.parentNode.previousSibling;
    let referenceNode = previousSibling.nodeType === 8 && previousSibling.data === 'anchor' ? previousSibling : bottomBuffer.parentNode;
    insertBeforeNode(view, referenceNode);
  }

  createTopBufferElement(element: Element): Element {
    let tr = DOM.createElement('tr');
    tr.setAttribute('style', this.tableCssReset);
    let buffer = DOM.createElement('td');
    buffer.setAttribute('style', this.tableCssReset);
    tr.appendChild(buffer);
    element.parentNode.insertBefore(tr, element);
    return buffer;
  }

  createBottomBufferElement(element: Element): Element {
    let tr = DOM.createElement('tr');
    tr.setAttribute('style', this.tableCssReset);
    let buffer = DOM.createElement('td');
    buffer.setAttribute('style', this.tableCssReset);
    tr.appendChild(buffer);
    element.parentNode.insertBefore(tr, element.nextSibling);
    return buffer;
  }

  removeBufferElements(element: Element, topBuffer: Element, bottomBuffer: Element): void {
    element.parentNode.removeChild(topBuffer.parentNode);
    element.parentNode.removeChild(bottomBuffer.parentNode);
  }

  getFirstElement(topBuffer: Element): Element {
    let tr = topBuffer.parentNode;
    return DOM.nextElementSibling(tr);
  }

  getLastElement(bottomBuffer: Element): Element {
    return bottomBuffer.parentNode.previousElementSibling;
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
    let previousSibling = bottomBuffer.previousSibling;
    let referenceNode = previousSibling.nodeType === 8 && previousSibling.data === 'anchor' ? previousSibling : bottomBuffer;
    insertBeforeNode(view, referenceNode);
  }

  createTopBufferElement(element: Element): Element {
    let elementName = element.parentNode.localName === 'ul' ? 'li' : 'div';
    let buffer = DOM.createElement(elementName);
    element.parentNode.insertBefore(buffer, element);
    return buffer;
  }

  createBottomBufferElement(element: Element): Element {
    let elementName = element.parentNode.localName === 'ul' ? 'li' : 'div';
    let buffer = DOM.createElement(elementName);
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
}
