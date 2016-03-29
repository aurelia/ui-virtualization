import { insertBeforeNode } from './utilities';

export let ViewStrategyLocator = class ViewStrategyLocator {
  getStrategy(element) {
    if (element.parentNode.localName === 'tbody') {
      return new TableStrategy();
    }
    return new DefaultStrategy();
  }
};

export let TableStrategy = class TableStrategy {
  getScrollContainer(element) {
    return element.parentNode;
  }

  moveViewFirst(view, topBuffer) {
    insertBeforeNode(view, topBuffer.parentElement.nextElementSibling.previousSibling);
  }

  moveViewLast(view, bottomBuffer) {
    insertBeforeNode(view, bottomBuffer.parentElement);
  }

  createTopBufferElement(element) {
    let tr = document.createElement('tr');
    let buffer = document.createElement('td');
    buffer.setAttribute('style', 'height: 0px');
    tr.appendChild(buffer);
    element.parentElement.insertBefore(tr, element);
    return buffer;
  }

  createBottomBufferElement(element) {
    let tr = document.createElement('tr');
    let buffer = document.createElement('td');
    buffer.setAttribute('style', 'height: 0px');
    tr.appendChild(buffer);
    element.parentNode.insertBefore(tr, element.nextSibling);
    return buffer;
  }

  removeBufferElements(element, topBuffer, bottomBuffer) {
    element.parentElement.removeChild(topBuffer.parentElement);
    element.parentElement.removeChild(bottomBuffer.parentElement);
  }
};

export let DefaultStrategy = class DefaultStrategy {
  getScrollContainer(element) {
    return element.parentNode;
  }

  moveViewFirst(view, topBuffer) {
    insertBeforeNode(view, topBuffer.nextElementSibling.previousSibling);
  }

  moveViewLast(view, bottomBuffer) {
    let previousSibling = bottomBuffer.previousSibling;
    let referenceNode = previousSibling.nodeType === 8 && previousSibling.data === 'anchor' ? previousSibling : bottomBuffer;
    insertBeforeNode(view, referenceNode);
  }

  createTopBufferElement(element) {
    let elementName = element.parentElement.localName === 'ul' ? 'li' : 'div';
    let buffer = document.createElement(elementName);
    buffer.setAttribute('style', 'height: 0px');
    element.parentElement.insertBefore(buffer, element);
    return buffer;
  }

  createBottomBufferElement(element) {
    let elementName = element.parentElement.localName === 'ul' ? 'li' : 'div';
    let buffer = document.createElement(elementName);
    buffer.setAttribute('style', 'height: 0px');
    element.parentNode.insertBefore(buffer, element.nextSibling);
    return buffer;
  }

  removeBufferElements(element, topBuffer, bottomBuffer) {
    element.parentElement.removeChild(topBuffer);
    element.parentElement.removeChild(bottomBuffer);
  }
};