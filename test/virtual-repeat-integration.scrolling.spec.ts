import './setup';
import { bootstrap } from 'aurelia-bootstrapper';
import { StageComponent, ComponentTester } from 'aurelia-testing';
import { PLATFORM } from 'aurelia-pal';
import {
  createAssertionQueue,
  validateScrolledState,
  AsyncQueue,
  waitForTimeout,
  scrollToEndAndValidateAsync,
  ensureScrolled,
  validateScroll,
  scrollToEnd,
  waitForNextFrame
} from './utilities';
import { VirtualRepeat } from '../src/virtual-repeat';

PLATFORM.moduleName('src/virtual-repeat');
PLATFORM.moduleName('test/noop-value-converter');
PLATFORM.moduleName('src/infinite-scroll-next');

interface ITestItem {}

describe('VirtualRepeat Integration', () => {

  // async queue
  let queue: AsyncQueue = createAssertionQueue();
  let itemHeight = 100;
  let component: ComponentTester<VirtualRepeat>;
  let virtualRepeat: VirtualRepeat;
  let viewModel: any;
  let items: any[];
  let view: string;
  let resources: any[];
  const SAFE_SCROLL_TIMEOUT = 20;

  beforeEach(() => {
    component = undefined;
    items = createItems(1000);
    viewModel = { items: items };
    resources = [
      'src/virtual-repeat',
      'test/noop-value-converter'
    ];
    view =
    `<div id="scrollContainer" style="height: 500px; overflow-y: scroll">
      <div style="height: ${itemHeight}px;"
          virtual-repeat.for="item of items"
          infinite-scroll-next="getNextPage">\${item}</div>
    </div>`;
  });

  afterEach(() => {
    try {
      if (component) {
        component.dispose();
      }
    } catch (ex) {
      console.log('Error disposing component');
      console.error(ex);
    }
  });

  describe('<div/> ~~Scrolling~~', () => {

    it('handles splice when scrolled to end', async () => {
      await bootstrapComponent();

      validateScrolledState(virtualRepeat, viewModel, itemHeight);
      await scrollToEndAndValidateAsync(virtualRepeat, viewModel, itemHeight);

      viewModel.items.splice(995, 1, 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j');

      await ensureScrolled(SAFE_SCROLL_TIMEOUT);

      validateScrolledState(virtualRepeat, viewModel, itemHeight);
      await scrollToEndAndValidateAsync(virtualRepeat, viewModel, itemHeight);

      let views = virtualRepeat.viewSlot.children;
      await waitForTimeout(SAFE_SCROLL_TIMEOUT);
      expect(views[views.length - 1].bindingContext.item).toBe(viewModel.items[viewModel.items.length - 1]);
    });

    it('handles splice removing non-consecutive when scrolled to end', async () => {
      await bootstrapComponent();

      await scrollToEndAndValidateAsync(virtualRepeat, viewModel, itemHeight);

      for (let i = 0, ii = 100; i < ii; i++) {
        viewModel.items.splice(i + 1, 9);
      }

      await ensureScrolled(SAFE_SCROLL_TIMEOUT);
      validateScrolledState(virtualRepeat, viewModel, itemHeight);

      await scrollToEndAndValidateAsync(virtualRepeat, viewModel, itemHeight);

      let views = virtualRepeat.viewSlot.children;
      await waitForTimeout(SAFE_SCROLL_TIMEOUT);
      expect(views[views.length - 1].bindingContext.item).toBe(viewModel.items[viewModel.items.length - 1]);
    });

    it('handles splice non-consecutive when scrolled to end', async () => {
      await bootstrapComponent();

      await scrollToEnd(virtualRepeat);
      validateScrolledState(virtualRepeat, viewModel, itemHeight);

      // remove 3 items every 10 items
      // add one item back, value is i
      for (let i = 0, ii = 80; i < ii; i++) {
        viewModel.items.splice(10 * i, 3, i);
      }

      await scrollToEnd(virtualRepeat);
      validateScrolledState(virtualRepeat, viewModel, itemHeight);

      let views = virtualRepeat.viewSlot.children;
      await waitForTimeout(SAFE_SCROLL_TIMEOUT);
      expect(views[views.length - 1].bindingContext.item).toBe(viewModel.items[viewModel.items.length - 1]);
    });

    it('handles splice removing many -> more items remaining than viewport capacity', async () => {
      await bootstrapComponent();

      // more items remaining than viewslot capacity
      viewModel.items.splice(5, 1000 - virtualRepeat._requiredViewsCount - 10);

      // wait for handle scroll to react
      await ensureScrolled(SAFE_SCROLL_TIMEOUT);
      validateScrolledState(virtualRepeat, viewModel, itemHeight);
    });

    it('handles splice removing -> number of items remaining exactly as viewslot capacity', async () => {
      await bootstrapComponent();
      viewModel.items.splice(5, 1000 - virtualRepeat._requiredViewsCount);
      await waitForNextFrame();
      expect(virtualRepeat.viewSlot.children.length).toBe(viewModel.items.length);

      validateScrolledState(virtualRepeat, viewModel, itemHeight);
    });

    it('handles splice removing -> less items remaining than viewslot capacity', async () => {
      await bootstrapComponent();
      viewModel.items.splice(5, 1000 - virtualRepeat._requiredViewsCount + 10);

      await waitForNextFrame();
      expect(virtualRepeat.viewSlot.children.length).toBe(viewModel.items.length);

      validateScrolledState(virtualRepeat, viewModel, itemHeight);
    });

    it('handles splice removing non-consecutive', async () => {
      await bootstrapComponent();
      for (let i = 0, ii = 100; i < ii; i++) {
        viewModel.items.splice(i + 1, 9);
      }
      await ensureScrolled(SAFE_SCROLL_TIMEOUT);
      validateScrolledState(virtualRepeat, viewModel, itemHeight);
    });

    it('handles splice non-consecutive', async () => {
      await bootstrapComponent();
      for (let i = 0, ii = 100; i < ii; i++) {
        viewModel.items.splice(3 * (i + 1), 3, i);
      }
      await ensureScrolled(SAFE_SCROLL_TIMEOUT);
      validateScrolledState(virtualRepeat, viewModel, itemHeight);
    });

    it('handles splice removing many + add', async () => {
      await bootstrapComponent();
      viewModel.items.splice(5, 990, 'a', 'b', 'c');

      await ensureScrolled(SAFE_SCROLL_TIMEOUT);
      validateScrolledState(virtualRepeat, viewModel, itemHeight);
    });

    it('handles splice remove remaining + add', async () => {
      await bootstrapComponent();
      viewModel.items.splice(5, 995, 'a', 'b', 'c');

      await ensureScrolled(SAFE_SCROLL_TIMEOUT);
      validateScrolledState(virtualRepeat, viewModel, itemHeight);
    });
  });

  describe('<div/> >>> <ul-ol + li/> ~~Scrolling~~', () => {

    beforeEach(() => {
      view =
      `<div id="scrollContainer" style="height: 500px; overflow-y: scroll">
        <ol style="margin: 0;">
          <li style="height: ${itemHeight}px;"
              virtual-repeat.for="item of items"
              infinite-scroll-next="getNextPage">\${item}</li>
        </ol>
      </div>`;
    });

    it('handles splice when scrolled to end', async () => {
      await bootstrapComponent();

      validateScrolledState(virtualRepeat, viewModel, itemHeight);
      await scrollToEndAndValidateAsync(virtualRepeat, viewModel, itemHeight);

      viewModel.items.splice(995, 1, 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j');

      await ensureScrolled(SAFE_SCROLL_TIMEOUT);

      validateScrolledState(virtualRepeat, viewModel, itemHeight);

      await scrollToEnd(virtualRepeat);

      validateScrolledState(virtualRepeat, viewModel, itemHeight);

      let views = virtualRepeat.viewSlot.children;

      await waitForTimeout(SAFE_SCROLL_TIMEOUT);
      expect(views[views.length - 1].bindingContext.item).toBe(viewModel.items[viewModel.items.length - 1]);
    });

    it('handles splice removing non-consecutive when scrolled to end', async () => {
      await bootstrapComponent();

      await scrollToEndAndValidateAsync(virtualRepeat, viewModel, itemHeight);

      for (let i = 0, ii = 100; i < ii; i++) {
        viewModel.items.splice(i + 1, 9);
      }

      await ensureScrolled(SAFE_SCROLL_TIMEOUT);
      validateScrolledState(virtualRepeat, viewModel, itemHeight);

      await scrollToEndAndValidateAsync(virtualRepeat, viewModel, itemHeight);

      let views = virtualRepeat.viewSlot.children;
      await waitForTimeout(SAFE_SCROLL_TIMEOUT);
      expect(views[views.length - 1].bindingContext.item).toBe(viewModel.items[viewModel.items.length - 1]);
    });

    it('handles splice non-consecutive when scrolled to end', async () => {
      await bootstrapComponent();

      await scrollToEnd(virtualRepeat);
      validateScrolledState(virtualRepeat, viewModel, itemHeight);

      // remove 3 items every 10 items
      // add one item back, value is i
      for (let i = 0, ii = 80; i < ii; i++) {
        viewModel.items.splice(10 * i, 3, i);
      }

      await scrollToEnd(virtualRepeat);
      validateScrolledState(virtualRepeat, viewModel, itemHeight);

      let views = virtualRepeat.viewSlot.children;
      await waitForTimeout(SAFE_SCROLL_TIMEOUT);
      expect(views[views.length - 1].bindingContext.item).toBe(viewModel.items[viewModel.items.length - 1]);
    });

    it('handles splice removing many -> more items remaining than viewport capacity', async () => {
      await bootstrapComponent();

      // more items remaining than viewslot capacity
      viewModel.items.splice(5, 1000 - virtualRepeat._requiredViewsCount - 10);

      // wait for handle scroll to react
      await ensureScrolled();
      validateScrolledState(virtualRepeat, viewModel, itemHeight);
    });

    it('handles splice removing -> number of items remaining exactly as viewslot capacity', async () => {
      await bootstrapComponent();
      viewModel.items.splice(5, 1000 - virtualRepeat._requiredViewsCount);
      await waitForNextFrame();
      expect(virtualRepeat.viewSlot.children.length).toBe(viewModel.items.length);

      validateScrolledState(virtualRepeat, viewModel, itemHeight);
    });

    it('handles splice removing -> less items remaining than viewslot capacity', async () => {
      await bootstrapComponent();
      viewModel.items.splice(5, 1000 - virtualRepeat._requiredViewsCount + 10);

      await waitForNextFrame();
      expect(virtualRepeat.viewSlot.children.length).toBe(viewModel.items.length);

      validateScrolledState(virtualRepeat, viewModel, itemHeight);
    });

    it('handles splice removing non-consecutive', async () => {
      await bootstrapComponent();
      for (let i = 0, ii = 100; i < ii; i++) {
        viewModel.items.splice(i + 1, 9);
      }
      await ensureScrolled(SAFE_SCROLL_TIMEOUT);
      validateScrolledState(virtualRepeat, viewModel, itemHeight);
    });

    it('handles splice non-consecutive', async () => {
      await bootstrapComponent();
      for (let i = 0, ii = 100; i < ii; i++) {
        viewModel.items.splice(3 * (i + 1), 3, i);
      }
      await ensureScrolled(SAFE_SCROLL_TIMEOUT);
      validateScrolledState(virtualRepeat, viewModel, itemHeight);
    });

    it('handles splice removing many + add', async () => {
      await bootstrapComponent();
      viewModel.items.splice(5, 990, 'a', 'b', 'c');

      await ensureScrolled(SAFE_SCROLL_TIMEOUT);
      validateScrolledState(virtualRepeat, viewModel, itemHeight);
    });

    it('handles splice remove remaining + add', async () => {
      await bootstrapComponent();
      viewModel.items.splice(5, 995, 'a', 'b', 'c');

      await ensureScrolled(SAFE_SCROLL_TIMEOUT);
      validateScrolledState(virtualRepeat, viewModel, itemHeight);
    });
  });

  describe('<ul-ol + li/> ~~Scrolling~~', () => {

    beforeEach(() => {
      view =
      `<ol id="scrollContainer" style="height: 500px; overflow-y: scroll;">
        <li style="height: ${itemHeight}px;"
            virtual-repeat.for="item of items"
            infinite-scroll-next="getNextPage">\${item}</li>
      </ol>`;
    });

    it('handles splice when scrolled to end', async () => {
      await bootstrapComponent();

      validateScrolledState(virtualRepeat, viewModel, itemHeight);
      await scrollToEndAndValidateAsync(virtualRepeat, viewModel, itemHeight);

      viewModel.items.splice(995, 1, 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j');

      await ensureScrolled(SAFE_SCROLL_TIMEOUT);

      validateScrolledState(virtualRepeat, viewModel, itemHeight);

      await scrollToEnd(virtualRepeat);

      validateScrolledState(virtualRepeat, viewModel, itemHeight);

      let views = virtualRepeat.viewSlot.children;

      await waitForTimeout(SAFE_SCROLL_TIMEOUT);
      expect(views[views.length - 1].bindingContext.item).toBe(viewModel.items[viewModel.items.length - 1]);
    });

    it('handles splice removing non-consecutive when scrolled to end', async () => {
      await bootstrapComponent();

      await scrollToEndAndValidateAsync(virtualRepeat, viewModel, itemHeight);

      for (let i = 0, ii = 100; i < ii; i++) {
        viewModel.items.splice(i + 1, 9);
      }

      await ensureScrolled(SAFE_SCROLL_TIMEOUT);
      validateScrolledState(virtualRepeat, viewModel, itemHeight);

      await scrollToEndAndValidateAsync(virtualRepeat, viewModel, itemHeight);

      let views = virtualRepeat.viewSlot.children;
      await waitForTimeout(SAFE_SCROLL_TIMEOUT);
      expect(views[views.length - 1].bindingContext.item).toBe(viewModel.items[viewModel.items.length - 1]);
    });

    it('handles splice non-consecutive when scrolled to end', async () => {
      await bootstrapComponent();

      await scrollToEnd(virtualRepeat);
      validateScrolledState(virtualRepeat, viewModel, itemHeight);

      // remove 3 items every 10 items
      // add one item back, value is i
      for (let i = 0, ii = 80; i < ii; i++) {
        viewModel.items.splice(10 * i, 3, i);
      }

      await scrollToEnd(virtualRepeat);
      validateScrolledState(virtualRepeat, viewModel, itemHeight);

      let views = virtualRepeat.viewSlot.children;
      await waitForTimeout(SAFE_SCROLL_TIMEOUT);
      expect(views[views.length - 1].bindingContext.item).toBe(viewModel.items[viewModel.items.length - 1]);
    });

    it('handles splice removing many -> more items remaining than viewport capacity', async () => {
      await bootstrapComponent();

      // more items remaining than viewslot capacity
      viewModel.items.splice(5, 1000 - virtualRepeat._requiredViewsCount - 10);

      // wait for handle scroll to react
      await ensureScrolled();
      validateScrolledState(virtualRepeat, viewModel, itemHeight);
    });

    it('handles splice removing -> number of items remaining exactly as viewslot capacity', async () => {
      await bootstrapComponent();
      viewModel.items.splice(5, 1000 - virtualRepeat._requiredViewsCount);
      await waitForNextFrame();
      expect(virtualRepeat.viewSlot.children.length).toBe(viewModel.items.length);

      validateScrolledState(virtualRepeat, viewModel, itemHeight);
    });

    it('handles splice removing -> less items remaining than viewslot capacity', async () => {
      await bootstrapComponent();
      viewModel.items.splice(5, 1000 - virtualRepeat._requiredViewsCount + 10);

      await waitForNextFrame();
      expect(virtualRepeat.viewSlot.children.length).toBe(viewModel.items.length);

      validateScrolledState(virtualRepeat, viewModel, itemHeight);
    });

    it('handles splice removing non-consecutive', async () => {
      await bootstrapComponent();
      for (let i = 0, ii = 100; i < ii; i++) {
        viewModel.items.splice(i + 1, 9);
      }
      await ensureScrolled(SAFE_SCROLL_TIMEOUT);
      validateScrolledState(virtualRepeat, viewModel, itemHeight);
    });

    it('handles splice non-consecutive', async () => {
      await bootstrapComponent();
      for (let i = 0, ii = 100; i < ii; i++) {
        viewModel.items.splice(3 * (i + 1), 3, i);
      }
      await ensureScrolled(SAFE_SCROLL_TIMEOUT);
      validateScrolledState(virtualRepeat, viewModel, itemHeight);
    });

    it('handles splice removing many + add', async () => {
      await bootstrapComponent();
      viewModel.items.splice(5, 990, 'a', 'b', 'c');

      await ensureScrolled(SAFE_SCROLL_TIMEOUT);
      validateScrolledState(virtualRepeat, viewModel, itemHeight);
    });

    it('handles splice remove remaining + add', async () => {
      await bootstrapComponent();
      viewModel.items.splice(5, 995, 'a', 'b', 'c');

      await ensureScrolled(SAFE_SCROLL_TIMEOUT);
      validateScrolledState(virtualRepeat, viewModel, itemHeight);
    });
  });

  describe('<tr/> ~~Scrolling~~', () => {

    beforeEach(() => {
      view =
      `<div id="scrollContainer" style="height: 500px; overflow-y: scroll">
        <table style="border-spacing: 0">
          <tr style="height: ${itemHeight}px;"
              virtual-repeat.for="item of items"
              infinite-scroll-next="getNextPage"><td>\${item}</td></tr>
        </table>
      </div>`;
    });

    it('handles splice when scrolled to end', async () => {
      await bootstrapComponent();

      validateScrolledState(virtualRepeat, viewModel, itemHeight);
      await scrollToEndAndValidateAsync(virtualRepeat, viewModel, itemHeight);

      viewModel.items.splice(995, 1, 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j');

      await ensureScrolled();

      validateScrolledState(virtualRepeat, viewModel, itemHeight);
      await scrollToEndAndValidateAsync(virtualRepeat, viewModel, itemHeight);

      let views = virtualRepeat.viewSlot.children;
      await waitForTimeout(SAFE_SCROLL_TIMEOUT);
      expect(views[views.length - 1].bindingContext.item).toBe(viewModel.items[viewModel.items.length - 1]);
    });

    it('handles splice removing non-consecutive when scrolled to end', async () => {
      await bootstrapComponent();

      await scrollToEndAndValidateAsync(virtualRepeat, viewModel, itemHeight);

      for (let i = 0, ii = 100; i < ii; i++) {
        viewModel.items.splice(i + 1, 9);
      }

      await ensureScrolled();
      validateScrolledState(virtualRepeat, viewModel, itemHeight);

      await scrollToEndAndValidateAsync(virtualRepeat, viewModel, itemHeight);

      let views = virtualRepeat.viewSlot.children;
      await waitForTimeout(SAFE_SCROLL_TIMEOUT);
      expect(views[views.length - 1].bindingContext.item).toBe(viewModel.items[viewModel.items.length - 1]);
    });

    it('handles splice non-consecutive when scrolled to end', async () => {
      await bootstrapComponent();

      await scrollToEnd(virtualRepeat);
      validateScrolledState(virtualRepeat, viewModel, itemHeight);

      // remove 3 items every 10 items
      // add one item back, value is i
      for (let i = 0, ii = 80; i < ii; i++) {
        viewModel.items.splice(10 * i, 3, i);
      }

      await scrollToEnd(virtualRepeat);
      validateScrolledState(virtualRepeat, viewModel, itemHeight);

      let views = virtualRepeat.viewSlot.children;
      await waitForTimeout(SAFE_SCROLL_TIMEOUT);
      expect(views[views.length - 1].bindingContext.item).toBe(viewModel.items[viewModel.items.length - 1]);
    });

    it('handles splice removing many -> more items remaining than viewport capacity', async () => {
      await bootstrapComponent();

      // more items remaining than viewslot capacity
      viewModel.items.splice(5, 1000 - virtualRepeat._requiredViewsCount - 10);

      // wait for handle scroll to react
      await ensureScrolled(SAFE_SCROLL_TIMEOUT);
      validateScrolledState(virtualRepeat, viewModel, itemHeight);
    });

    it('handles splice removing -> number of items remaining exactly as viewslot capacity', async () => {
      await bootstrapComponent();
      viewModel.items.splice(5, 1000 - virtualRepeat._requiredViewsCount);
      await waitForNextFrame();
      expect(virtualRepeat.viewSlot.children.length).toBe(viewModel.items.length);

      validateScrolledState(virtualRepeat, viewModel, itemHeight);
    });

    it('handles splice removing -> less items remaining than viewslot capacity', async () => {
      await bootstrapComponent();
      viewModel.items.splice(5, 1000 - virtualRepeat._requiredViewsCount + 10);

      await waitForNextFrame();
      expect(virtualRepeat.viewSlot.children.length).toBe(viewModel.items.length);

      validateScrolledState(virtualRepeat, viewModel, itemHeight);
    });

    it('handles splice removing non-consecutive', async () => {
      await bootstrapComponent();
      for (let i = 0, ii = 100; i < ii; i++) {
        viewModel.items.splice(i + 1, 9);
      }
      await ensureScrolled();
      validateScrolledState(virtualRepeat, viewModel, itemHeight);
    });

    it('handles splice non-consecutive', async () => {
      await bootstrapComponent();
      for (let i = 0, ii = 100; i < ii; i++) {
        viewModel.items.splice(3 * (i + 1), 3, i);
      }
      await ensureScrolled();
      validateScrolledState(virtualRepeat, viewModel, itemHeight);
    });

    it('handles splice removing many + add', async () => {
      await bootstrapComponent();
      viewModel.items.splice(5, 990, 'a', 'b', 'c');

      await ensureScrolled(SAFE_SCROLL_TIMEOUT);
      validateScrolledState(virtualRepeat, viewModel, itemHeight);
    });

    it('handles splice remove remaining + add', async () => {
      await bootstrapComponent();
      viewModel.items.splice(5, 995, 'a', 'b', 'c');

      await ensureScrolled(SAFE_SCROLL_TIMEOUT);
      validateScrolledState(virtualRepeat, viewModel, itemHeight);
    });
  });

  // Note that is this test, row height is faked but in real app scenario
  // it should behave the same as tbody has the same height with tr when border-spacing is 0
  describe('<tbody/> ~~Scrolling~~', () => {

    beforeEach(() => {
      view =
      `<div id="scrollContainer" style="height: 500px; overflow-y: scroll">
        <table style="border-spacing: 0">
          <thead>
            <tr>
              <td>Name</td>
              <td>Value</td>
            </tr>
          </thead>
          <tbody
              virtual-repeat.for="item of items"
              infinite-scroll-next="getNextPage">
              <tr style="height: ${itemHeight}px;">
                <td>
                  \${item}
                </td>
                <td>
                  \${item}
                </td>
              </tr>
          </tbody>
        </table>
      </div>`;
    });

    it('handles splice when scrolled to end', async () => {
      await bootstrapComponent();

      validateScrolledState(virtualRepeat, viewModel, itemHeight);
      await scrollToEndAndValidateAsync(virtualRepeat, viewModel, itemHeight);

      viewModel.items.splice(995, 1, 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j');

      await ensureScrolled(SAFE_SCROLL_TIMEOUT);

      validateScrolledState(virtualRepeat, viewModel, itemHeight);
      await scrollToEndAndValidateAsync(virtualRepeat, viewModel, itemHeight);

      let views = virtualRepeat.viewSlot.children;
      await waitForTimeout(SAFE_SCROLL_TIMEOUT);
      expect(views[views.length - 1].bindingContext.item).toBe(viewModel.items[viewModel.items.length - 1]);
    });

    it('handles splice removing non-consecutive when scrolled to end', async () => {
      await bootstrapComponent();

      await scrollToEndAndValidateAsync(virtualRepeat, viewModel, itemHeight);

      for (let i = 0, ii = 100; i < ii; i++) {
        viewModel.items.splice(i + 1, 9);
      }

      await ensureScrolled(SAFE_SCROLL_TIMEOUT);
      validateScrolledState(virtualRepeat, viewModel, itemHeight);

      await scrollToEndAndValidateAsync(virtualRepeat, viewModel, itemHeight);

      let views = virtualRepeat.viewSlot.children;
      await waitForTimeout(SAFE_SCROLL_TIMEOUT);
      expect(views[views.length - 1].bindingContext.item).toBe(viewModel.items[viewModel.items.length - 1]);
    });

    it('handles splice non-consecutive when scrolled to end', async () => {
      await bootstrapComponent();

      await scrollToEnd(virtualRepeat);
      validateScrolledState(virtualRepeat, viewModel, itemHeight);

      // remove 3 items every 10 items
      // add one item back, value is i
      for (let i = 0, ii = 80; i < ii; i++) {
        viewModel.items.splice(10 * i, 3, i);
      }

      await scrollToEnd(virtualRepeat);
      validateScrolledState(virtualRepeat, viewModel, itemHeight);

      let views = virtualRepeat.viewSlot.children;
      await waitForTimeout(SAFE_SCROLL_TIMEOUT);
      expect(views[views.length - 1].bindingContext.item).toBe(viewModel.items[viewModel.items.length - 1]);
    });

    it('handles splice removing many -> more items remaining than viewport capacity', async () => {
      await bootstrapComponent();

      // more items remaining than viewslot capacity
      viewModel.items.splice(5, 1000 - virtualRepeat._requiredViewsCount - 10);

      // wait for handle scroll to react
      await ensureScrolled(SAFE_SCROLL_TIMEOUT);
      validateScrolledState(virtualRepeat, viewModel, itemHeight);
    });

    it('handles splice removing -> number of items remaining exactly as viewslot capacity', async () => {
      await bootstrapComponent();
      viewModel.items.splice(5, 1000 - virtualRepeat._requiredViewsCount);
      await waitForNextFrame();
      expect(virtualRepeat.viewSlot.children.length).toBe(viewModel.items.length);

      validateScrolledState(virtualRepeat, viewModel, itemHeight);
    });

    it('handles splice removing -> less items remaining than viewslot capacity', async () => {
      await bootstrapComponent();
      viewModel.items.splice(5, 1000 - virtualRepeat._requiredViewsCount + 10);

      await waitForNextFrame();
      expect(virtualRepeat.viewSlot.children.length).toBe(viewModel.items.length);

      validateScrolledState(virtualRepeat, viewModel, itemHeight);
    });

    it('handles splice removing non-consecutive', async () => {
      await bootstrapComponent();
      for (let i = 0, ii = 100; i < ii; i++) {
        viewModel.items.splice(i + 1, 9);
      }
      await ensureScrolled(SAFE_SCROLL_TIMEOUT);
      validateScrolledState(virtualRepeat, viewModel, itemHeight);
    });

    it('handles splice non-consecutive', async () => {
      await bootstrapComponent();
      for (let i = 0, ii = 100; i < ii; i++) {
        viewModel.items.splice(3 * (i + 1), 3, i);
      }
      await ensureScrolled();
      validateScrolledState(virtualRepeat, viewModel, itemHeight);
    });

    it('handles splice removing many + add', async () => {
      await bootstrapComponent();
      viewModel.items.splice(5, 990, 'a', 'b', 'c');

      await ensureScrolled(SAFE_SCROLL_TIMEOUT);
      validateScrolledState(virtualRepeat, viewModel, itemHeight);
    });

    it('handles splice remove remaining + add', async () => {
      await bootstrapComponent();
      viewModel.items.splice(5, 995, 'a', 'b', 'c');

      await ensureScrolled(SAFE_SCROLL_TIMEOUT);
      validateScrolledState(virtualRepeat, viewModel, itemHeight);
    });
  });

  async function bootstrapComponent() {
    component = StageComponent
      .withResources(resources)
      .inView(view)
      .boundTo(viewModel);
    await component.create(bootstrap);
    virtualRepeat = component.viewModel;
    return { virtualRepeat, viewModel, component: component };
  }

  function createItems(amount: number, name: string = 'item') {
    return Array.from({ length: amount }, (_, index) => name + index);
  }
});
