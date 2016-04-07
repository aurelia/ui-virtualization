import {DOM} from 'aurelia-pal';
import {insertBeforeNode} from './utilities';

export class ViewStrategyLocator {
  getStrategy(element) {
    if (element.parentNode.localName === 'tbody') {
      return new TableStrategy();
    }
    return new DefaultStrategy();
  }
}

export class TableStrategy {
  getScrollContainer(element) {
    return element.parentNode;
  }

  moveViewFirst(view, topBuffer) {
    insertBeforeNode(view, DOM.nextElementSibling(topBuffer.parentNode).previousSibling);
  }

  moveViewLast(view, bottomBuffer) {
    insertBeforeNode(view, bottomBuffer.parentNode);
  }

  createTopBufferElement(element) {
    let tr = DOM.createElement('tr');
    let buffer = DOM.createElement('td');
    buffer.setAttribute('style', 'height: 0px');
    tr.appendChild(buffer);
    element.parentNode.insertBefore(tr, element);
    return buffer;
  }

  createBottomBufferElement(element) {
    let tr = DOM.createElement('tr');
    let buffer = DOM.createElement('td');
    buffer.setAttribute('style', 'height: 0px');
    tr.appendChild(buffer);
    element.parentNode.insertBefore(tr, element.nextSibling);
    return buffer;
  }

  removeBufferElements(element, topBuffer, bottomBuffer) {
    element.parentNode.removeChild(topBuffer.parentNode);
    element.parentNode.removeChild(bottomBuffer.parentNode);
  }
}

export class DefaultStrategy {
  getScrollContainer(element) {
    return element.parentNode;
  }

  moveViewFirst(view, topBuffer) {
    insertBeforeNode(view, DOM.nextElementSibling(topBuffer).previousSibling);
  }

  moveViewLast(view, bottomBuffer) {
    let previousSibling = bottomBuffer.previousSibling;
    let referenceNode = previousSibling.nodeType === 8 && previousSibling.data === 'anchor' ? previousSibling : bottomBuffer;
    insertBeforeNode(view, referenceNode);
  }

  createTopBufferElement(element) {
    let elementName = element.parentNode.localName === 'ul' ? 'li' : 'div';
    let buffer = DOM.createElement(elementName);
    buffer.setAttribute('style', 'height: 0px');
    element.parentNode.insertBefore(buffer, element);
    return buffer;
  }

  createBottomBufferElement(element) {
    let elementName = element.parentNode.localName === 'ul' ? 'li' : 'div';
    let buffer = DOM.createElement(elementName);
    buffer.setAttribute('style', 'height: 0px');
    element.parentNode.insertBefore(buffer, element.nextSibling);
    return buffer;
  }

  removeBufferElements(element, topBuffer, bottomBuffer) {
    element.parentNode.removeChild(topBuffer);
    element.parentNode.removeChild(bottomBuffer);
  }
}
