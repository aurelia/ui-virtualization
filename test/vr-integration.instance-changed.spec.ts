import './setup';
import { StageComponent, ComponentTester } from 'aurelia-testing';
import { PLATFORM } from 'aurelia-pal';
import { bootstrap } from 'aurelia-bootstrapper';
import { createAssertionQueue, validateState, AsyncQueue, validateScroll, waitForNextFrame, ensureScrolled, waitForTimeout } from './utilities';
import { VirtualRepeat } from '../src/virtual-repeat';
import { IScrollNextScrollContext } from '../src/interfaces';

PLATFORM.moduleName('src/virtual-repeat');
PLATFORM.moduleName('test/noop-value-converter');
PLATFORM.moduleName('src/infinite-scroll-next');

fdescribe('VirtualRepeat Integration - Instance Changed', () => {
  const itemHeight = 100;
  const queue: AsyncQueue = createAssertionQueue();
  let component: ComponentTester<VirtualRepeat>;
  let virtualRepeat: VirtualRepeat;
  let viewModel: any;
  let items: any[];
  let view: string;
  let resources: any[];

  beforeEach(() => {
    component = undefined;
    items = Array.from({ length: 100 }, (_: any, idx: number) => 'item' + idx);
    viewModel = { items: items };
    resources = [
      'src/virtual-repeat',
      'test/noop-value-converter'
    ];
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

  describe('<tr virtual-repeat.for>', () => {
    beforeEach(() => {
      view = `
      <div style="height: 500px; overflow-y: auto">
        <table>
          <tr virtual-repeat.for="item of items" style="height: 50px;">
            <td>\${item}</td>
          </tr>
        </table>
      </div>`;
    });

    it('renders with correct amount of rows', async () => {
      await bootstrapComponent();

      const table = (component['host'] as HTMLElement).querySelector('table');
      expect(virtualRepeat.elementsInView).toBe(Math.ceil(500 / 50) + 1, 'repeat.elementsInView');
      expect(virtualRepeat._viewsLength).toBe(22, 'repeat._viewsLength');
      expect(table.tBodies[0].rows.length).toBe(2 + virtualRepeat._viewsLength); // 2 buffers + 20 rows based on 50 height
      
      expect(virtualRepeat._first).toBe(0);
      expect(virtualRepeat._bottomBufferHeight).toBe(50 * (virtualRepeat.items.length - virtualRepeat._viewsLength));

      // start more difficult cases

      // 1. mutate scroll state
      table.parentElement.scrollTop = table.parentElement.scrollHeight;
      await ensureScrolled();
      // when scrolling, the views count is calculated differently compared to other scenarios
      // as it can be known exactly what the last process was
      // so it can create views with optimal number (scroll container height / itemHeight)
      expect(virtualRepeat._first).toBe(/*items count*/100 - /*views count*/500 / 50 - /*0 based index*/1, 'repeat._first 1');

      virtualRepeat.items = virtualRepeat.items.slice(0).reverse();
      await ensureScrolled();

      expect(virtualRepeat._viewsLength).toBe(22, 'repeat._viewsLength');
      expect(table.tBodies[0].rows.length).toBe(2 + virtualRepeat._viewsLength, 'table > tr count'); // 2 buffers + 20 rows based on 50 height
      // This check is different from the above:
      // after instance changed, it restart the "_first" view based on safe number of views
      expect(virtualRepeat._first).toBe(/*items count*/100 - /*views count*/virtualRepeat._viewsLength, 'repeat._first 2');
      
    });
  });

  function validatePush(virtualRepeat: VirtualRepeat, viewModel: any, done: Function) {
    viewModel.items.push('Foo');
    queue(() => validateState(virtualRepeat, viewModel, itemHeight));

    for (let i = 0; i < 5; ++i) {
      viewModel.items.push(`Foo ${i}`);
    }

    queue(() => validateState(virtualRepeat, viewModel, itemHeight));
    queue(() => done());
  }

  function validateArrayChange(virtualRepeat, viewModel, done) {

    viewModel.items = createItems(4, 'A');
    queue(() => validateState(virtualRepeat, viewModel, itemHeight));
    queue(() => viewModel.items = createItems(0, 'B'));
    queue(() => validateState(virtualRepeat, viewModel, itemHeight));
    queue(() => viewModel.items = createItems(101, 'C'));
    queue(() => validateState(virtualRepeat, viewModel, itemHeight));
    queue(() => viewModel.items = createItems(0, 'D'));
    queue(() => validateState(virtualRepeat, viewModel, itemHeight));
    queue(() => done());
  }

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
