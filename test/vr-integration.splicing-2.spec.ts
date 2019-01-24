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
  waitForNextFrame,
  scrollToIndex,
  ITestViewModel
} from './utilities';
import { VirtualRepeat } from '../src/virtual-repeat';
import { ScrollState } from './validator';

PLATFORM.moduleName('src/virtual-repeat');
PLATFORM.moduleName('test/noop-value-converter');
PLATFORM.moduleName('src/infinite-scroll-next');

describe('VirtualRepeat Integration + Splicing', () => {

  let itemHeight = 100;
  let component: ComponentTester<VirtualRepeat>;
  let virtualRepeat: VirtualRepeat;
  let viewModel: ITestViewModel;
  let items: any[];
  let view: string;
  let resources: any[];
  const SAFE_SCROLL_TIMEOUT = 5;

  beforeEach(() => {
    virtualRepeat = undefined;
    component = undefined;
    items = createItems(1000);
    viewModel = { items: items, getNextPage: jasmine.createSpy('getNextPage()') };
    resources = [
      'src/virtual-repeat',
      'test/noop-value-converter',
      'src/infinite-scroll-next'
    ];
    view =
    `<div id="scrollContainer" style="height: 500px; overflow-y: scroll">
      <div
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

  it('scrolls correctly', async () => {
    await bootstrapComponent();

    await scrollToIndex(virtualRepeat, 50);
    ScrollState.validate(virtualRepeat, viewModel);

    await scrollToIndex(virtualRepeat, 100);
    ScrollState.validate(virtualRepeat, viewModel);

    await scrollToIndex(virtualRepeat, 50);
    ScrollState.validate(virtualRepeat, viewModel);

    await scrollToIndex(virtualRepeat, 1000);
    ScrollState.validate(virtualRepeat, viewModel);
  });

  it('scrolls correctly after splicing (Remove only, before range until middle)', async () => {
    await bootstrapComponent();

    await scrollToIndex(virtualRepeat, 50);
    ScrollState.validate(virtualRepeat, viewModel);

    viewModel.items.splice(40, virtualRepeat._requiredViewsCount);
    await ensureScrolled();
    ScrollState.validate(virtualRepeat, viewModel);

    await scrollToIndex(virtualRepeat, 40);
    ScrollState.validate(virtualRepeat, viewModel);
  });

  it('adds view properly after splicing (Add, when existing collection has no item', async () => {
    viewModel.items = [];

    await bootstrapComponent();

    viewModel.items.splice(0, 0, createItems(50));

    await ensureScrolled();
    ScrollState.validate(virtualRepeat, viewModel);

    await scrollToIndex(virtualRepeat, 30);
    ScrollState.validate(virtualRepeat, viewModel);
  });

  async function bootstrapComponent(customView?: string) {
    component = StageComponent
      .withResources(resources)
      .inView(customView || view)
      .boundTo(viewModel);
    await component.create(bootstrap);
    virtualRepeat = component.viewModel;
    return { virtualRepeat, viewModel, component: component };
  }

  function createItems(amount: number, name: string = 'item'): any[] {
    return Array.from({ length: amount }, (_, index) => name + index);
  }
});
