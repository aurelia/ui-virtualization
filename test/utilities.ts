import { VirtualRepeat } from '../src/virtual-repeat';

export type Queue = (func: (...args: any[]) => any) => void;

export function createAssertionQueue(): Queue {
  let queue: Array<() => any> = [];
  let next = () => {
    if (queue.length) {
      setTimeout(() => {
        let func = queue.shift();
        func();
        next();
      });
    }
  };

  return (func: () => any) => {
    queue.push(func);
    if (queue.length === 1) {
      next();
    }
  };
}

export function validateState(virtualRepeat: VirtualRepeat, viewModel: any, itemHeight: number) {
  let views = virtualRepeat.viewSlot.children;
  let expectedHeight = viewModel.items.length * itemHeight;
  let topBufferHeight = virtualRepeat.topBuffer.getBoundingClientRect().height;
  let bottomBufferHeight = virtualRepeat.bottomBuffer.getBoundingClientRect().height;
  let renderedItemsHeight = views.length * itemHeight;
  expect(topBufferHeight + renderedItemsHeight + bottomBufferHeight).toBe(expectedHeight);

  if (viewModel.items.length > views.length) {
    expect(topBufferHeight + bottomBufferHeight).toBeGreaterThan(0);
  }

  // validate contextual data
  for (let i = 0; i < views.length; i++) {
    expect(views[i].bindingContext.item).toBe(viewModel.items[i]);
    let overrideContext = views[i].overrideContext;
    expect(overrideContext.parentOverrideContext.bindingContext).toBe(viewModel);
    expect(overrideContext.bindingContext).toBe(views[i].bindingContext);
    let first = i === 0;
    let last = i === viewModel.items.length - 1;
    let even = i % 2 === 0;
    expect(overrideContext.$index).toBe(i);
    expect(overrideContext.$first).toBe(first);
    expect(overrideContext.$last).toBe(last);
    expect(overrideContext.$middle).toBe(!first && !last);
    expect(overrideContext.$odd).toBe(!even);
    expect(overrideContext.$even).toBe(even);
  }
}

export function validateScrolledState(virtualRepeat: VirtualRepeat, viewModel: any, itemHeight: number) {
  let views = virtualRepeat.viewSlot.children;
  let expectedHeight = viewModel.items.length * itemHeight;
  let topBufferHeight = virtualRepeat.topBuffer.getBoundingClientRect().height;
  let bottomBufferHeight = virtualRepeat.bottomBuffer.getBoundingClientRect().height;
  let renderedItemsHeight = views.length * itemHeight;
  expect(topBufferHeight + renderedItemsHeight + bottomBufferHeight).toBe(expectedHeight);

  if (viewModel.items.length > views.length) {
    expect(topBufferHeight + bottomBufferHeight).toBeGreaterThan(0);
  }

  // validate contextual data
  let startingLoc = viewModel.items.indexOf(views[0].bindingContext.item);
  for (let i = startingLoc; i < views.length; i++) {
    expect(views[i].bindingContext.item).toBe(viewModel.items[i]);
    let overrideContext = views[i].overrideContext;
    expect(overrideContext.parentOverrideContext.bindingContext).toBe(viewModel);
    expect(overrideContext.bindingContext).toBe(views[i].bindingContext);
    let first = i === 0;
    let last = i === viewModel.items.length - 1;
    let even = i % 2 === 0;
    expect(overrideContext.$index).toBe(i);
    expect(overrideContext.$first).toBe(first);
    expect(overrideContext.$last).toBe(last);
    expect(overrideContext.$middle).toBe(!first && !last);
    expect(overrideContext.$odd).toBe(!even);
    expect(overrideContext.$even).toBe(even);
  }
}
