import './setup';
import { PLATFORM } from 'aurelia-pal';
import { validateScrolledState, ensureScrolled, scrollToEnd, waitForNextFrame, validateState, waitForTimeout } from './utilities';
import { VirtualRepeat } from '../src/virtual-repeat';
import { StageComponent, ComponentTester } from 'aurelia-testing';
import { bootstrap } from 'aurelia-bootstrapper';
import { ITestAppInterface } from './interfaces';
import { eachCartesianJoin, eachCartesianJoinAsync } from './lib';

PLATFORM.moduleName('src/virtual-repeat');
PLATFORM.moduleName('test/noop-value-converter');
PLATFORM.moduleName('src/infinite-scroll-next');

xdescribe('VirtualRepeat Integration -- Mutation Handling', () => {
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

  function runTestCases(ctHeight: number, ctWidth: number, $view: string, extraResources: any[] = []) {
    const createView = (height: number, width: number) => {
      view =
      `<div id="scrollContainer" style="height: 500px; overflow-y: scroll;">
        <div style="height: ${itemHeight}px;" virtual-repeat.for="item of items">\${item}</div>
      </div>`;
    };
    it([
      '100 items',
      '\t[rows] <-- h:30 each',
      '\t[ct resized] <-- h:60 each',
      '\t-- scroll range synced'
    ].join('\n'), async () => {
      const { viewModel, virtualRepeat } = await bootstrapComponent({ items: createItems(100) });
      const scrollCtEl = document.querySelector('#scrollCtEl');
      expect(scrollCtEl.scrollHeight).toEqual(100 * 50 + 30, 'scrollCtEl.scrollHeight');
      for (let i = 0; 79 > i; ++i) {
        scrollCtEl.scrollTop = i;
        await waitForNextFrame();
        expect(virtualRepeat.view(0).bindingContext.item).toEqual('item0');
        // todo: more validation of scrolled state here
      }
      for (let i = 80; 80 + 49 > i; ++i) {
        scrollCtEl.scrollTop = i;
        await waitForNextFrame();
        expect(virtualRepeat.view(0).bindingContext.item).toEqual('item1');
        // todo: more validation of scrolled state here
      }
    });

    async function bootstrapComponent<T>($viewModel?: ITestAppInterface<T>) {
      component = StageComponent
        .withResources([
          ...resources,
          ...extraResources
        ])
        .inView($view)
        .boundTo($viewModel);
      await component.create(bootstrap);
      expect(document.body.contains(component.element)).toBe(true, 'repeat is setup in document');
      return { virtualRepeat: component.viewModel, viewModel: $viewModel, component: component };
    }
  }

  interface IResizingTestCase {
    start: <T>(view: string, viewModel: ITestAppInterface<T>, resources: any[]) => void | Promise<void>;
  }

  function createItems(amount: number, name: string = 'item') {
    return Array.from({ length: amount }, (_, index) => name + index);
  }
});
