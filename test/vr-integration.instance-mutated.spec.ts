import './setup';
import { PLATFORM } from 'aurelia-pal';
import { validateScrolledState, ensureScrolled, scrollToEnd, waitForNextFrame, validateState } from './utilities';
import { VirtualRepeat } from '../src/virtual-repeat';
import { StageComponent, ComponentTester } from 'aurelia-testing';
import { bootstrap } from 'aurelia-bootstrapper';
import { ITestAppInterface } from './interfaces';

PLATFORM.moduleName('src/virtual-repeat');
PLATFORM.moduleName('test/noop-value-converter');
PLATFORM.moduleName('src/infinite-scroll-next');

describe('VirtualRepeat Integration -- Mutation Handling', () => {
  let component: ComponentTester<VirtualRepeat>;
  let items: any[];
  let view: string;
  let resources: any[];
  let itemHeight: number = 100;

  beforeEach(() => {
    component = undefined;
    items = createItems(1000);
    resources = [
      'src/virtual-repeat',
      'test/noop-value-converter'
    ];
    view =
      `<div id="scrollContainer" style="height: 500px; overflow-y: scroll;">
        <div style="height: ${itemHeight}px;" virtual-repeat.for="item of items">\${item}</div>
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

  it('handles splice when scrolled to end', async () => {
    const { virtualRepeat, viewModel } = await bootstrapComponent({ items: items });
    await scrollToEnd(virtualRepeat);

    viewModel.items.splice(995, 1, 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j');
    await waitForNextFrame();
    validateScrolledState(virtualRepeat, viewModel, itemHeight);

    await scrollToEnd(virtualRepeat);
    let views = virtualRepeat.viewSlot.children;
    expect(views[views.length - 1].bindingContext.item).toBe(viewModel.items[viewModel.items.length - 1]);
  });

  it('handles splice removing non-consecutive when scrolled to end', async () => {
    const { virtualRepeat, viewModel } = await bootstrapComponent({
      items: items,
      getNextPage: function() {
        let itemLength = this.items.length;
        for (let i = 0; i < 100; ++i) {
          let itemNum = itemLength + i;
          this.items.push('item' + itemNum);
        }
      }
    });
    await scrollToEnd(virtualRepeat);

    for (let i = 0, ii = 100; i < ii; i++) {
      viewModel.items.splice(i + 1, 9);
    }

    await waitForNextFrame();
    validateScrolledState(virtualRepeat, viewModel, itemHeight);

    await scrollToEnd(virtualRepeat);
    let views = virtualRepeat.viewSlot.children;
    expect(views[views.length - 1].bindingContext.item).toBe(viewModel.items[viewModel.items.length - 1]);
  });

  it('handles splice non-consecutive when scrolled to end', async () => {
    const { virtualRepeat, viewModel } = await bootstrapComponent({ items: items });
    await scrollToEnd(virtualRepeat);

    for (let i = 0, ii = 80; i < ii; i++) {
      viewModel.items.splice(10 * i, 3, i as any);
    }

    await waitForNextFrame();
    validateScrolledState(virtualRepeat, viewModel, itemHeight);

    await scrollToEnd(virtualRepeat);
    let views = virtualRepeat.viewSlot.children;
    expect(views[views.length - 1].bindingContext.item).toBe(viewModel.items[viewModel.items.length - 1]);
  });

  it('handles splice removing many', async () => {
    const { virtualRepeat, viewModel } = await bootstrapComponent({ items: items });
    await scrollToEnd(virtualRepeat);
    expect(virtualRepeat._viewsLength).toBe(12, 'virtualRepeat.viewsLength');
    // more items remaining than viewslot capacity
    viewModel.items.splice(5, 1000 - virtualRepeat._viewsLength - 12);

    await waitForNextFrame();
    expect(virtualRepeat._first).toBe(1000 - (1000 - virtualRepeat._viewsLength), 'virtualRepeat._first 1');
    validateScrolledState(virtualRepeat, viewModel, itemHeight);
  });

  it('handles splice removing more', async () => {
    // number of items remaining exactly as viewslot capacity
    const { virtualRepeat, viewModel } = await bootstrapComponent({ items: items });
    await scrollToEnd(virtualRepeat);

    viewModel.items.splice(5, 1000 - virtualRepeat._viewsLength);

    await waitForNextFrame();

    expect(virtualRepeat.viewSlot.children.length).toBe(viewModel.items.length);
    validateScrolledState(virtualRepeat, viewModel, itemHeight);
  });

  // less items remaining than viewslot capacity
  it('handles splice removing even more', async () => {
    const { virtualRepeat, viewModel } = await bootstrapComponent({ items: items });
    await scrollToEnd(virtualRepeat);

    viewModel.items.splice(5, 1000 - virtualRepeat._viewsLength + 10);

    await waitForNextFrame();

    expect(virtualRepeat.viewSlot.children.length).toBe(viewModel.items.length);
    validateScrolledState(virtualRepeat, viewModel, itemHeight);
  });

  it('handles splice removing non-consecutive', async () => {
    const { virtualRepeat, viewModel } = await bootstrapComponent({ items: items });
    await scrollToEnd(virtualRepeat);

    for (let i = 0, ii = 100; i < ii; i++) {
      viewModel.items.splice(i + 1, 9);
    }

    await waitForNextFrame();
    validateScrolledState(virtualRepeat, viewModel, itemHeight);
  });

  it('handles splice non-consecutive', async () => {
    const { virtualRepeat, viewModel } = await bootstrapComponent({ items: items });
    await scrollToEnd(virtualRepeat);

    for (let i = 0, ii = 100; i < ii; i++) {
      viewModel.items.splice(3 * (i + 1), 3, i as any);
    }
    await waitForNextFrame();

    validateScrolledState(virtualRepeat, viewModel, itemHeight);
  });

  it('handles splice removing many + add', async () => {
    let scrollCount = 0;
    const { virtualRepeat, viewModel } = await bootstrapComponent({ items: items });
    virtualRepeat.element.parentElement.onscroll = () => {
      scrollCount++;
    };
    await scrollToEnd(virtualRepeat);
    expect(scrollCount).toBe(2, '@scroll 1');
    expect(virtualRepeat.element.parentElement.scrollTop).toBe(100 * 995);

    viewModel.items.splice(5, 990, {}, {});
    expect(scrollCount).toBe(2, '@scroll 2');
    expect(virtualRepeat.items.length).toBe(12, 'items.length 1');
    expect(virtualRepeat.element.parentElement.scrollTop).toBe(100 * 995);

    await waitForNextFrame();
    expect(scrollCount).toBe(3, '@scroll 3');
    validateScrolledState(virtualRepeat, viewModel, itemHeight);
    virtualRepeat.element.parentElement.onscroll = null;
  });

  // this case is a bit differnet to above case,
  // where final result after mutation is 1 item over the max views count required
  // the previous test above has same number of items and views required
  it('handles splice removing many + add', async () => {
    let scrollCount = 0;
    const { virtualRepeat, viewModel } = await bootstrapComponent({ items: items });
    virtualRepeat.element.parentElement.onscroll = () => {
      scrollCount++;
    };
    await scrollToEnd(virtualRepeat);
    expect(scrollCount).toBe(2, '@scroll 1');
    expect(virtualRepeat.element.parentElement.scrollTop).toBe(100 * 995);

    viewModel.items.splice(5, 990, {}, {}, {});
    expect(scrollCount).toBe(2, '@scroll 2');
    expect(virtualRepeat.items.length).toBe(13, 'items.length 1');
    expect(virtualRepeat.element.parentElement.scrollTop).toBe(100 * 995);

    await waitForNextFrame();
    expect(scrollCount).toBe(3, '@scroll 3');
    validateScrolledState(virtualRepeat, viewModel, itemHeight);
    virtualRepeat.element.parentElement.onscroll = null;
  });

  it('handles splice remove remaining + add', async () => {
    const { virtualRepeat, viewModel } = await bootstrapComponent({ items: items });
    await scrollToEnd(virtualRepeat);

    viewModel.items.splice(5, 995, 'a', 'b', 'c');

    await waitForNextFrame();
    validateScrolledState(virtualRepeat, viewModel, itemHeight);
  });

  async function bootstrapComponent<T>($viewModel?: ITestAppInterface<T>, $view?: string) {
    component = StageComponent
      .withResources(resources)
      .inView($view || view)
      .boundTo($viewModel);
    await component.create(bootstrap);
    return { virtualRepeat: component.viewModel, viewModel: $viewModel, component: component };
  }

  function createItems(amount: number, name: string = 'item') {
    return Array.from({ length: amount }, (_, index) => name + index);
  }
});
