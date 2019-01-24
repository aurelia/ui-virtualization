import { VirtualRepeat } from '../src/virtual-repeat';
import { ITestViewModel, ensureScrolled, createScrollEvent } from './utilities';

export class ScrollState {

  static validate(virtualRepeat: VirtualRepeat, viewModel: ITestViewModel, itemHeight: number = virtualRepeat.itemHeight) {
    let views = virtualRepeat.viewSlot.children;
    let expectedHeight = viewModel.items.length * itemHeight;
    let topBufferHeight = virtualRepeat.topBuffer.getBoundingClientRect().height;
    let bottomBufferHeight = virtualRepeat.bottomBuffer.getBoundingClientRect().height;
    let renderedItemsHeight = views.length * itemHeight;
    expect(topBufferHeight + renderedItemsHeight + bottomBufferHeight).toBe(
      expectedHeight,
      `Top buffer (${topBufferHeight}) + items height (${renderedItemsHeight}) + bottom buffer (${bottomBufferHeight}) should have been correct`
    );

    if (viewModel.items.length > views.length) {
      expect(topBufferHeight + bottomBufferHeight).toBeGreaterThan(0);
    }

    // validate contextual data
    let startingIndex = viewModel.items.indexOf(views[0].bindingContext.item);
    let i = 0;
    let ii = Math.min(viewModel.items.length - startingIndex, views.length);
    for (; i < ii; i++) {
      let itemIndex = startingIndex + i;
      expect(views[i].bindingContext.item).toBe(viewModel.items[itemIndex]);
      let overrideContext = views[i].overrideContext;
      expect(overrideContext.parentOverrideContext.bindingContext).toBe(viewModel);
      expect(overrideContext.bindingContext).toBe(views[i].bindingContext);
      let first = itemIndex === 0;
      let last = itemIndex === viewModel.items.length - 1;
      let even = itemIndex % 2 === 0;
      expect(overrideContext.$index).toBe(itemIndex);
      expect(overrideContext.$first).toBe(first);
      expect(overrideContext.$last).toBe(last);
      expect(overrideContext.$middle).toBe(!first && !last);
      expect(overrideContext.$odd).toBe(!even);
      expect(overrideContext.$even).toBe(even);
    }
  }

  static async scrollToIndex(virtualRepeat: VirtualRepeat, itemIndex: number): Promise<void> {
    let element = virtualRepeat._fixedHeightContainer
      ? virtualRepeat.scrollContainer
      : (document.scrollingElement || document.documentElement);
    element.scrollTop = virtualRepeat.itemHeight * (itemIndex + 1);
    createScrollEvent(element);

    await ensureScrolled();
  }

  static async scrollToMidThenTop(virtualRepeat: VirtualRepeat): Promise<void> {
    let scroller = virtualRepeat._fixedHeightContainer
      ? virtualRepeat.scrollContainer
      : (document.scrollingElement || document.documentElement);

    scroller.scrollTop = scroller.scrollHeight / 2; // Scroll down but not far enough to reach bottom and call 'getNext'
    createScrollEvent(scroller);

    await ensureScrolled();

    scroller.scrollTop = 0;
    createScrollEvent(scroller);
  }
}
