import {insertBeforeNode} from './utilities';

export class DomStrategyLocator {
  getStrategy(element) {
    if (element.parentNode.localName === 'tbody') {
      return new TableStrategy();
    } else {
      return new DivStrategy();
    }
  }
}

export class TableStrategy {
  getScrollElement(element) {
    return element.parentNode.parentNode;
  }

  getWrapperElement(element) {
    return this.getScrollElement(element).parentElement;
  }

  moveViewFirst(view, scrollElement) {
    let parent = scrollElement.firstElementChild;
    insertBeforeNode(view, parent, parent.childNodes[1]);
  }

  moveViewLast(view, scrollElement, childrenLength) {
    let parent = scrollElement.firstElementChild;
    insertBeforeNode(view, parent, parent.children[childrenLength]);
  }
}

export class DivStrategy {
  getScrollElement(element) {
    return element.parentNode;
  }

  getWrapperElement(element) {
    return this.getScrollElement(element).parentElement;
  }

  moveViewFirst(view, scrollElement) {
    insertBeforeNode(view, scrollElement, scrollElement.childNodes[1]);
  }

  moveViewLast(view, scrollElement, childrenLength) {
    insertBeforeNode(view, scrollElement, scrollElement.children[childrenLength]);
  }
}
