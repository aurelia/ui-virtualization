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

  domHelper: DomHelper;

  constructor(domHelper: DomHelper) {
    this.domHelper = domHelper;
  }

  getScrollContainer(element: Element): HTMLElement {
    return element.parentNode as HTMLElement;
  }

  moveViewFirst(view: View, topBuffer: Element): void {
    insertBeforeNode(view, topBuffer.nextElementSibling);
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
