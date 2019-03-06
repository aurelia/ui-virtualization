import { bootstrap } from 'aurelia-bootstrapper';
import { PLATFORM } from 'aurelia-pal';
import { ComponentTester, StageComponent } from 'aurelia-testing';
import { VirtualRepeat } from '../src/virtual-repeat';
import { ITestAppInterface } from './interfaces';
import './setup';
import { AsyncQueue, createAssertionQueue, ensureScrolled, validateState, createScrollEvent, waitForNextFrame } from './utilities';

PLATFORM.moduleName('src/virtual-repeat');
PLATFORM.moduleName('test/noop-value-converter');
PLATFORM.moduleName('src/infinite-scroll-next');

describe('VirtualRepeat Integration - Scrolling', () => {
  const itemHeight = 100;
  const queue: AsyncQueue = createAssertionQueue();
  let component: ComponentTester<VirtualRepeat>;
  // let viewModel: any;
  let items: string[];
  let view: string;
  let resources: any[];

  beforeEach(() => {
    component = undefined;
    items = Array.from({ length: 100 }, (_: any, idx: number) => 'item' + idx);
    // viewModel = { items: items };
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
  
  // Note that any test related to table, ignore border spacing as it's not easy to calculate in test environment
  // todo: have tests for margin / border spacing

  describe('<tr virtual-repeat.for>', () => {

    beforeEach(() => {
      view =
      `<div id="scrollCtEl" style="height: 500px; overflow-y: auto">
        <table style="border-spacing: 0">
          <tr style="height: 30px">
            <th>#</th>
            <th>Name</th>
          <tr>
          <tr virtual-repeat.for="item of items" style="height: 50px;">
            <td>\${$index}</td>
            <td>\${item}</td>
          </tr>
        </table>
      </div>`;
    });

    it([
      '100 items',
      '\t[header row] <-- h:30',
      '\t[body rows] <-- h:50 each',
      '\t-- scrollTop from 0 to 79 should not affect first row'
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

  });

  describe('<tbody virtual-repeat.for>', () => {

    beforeEach(() => {
      view =
      `<div id="scrollCtEl" style="height: 500px; overflow-y: auto">
        <table style="border-spacing: 0">
          <thead>
            <tr style="height: 30px">
              <th>#</th>
              <th>Name</th>
            <tr>
          </thead>
          <tbody virtual-repeat.for="item of items">
            <tr style="height: 50px;">
              <td>\${$index}</td>
              <td>\${item}</td>
            </tr>
          </tbody>
        </table>
      </div>`;
    });

    it([
      '100 items',
      '\t[theader row] <-- h:30',
      '\t[tbody rows] <-- h:50 each',
      '\t-- scrollTop from 0 to 79 should not affect first row'
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

  });

  describe('multiple repeats', () => {
    
    beforeEach(() => {
      view =
      `<div id="scrollCtEl" style="height: 500px; overflow-y: auto">
        <table style="border-spacing: 0">
          <tr style="height: 30px">
            <th>#</th>
            <th>Name</th>
          <tr>
          <tr virtual-repeat.for="item of items" style="height: 50px;">
            <td>\${$index}</td>
            <td>\${item}</td>
          </tr>
          <tr style="height: 100px">
            <td colspan="2">Separator</td>
          </tr>
          <tr virtual-repeat.for="item of items" style="height: 50px;">
            <td>\${$index}</td>
            <td>\${item}</td>
          </tr>
        </table>
      </div>`;
    });

    it([
      '100 items.',
      '\t[header row] <-- h:30',
      '\t[body rows] <-- h:50 each',
      '\t[separator row] <-- h:100',
      '\t[body rows] <-- h:50 each',
      '\t-- scrollTop from 0 to 79 should not affect first row'
    ].join('\n'), async () => {
      const { viewModel, virtualRepeat } = await bootstrapComponent({ items: createItems(100) });
      const scrollCtEl = document.querySelector('#scrollCtEl');
      expect(scrollCtEl.scrollHeight).toEqual(
        /* 2 repeats */200
        * /* height of each row */50
        + /* height of header */30
        + /* height of separator */100,
        'scrollCtEl.scrollHeight'
      );
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
      const secondRepeatStart = 100 * 50 + 30 + 100;
      const secondRepeat = component['rootView'].controllers[1].viewModel;
      expect(secondRepeat).toBeDefined();
      for (let i = 0; 50 > i; ++i) {
        scrollCtEl.scrollTop = secondRepeatStart + i;
        await waitForNextFrame();
        expect(virtualRepeat._topBufferHeight).toEqual(100 * 50 - (500 / 50 + 1) * 2 * 50, 'height:repeat1.topBuffer');
        expect(virtualRepeat._bottomBufferHeight).toEqual(0, 'height:repeat1.botBuffer');
        expect(secondRepeat.view(0).bindingContext.item).toEqual('item0');
        // todo: more validation of scrolled state here
      }
    });
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
