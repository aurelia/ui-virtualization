import {DOM} from 'aurelia-pal';
import {insertBeforeNode} from './utilities';

interface ViewStrategy {
  getScrollContainer(element: Element): Element;
  moveViewFirst(view: View, topBuffer: Element): void;
  moveViewLast(view: View, bottomBuffer: Element): void;
  createTopBufferElement(element: Element): Element;
  createBottomBufferElement(element: Element): Element;
  removeBufferElements(element: Element, topBuffer: Element, bottomBuffer: Element): void;
}

export class ViewStrategyLocator {
  getStrategy(element: Element): ViewStrategy {
    if (element.parentNode.localName === 'tbody') {
      return new TableStrategy();
    }
    return new DefaultStrategy();
  }
}

export class TableStrategy {
  getScrollContainer(element: Element): Element {
    return element.parentNode;
  }

  moveViewFirst(view: View, topBuffer: Element): void {
    insertBeforeNode(view, DOM.nextElementSibling(topBuffer.parentNode).previousSibling);
  }

  moveViewLast(view: View, bottomBuffer: Element): void {
    insertBeforeNode(view, bottomBuffer.parentNode);
  }

  createTopBufferElement(element: Element): Element {
    let tr = DOM.createElement('tr');
    let buffer = DOM.createElement('td');
    buffer.setAttribute('style', 'height: 0px');
    tr.appendChild(buffer);
    element.parentNode.insertBefore(tr, element);
    return buffer;
  }

  createBottomBufferElement(element: Element): Element {
    let tr = DOM.createElement('tr');
    let buffer = DOM.createElement('td');
    buffer.setAttribute('style', 'height: 0px');
    tr.appendChild(buffer);
    element.parentNode.insertBefore(tr, element.nextSibling);
    return buffer;
  }

  removeBufferElements(element: Element, topBuffer: Element, bottomBuffer: Element): void {
    element.parentNode.removeChild(topBuffer.parentNode);
    element.parentNode.removeChild(bottomBuffer.parentNode);
  }
}

export class DefaultStrategy {
  getScrollContainer(element: Element): Element {
    return element.parentNode;
  }

  moveViewFirst(view: View, topBuffer: Element): void {
    insertBeforeNode(view, DOM.nextElementSibling(topBuffer).previousSibling);
  }

  moveViewLast(view: View, bottomBuffer: Element): void {
    let previousSibling = bottomBuffer.previousSibling;
    let referenceNode = previousSibling.nodeType === 8 && previousSibling.data === 'anchor' ? previousSibling : bottomBuffer;
    insertBeforeNode(view, referenceNode);
  }

  createTopBufferElement(element: Element): Element {
    let elementName = element.parentNode.localName === 'ul' ? 'li' : 'div';
    let buffer = DOM.createElement(elementName);
    buffer.setAttribute('style', 'height: 0px');
    element.parentNode.insertBefore(buffer, element);
    return buffer;
  }

  createBottomBufferElement(element: Element): Element {
    let elementName = element.parentNode.localName === 'ul' ? 'li' : 'div';
    let buffer = DOM.createElement(elementName);
    buffer.setAttribute('style', 'height: 0px');
    element.parentNode.insertBefore(buffer, element.nextSibling);
    return buffer;
  }

  removeBufferElements(element: Element, topBuffer: Element, bottomBuffer: Element): void {
    element.parentNode.removeChild(topBuffer);
    element.parentNode.removeChild(bottomBuffer);
  }
}
