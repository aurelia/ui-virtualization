// tslint:disable
import { View } from 'aurelia-templating';

export class ViewSlotMock {
  children: any[];
  constructor() {
    this.children = [];
  }
  removeAll() {}
  add(view) {
    this.children.push(view);
  }
  insert(index, view) {
    this.children.splice(index, 0, view);
  }
  removeAt(index) {
    if (index < 0) {
      throw 'negative index';
    }
    this.children.splice(index, 1);
  }
}

export class ViewMock {
  bindingContext: any;
  overrideContext: any;
  bind(bindingContext, overrideContext) {
    this.bindingContext = bindingContext;
    this.overrideContext = overrideContext;
  }
  attached() {}
  detached() {}
  unbind() {}
  returnToCache() {}
}

export class BoundViewFactoryMock {
  _viewsRequireLifecycle = true;
  create() {
    return { bind() {} };
  }
  removeAll() {}
}

export class ViewFactoryMock {
  _viewsRequireLifecycle = true;
  create() {
    return new ViewMock();
  }
}

export class ArrayObserverMock {
  subscribe() {}
  unsubscribe() {}
}

export class TemplateStrategyMock {
  getScrollContainer(element: Element)  { }
  moveViewFirst(view: View, topBuffer: Element) { }
  moveViewLast(view: View, bottomBuffer: Element) { }
  createTopBufferElement(element: Element) { }
  createBottomBufferElement(element: Element) { }
  removeBufferElements(element: Element, topBuffer: Element, bottomBuffer: Element) { }
  getFirstElement(topBuffer: Element): Element {
    throw new Error('Method "getFirstElement" not implemented');
  }
  getLastElement(bottomBuffer: Element): Element {
    throw new Error('Method "getLastElement" not implemented');
  }
}

export const instructionMock = {
  behaviorInstructions: [
    {
      originalAttrName: 'virtual-repeat.for',
      attributes: {
        items: {
          sourceExpression: {
            evaluate: (scope, lookupFunctions) => null
          }
        }
      }
    }
  ]
};

export const viewResourcesMock = {
  lookupFunctions: {
    valueConverters: name => null,
    bindingBehaviors: name => null
  }
};
