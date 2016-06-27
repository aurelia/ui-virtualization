import { DOM } from 'aurelia-pal';
import { View } from 'aurelia-templating';
import { insertBeforeNode } from './utilities';

export let TemplateStrategyLocator = class TemplateStrategyLocator {
  getStrategy(element) {
    if (element.parentNode && element.parentNode.localName === 'tbody') {
      return new TableStrategy();
    }
    return new DefaultTemplateStrategy();
  }
};

export let TableStrategy = class TableStrategy {
  constructor() {
    this.tableCssReset = '\
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
  }

  getScrollContainer(element) {
    return element.parentNode;
  }

  moveViewFirst(view, topBuffer) {
    insertBeforeNode(view, DOM.nextElementSibling(topBuffer.parentNode));
  }

  moveViewLast(view, bottomBuffer) {
    let previousSibling = bottomBuffer.parentNode.previousSibling;
    let referenceNode = previousSibling.nodeType === 8 && previousSibling.data === 'anchor' ? previousSibling : bottomBuffer.parentNode;
    insertBeforeNode(view, referenceNode);
  }

  createTopBufferElement(element) {
    let tr = DOM.createElement('tr');
    tr.setAttribute('style', this.tableCssReset);
    let buffer = DOM.createElement('td');
    buffer.setAttribute('style', this.tableCssReset);
    tr.appendChild(buffer);
    element.parentNode.insertBefore(tr, element);
    return buffer;
  }

  createBottomBufferElement(element) {
    let tr = DOM.createElement('tr');
    tr.setAttribute('style', this.tableCssReset);
    let buffer = DOM.createElement('td');
    buffer.setAttribute('style', this.tableCssReset);
    tr.appendChild(buffer);
    element.parentNode.insertBefore(tr, element.nextSibling);
    return buffer;
  }

  removeBufferElements(element, topBuffer, bottomBuffer) {
    element.parentNode.removeChild(topBuffer.parentNode);
    element.parentNode.removeChild(bottomBuffer.parentNode);
  }

  getFirstElement(topBuffer) {
    let tr = topBuffer.parentNode;
    return DOM.nextElementSibling(tr);
  }

  getLastElement(bottomBuffer) {
    return bottomBuffer.parentNode.previousElementSibling;
  }
};

export let DefaultTemplateStrategy = class DefaultTemplateStrategy {
  getScrollContainer(element) {
    return element.parentNode;
  }

  moveViewFirst(view, topBuffer) {
    insertBeforeNode(view, DOM.nextElementSibling(topBuffer));
  }

  moveViewLast(view, bottomBuffer) {
    let previousSibling = bottomBuffer.previousSibling;
    let referenceNode = previousSibling.nodeType === 8 && previousSibling.data === 'anchor' ? previousSibling : bottomBuffer;
    insertBeforeNode(view, referenceNode);
  }

  createTopBufferElement(element) {
    let elementName = element.parentNode.localName === 'ul' ? 'li' : 'div';
    let buffer = DOM.createElement(elementName);
    element.parentNode.insertBefore(buffer, element);
    return buffer;
  }

  createBottomBufferElement(element) {
    let elementName = element.parentNode.localName === 'ul' ? 'li' : 'div';
    let buffer = DOM.createElement(elementName);
    element.parentNode.insertBefore(buffer, element.nextSibling);
    return buffer;
  }

  removeBufferElements(element, topBuffer, bottomBuffer) {
    element.parentNode.removeChild(topBuffer);
    element.parentNode.removeChild(bottomBuffer);
  }

  getFirstElement(topBuffer) {
    return DOM.nextElementSibling(topBuffer);
  }

  getLastElement(bottomBuffer) {
    return bottomBuffer.previousElementSibling;
  }
};