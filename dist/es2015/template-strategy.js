var _dec, _class, _dec2, _class2;

import { inject, Container } from 'aurelia-dependency-injection';
import { DOM } from 'aurelia-pal';
import { View } from 'aurelia-templating';
import { insertBeforeNode } from './utilities';
import { DomHelper } from './dom-helper';

export let TemplateStrategyLocator = (_dec = inject(Container), _dec(_class = class TemplateStrategyLocator {

  constructor(container) {
    this.container = container;
  }

  getStrategy(element) {
    if (element.parentNode && element.parentNode.localName === 'tbody') {
      return this.container.get(TableStrategy);
    }
    return this.container.get(DefaultTemplateStrategy);
  }
}) || _class);

export let TableStrategy = (_dec2 = inject(DomHelper), _dec2(_class2 = class TableStrategy {

  constructor(domHelper) {
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

    this.domHelper = domHelper;
  }

  getScrollContainer(element) {
    return element.parentNode;
  }

  moveViewFirst(view, topBuffer) {
    const tbody = this._getTbodyElement(topBuffer.nextSibling);
    const tr = tbody.firstChild;
    const firstElement = DOM.nextElementSibling(tr);
    insertBeforeNode(view, firstElement);
  }

  moveViewLast(view, bottomBuffer) {
    const lastElement = this.getLastElement(bottomBuffer).nextSibling;
    const referenceNode = lastElement.nodeType === 8 && lastElement.data === 'anchor' ? lastElement : lastElement;
    insertBeforeNode(view, referenceNode);
  }

  createTopBufferElement(element) {
    const elementName = element.parentNode.localName === 'ul' ? 'li' : 'div';
    const buffer = DOM.createElement(elementName);
    const tableElement = element.parentNode.parentNode;
    tableElement.parentNode.insertBefore(buffer, tableElement);
    buffer.innerHTML = '&nbsp;';
    return buffer;
  }

  createBottomBufferElement(element) {
    const elementName = element.parentNode.localName === 'ul' ? 'li' : 'div';
    const buffer = DOM.createElement(elementName);
    const tableElement = element.parentNode.parentNode;
    tableElement.parentNode.insertBefore(buffer, tableElement.nextSibling);
    return buffer;
  }

  removeBufferElements(element, topBuffer, bottomBuffer) {
    topBuffer.parentNode.removeChild(topBuffer);
    bottomBuffer.parentNode.removeChild(bottomBuffer);
  }

  getFirstElement(topBuffer) {
    const tbody = this._getTbodyElement(DOM.nextElementSibling(topBuffer));
    const tr = tbody.firstChild;
    return DOM.nextElementSibling(tr);
  }

  getLastElement(bottomBuffer) {
    const tbody = this._getTbodyElement(bottomBuffer.previousSibling);
    const trs = tbody.children;
    return trs[trs.length - 1];
  }

  getTopBufferDistance(topBuffer) {
    const tbody = this._getTbodyElement(topBuffer.nextSibling);
    return this.domHelper.getElementDistanceToTopOfDocument(tbody) - this.domHelper.getElementDistanceToTopOfDocument(topBuffer);
  }

  _getTbodyElement(tableElement) {
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
}) || _class2);

export let DefaultTemplateStrategy = class DefaultTemplateStrategy {
  getScrollContainer(element) {
    return element.parentNode;
  }

  moveViewFirst(view, topBuffer) {
    insertBeforeNode(view, DOM.nextElementSibling(topBuffer));
  }

  moveViewLast(view, bottomBuffer) {
    const previousSibling = bottomBuffer.previousSibling;
    const referenceNode = previousSibling.nodeType === 8 && previousSibling.data === 'anchor' ? previousSibling : bottomBuffer;
    insertBeforeNode(view, referenceNode);
  }

  createTopBufferElement(element) {
    const elementName = element.parentNode.localName === 'ul' ? 'li' : 'div';
    const buffer = DOM.createElement(elementName);
    element.parentNode.insertBefore(buffer, element);
    return buffer;
  }

  createBottomBufferElement(element) {
    const elementName = element.parentNode.localName === 'ul' ? 'li' : 'div';
    const buffer = DOM.createElement(elementName);
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

  getTopBufferDistance(topBuffer) {
    return 0;
  }
};