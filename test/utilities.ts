import { VirtualRepeat } from '../src/virtual-repeat';

export type AsyncQueue = (func: (...args: any[]) => any) => void;

export function createAssertionQueue(): AsyncQueue {
  let queue: Array<() => any> = [];
  let next = () => {
    if (queue.length) {
      setTimeout(() => {
        if (queue.length) {
          let func = queue.shift();
          func();
          next();
        }
      }, 1);
    }
  };

  return (func: () => any) => {
    queue.push(func);
    if (queue.length === 1) {
      next();
    }
  };
}

/**
 *
 * @param extraHeight height of static content that contributes to overall heigh. Happen in case of table
 */
export function validateState(virtualRepeat: VirtualRepeat, viewModel: any, itemHeight: number, extraHeight?: number) {
  let views = virtualRepeat.viewSlot.children;
  let expectedHeight = viewModel.items.length * itemHeight;
  let topBufferHeight = virtualRepeat.topBufferEl.getBoundingClientRect().height;
  let bottomBufferHeight = virtualRepeat.bottomBufferEl.getBoundingClientRect().height;
  let renderedItemsHeight = views.length * itemHeight;
  expect(topBufferHeight + renderedItemsHeight + bottomBufferHeight).toBe(
    expectedHeight,
    `Top buffer (${topBufferHeight}) + items height (${renderedItemsHeight}) + bottom buffer (${bottomBufferHeight}) should have been correct`
  );

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
  let topBufferHeight = virtualRepeat.topBufferEl.getBoundingClientRect().height;
  let bottomBufferHeight = virtualRepeat.bottomBufferEl.getBoundingClientRect().height;
  let renderedItemsHeight = views.length * itemHeight;
  expect(topBufferHeight + renderedItemsHeight + bottomBufferHeight).toBe(
    expectedHeight,
    `Top buffer (${topBufferHeight}) + items height (${renderedItemsHeight}) + bottom buffer (${bottomBufferHeight}) should have been correct`
  );

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

/**
 * Manually dispatch a scroll event and validate scrolled state of virtual repeat
 *
 * Programatically set `scrollTop` of element specified with `elementSelector` query string
 * (or `#scrollContainer` by default) to be equal with its `scrollHeight`
 */
export function validateScroll(virtualRepeat: VirtualRepeat, viewModel: any, itemHeight: number, element: Element, done: Function): void {
  let event = new Event('scroll');
  element.scrollTop = element.scrollHeight;
  element.dispatchEvent(event);
  window.setTimeout(() => {
    window.requestAnimationFrame(() => {
      validateScrolledState(virtualRepeat, viewModel, itemHeight);
      done();
    });
  });
}

export async function scrollToEnd(virtualRepeat: VirtualRepeat, insuranceTime = 5): Promise<void> {
  let element = virtualRepeat._fixedHeightContainer ? virtualRepeat.scrollContainer : (document.scrollingElement || document.documentElement);
  element.scrollTop = element.scrollHeight;
  createScrollEvent(element);
  await ensureScrolled(insuranceTime);
}

export async function scrollToIndex(virtualRepeat: VirtualRepeat, itemIndex: number): Promise<void> {
  let element = virtualRepeat._fixedHeightContainer ? virtualRepeat.scrollContainer : (document.scrollingElement || document.documentElement);
  element.scrollTop = virtualRepeat.itemHeight * (itemIndex + 1);
  createScrollEvent(element);
  await ensureScrolled();
}

export async function ensureScrolled(time: number = 1): Promise<void> {
  await waitForTimeout(time);
  await waitForNextFrame();
}


export function waitForTimeout(time = 1): Promise<void> {
  return new Promise(r => setTimeout(r, time));
}

export function waitForNextFrame(): Promise<void> {
  return new Promise(r => requestAnimationFrame(() => r()));
}

export function createScrollEvent(target: EventTarget): void {
  target.dispatchEvent(new Event('scroll'));
}
