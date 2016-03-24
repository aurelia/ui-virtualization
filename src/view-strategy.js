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
  getScrollList(element) {
    return element.parentNode;
  }

  getScrollContainer(element) {
    return this.getScrollList(element).parentElement.parentElement;
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

  removeBufferElements(scrollList, topBuffer, bottomBuffer) {
    scrollList.removeChild(topBuffer.parentElement);
    scrollList.removeChild(bottomBuffer.parentElement);
  }
}

export class DefaultStrategy {
  getScrollList(element) {
    return element.parentNode;
  }

  getScrollContainer(element) {
    return this.getScrollList(element).parentElement;
  }

  moveViewFirst(view, topBuffer) {
    insertBeforeNode(view, topBuffer.nextElementSibling.previousSibling);
  }

  moveViewLast(view, bottomBuffer) {
    insertBeforeNode(view, bottomBuffer);
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
    element.removeChild(topBuffer);
    element.removeChild(bottomBuffer);
  }
}
