import {insertBeforeNode} from './utilities';

export class ViewStrategyLocator {
  getStrategy(element) {
    if (element.parentNode.localName === 'tbody') {
      return new TableStrategy();
    } else {
      return new DefaultStrategy();
    }
  }
}

export class TableStrategy {
  getScrollList(element) {
    return element.parentNode;
  }

  getScrollContainer(element) {
    return this.getScrollList(element).parentElement.parentElement;
  }

  moveViewFirst(view, scrollElement) {
    insertBeforeNode(view, scrollElement, scrollElement.childNodes[2]);
  }

  moveViewLast(view, scrollElement, childrenLength) {
    insertBeforeNode(view, scrollElement, scrollElement.children[childrenLength + 1]);
  }

  createTopBufferElement(scrollList, element) {
    let tr = document.createElement('tr');
    let buffer = document.createElement('td');
    buffer.setAttribute("style","height: 0px");
    tr.appendChild(buffer);
    scrollList.insertBefore(tr, element);
    return buffer;
  }

  createBottomBufferElement(scrollList, element) {
    let tr = document.createElement('tr');
    let buffer = document.createElement('td');
    buffer.setAttribute("style","height: 0px");
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

  moveViewFirst(view, scrollElement) {
    insertBeforeNode(view, scrollElement, scrollElement.childNodes[2]);
  }

  moveViewLast(view, scrollElement, childrenLength) {
    insertBeforeNode(view, scrollElement, scrollElement.children[childrenLength + 1]);
  }

  createTopBufferElement(scrollList, element) {
    let elementName = scrollList.localName === 'ul' ? 'li' : 'div';
    let buffer = document.createElement(elementName);
    buffer.setAttribute("style","height: 0px");
    scrollList.insertBefore(buffer, element);
    return buffer;
  }

  createBottomBufferElement(scrollList, element) {
    let elementName = scrollList.localName === 'ul' ? 'li' : 'div';
    let buffer = document.createElement(elementName);
    buffer.setAttribute("style","height: 0px");
    element.parentNode.insertBefore(buffer, element.nextSibling);
    return buffer;
  }

  removeBufferElements(scrollList, topBuffer, bottomBuffer) {
    scrollList.removeChild(topBuffer);
    scrollList.removeChild(bottomBuffer);
  }
}
