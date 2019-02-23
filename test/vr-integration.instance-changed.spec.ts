import { bootstrap } from 'aurelia-bootstrapper';
import { PLATFORM } from 'aurelia-pal';
import { ComponentTester, StageComponent } from 'aurelia-testing';
import { VirtualRepeat } from '../src/virtual-repeat';
import { ITestAppInterface } from './interfaces';
import './setup';
import { AsyncQueue, createAssertionQueue, ensureScrolled, validateState, createScrollEvent } from './utilities';

PLATFORM.moduleName('src/virtual-repeat');
PLATFORM.moduleName('test/noop-value-converter');
PLATFORM.moduleName('src/infinite-scroll-next');

describe('VirtualRepeat Integration - Instance Changed', () => {
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

  describe('<tr virtual-repeat.for>', () => {
    beforeEach(() => {
      view =
      `<div style="height: 500px; overflow-y: auto">
        <table>
          <tr virtual-repeat.for="item of items" style="height: 50px;">
            <td>\${item}</td>
          </tr>
        </table>
      </div>`;
    });

    // In this test, it bootstraps a stage with 100 items
    // 1. validates everythng is renderred correctly: number of rows, first index, bot buffer height
    // 2. scrolls to bottom
    //    validates everything is renderred correctly: number of rows, first index, bot buffer height
    // 3. shallow clones existing array, reverses then assign to current view model
    //    validates everything is renderred correctly: number of rows, first index, bot buffer height
    it('renders with 100 items', async () => {
      const { virtualRepeat, viewModel } = await bootstrapComponent({ items: items });

      const table = (component['host'] as HTMLElement).querySelector('table');
      expect(virtualRepeat.elementsInView).toBe(Math.ceil(500 / 50) + 1, 'repeat.elementsInView');
      expect(virtualRepeat._viewsLength).toBe(22, 'repeat._viewsLength');
      expect(table.tBodies[0].rows.length).toBe(2 + virtualRepeat._viewsLength); // 2 buffers + 20 rows based on 50 height
      
      expect(virtualRepeat._first).toBe(0);
      expect(virtualRepeat._bottomBufferHeight).toBe(50 * (virtualRepeat.items.length - virtualRepeat._viewsLength));

      // start more difficult cases

      // 1. mutate scroll state
      table.parentElement.scrollTop = table.parentElement.scrollHeight;
      await ensureScrolled(50);
      expect(virtualRepeat._viewsLength).toBe(22, 'repeat._viewsLength');
      // when scrolling, the first bound row is calculated differently compared to other scenarios
      // as it can be known exactly what the last process was
      // so it can create views with optimal number (scroll container height / itemHeight)
      expect(virtualRepeat._first).toBe(/*items count*/100 - /*views count*/500 / 50 - /*0 based index*/1, 'repeat._first 1');
      expect(virtualRepeat._bottomBufferHeight).toBe(0);

      viewModel.items = viewModel.items.slice(0).reverse();
      await ensureScrolled();

      expect(virtualRepeat._viewsLength).toBe(22, 'repeat._viewsLength');
      expect(table.tBodies[0].rows.length).toBe(2 + virtualRepeat._viewsLength, 'table > tr count'); // 2 buffers + 20 rows based on 50 height
      // This check is different from the above:
      // after instance changed, it restart the "_first" view based on safe number of views
      expect(virtualRepeat._first).toBe(/*items count*/100 - /*views count*/virtualRepeat._viewsLength, 'repeat._first 2');

      for (let i = 0, ii = viewModel.items.length - virtualRepeat._first; ii > i; ++i) {
        const view = virtualRepeat.view(i);
        const currIndex = i + virtualRepeat._first;
        expect(view).not.toBeNull(`view-${i} !== null`);
        expect(view.bindingContext.item).toBe(`item${viewModel.items.length - currIndex - 1}`);
        expect((view.firstChild as Element).firstElementChild.textContent).toBe(`item${viewModel.items.length - currIndex - 1}`);
      }
      expect(virtualRepeat._bottomBufferHeight).toBe(0);
    });

    // In this test, it bootstraps a stage with 100 items
    // 1. validates everythng is renderred correctly: number of rows, first index, bot buffer height
    // 2. scrolls to bottom
    //    validates everything is renderred correctly: number of rows, first index, bot buffer height
    // 3. shallow clones existing array, reverses and slice from 0 to 30 then assign to current view model
    //    validates everything is renderred correctly: number of rows, first index, bot buffer height
    it([
      'renders with 100 items',
      '  -- reduces to 30',
      '  -- greater than (repeat._viewsLength)',
    ].join('\n\t'), async () => {
      const { virtualRepeat, viewModel } = await bootstrapComponent({ items: items });

      const table = (component['host'] as HTMLElement).querySelector('table');
      expect(virtualRepeat.elementsInView).toBe(Math.ceil(500 / 50) + 1, 'repeat.elementsInView');
      expect(virtualRepeat._viewsLength).toBe(22, 'repeat._viewsLength');
      expect(table.tBodies[0].rows.length).toBe(2 + virtualRepeat._viewsLength); // 2 buffers + 20 rows based on 50 height
      
      expect(virtualRepeat._first).toBe(0);
      expect(virtualRepeat._bottomBufferHeight).toBe(50 * (virtualRepeat.items.length - virtualRepeat._viewsLength));

      // start more difficult cases

      // 1. mutate scroll state
      table.parentElement.scrollTop = table.parentElement.scrollHeight;
      await ensureScrolled(50);
      expect(virtualRepeat._viewsLength).toBe(22, 'repeat._viewsLength');
      // when scrolling, the first bound row is calculated differently compared to other scenarios
      // as it can be known exactly what the last process was
      // so it can create views with optimal number (scroll container height / itemHeight)
      expect(virtualRepeat._first).toBe(/*items count*/100 - /*views count*/500 / 50 - /*0 based index*/1, 'repeat._first 1');
      expect(virtualRepeat._bottomBufferHeight).toBe(0);

      viewModel.items = viewModel.items.slice(0).reverse().slice(0, 30);
      await ensureScrolled(50);

      expect(virtualRepeat._viewsLength).toBe(22, 'repeat._viewsLength');
      expect(table.tBodies[0].rows.length).toBe(2 + virtualRepeat._viewsLength, 'table > tr count'); // 2 buffers + 20 rows based on 50 height

      // This check is different from the above:
      // after instance changed, it restart the "_first" view based on safe number of views
      // this safe number of views is different with the case of no collection size changes
      // this case triggers a scroll event
      expect(virtualRepeat._first).toBe(/*items count*/30 - /*element in views*/11, 'repeat._first 2');

      // the following check is based on subtraction of total items count and total views count
      // as total number of views hasn't been changed, and their binding contexts created by [repeat]
      // haven't been changed either, despite scroll event happened
      for (let i = 0, ii = viewModel.items.length - virtualRepeat._viewsLength; ii > i; ++i) {
        const view = virtualRepeat.view(i);
        const currIndex = i + (viewModel.items.length - virtualRepeat._viewsLength);
        expect(view).not.toBeNull(`view-${i} !== null`);
        expect(view.bindingContext.item).toBe(`item${100 - currIndex - 1}`, 'bindingContext.item');
        expect((view.firstChild as Element).firstElementChild.textContent).toBe(`item${100 - currIndex - 1}`, 'row.textContent');
      }
      expect(virtualRepeat._bottomBufferHeight).toBe(0);
    });

    // In this test, it bootstraps a stage with 100 items
    // 1. validates everythng is renderred correctly: number of rows, first index, bot buffer height
    // 2. scrolls to bottom
    //    validates everything is renderred correctly: number of rows, first index, bot buffer height
    // 3. shallow clones existing array, reverses and slice from 0 to 30 then assign to current view model
    //    validates everything is renderred correctly: number of rows, first index, bot buffer height
    it([
      'renders with 100 items',
      '  -- reduces to 16',
      '  -- lesser than (repeat._viewsLength)',
      '  -- greater than (repeat.elementsInView)'
    ].join('\n\t'), async () => {
      const { virtualRepeat, viewModel } = await bootstrapComponent({ items: items });

      const table = (component['host'] as HTMLElement).querySelector('table');
      expect(virtualRepeat.elementsInView).toBe(Math.ceil(500 / 50) + 1, 'repeat.elementsInView');
      expect(virtualRepeat._viewsLength).toBe(22, 'repeat._viewsLength');
      expect(table.tBodies[0].rows.length).toBe(2 + virtualRepeat._viewsLength); // 2 buffers + 20 rows based on 50 height
      
      expect(virtualRepeat._first).toBe(0);
      expect(virtualRepeat._bottomBufferHeight).toBe(50 * (virtualRepeat.items.length - virtualRepeat._viewsLength));

      // start more difficult cases

      // 1. mutate scroll state
      table.parentElement.scrollTop = table.parentElement.scrollHeight;
      await ensureScrolled(50);
      expect(virtualRepeat._viewsLength).toBe(22, 'repeat._viewsLength');
      // when scrolling, the first bound row is calculated differently compared to other scenarios
      // as it can be known exactly what the last process was
      // so it can create views with optimal number (scroll container height / itemHeight)
      expect(virtualRepeat._first).toBe(/*items count*/100 - /*views count*/500 / 50 - /*0 based index*/1, 'repeat._first 1');
      expect(virtualRepeat._bottomBufferHeight).toBe(0);

      viewModel.items = viewModel.items.slice(0).reverse().slice(0, 16);
      await ensureScrolled(50);

      expect(virtualRepeat._viewsLength).toBe(22, 'repeat._viewsLength');
      expect(table.tBodies[0].rows.length).toBe(2 + 16, 'table > tr count'); // 2 buffers + 20 rows based on 50 height

      // This check is different from the above:
      // after instance changed, it restart the "_first" view based on safe number of views
      // this safe number of views is different with the case of no collection size changes
      // this case triggers a scroll event
      expect(virtualRepeat._first).toBe(/*items count*/16 - /*element in views*/11, 'repeat._first 2');

      // the following check is based on subtraction of total items count and total views count
      // as total number of views hasn't been changed, and their binding contexts created by [repeat]
      // haven't been changed either, despite scroll event happened
      for (let i = 0, ii = viewModel.items.length - virtualRepeat._viewsLength; ii > i; ++i) {
        const view = virtualRepeat.view(i);
        const currIndex = i + (viewModel.items.length - virtualRepeat._viewsLength);
        expect(view).not.toBeNull(`view-${i} !== null`);
        expect(view.bindingContext.item).toBe(`item${100 - currIndex - 1}`, 'bindingContext.item');
        expect((view.firstChild as Element).firstElementChild.textContent).toBe(`item${100 - currIndex - 1}`, 'row.textContent');
      }
      expect(virtualRepeat._bottomBufferHeight).toBe(0);
    });

    // In this test, it bootstraps a stage with 100 items
    // 1. validates everythng is renderred correctly: number of rows, first index, bot buffer height
    // 2. scrolls to bottom
    //    validates everything is renderred correctly: number of rows, first index, bot buffer height
    // 3. shallow clones existing array, reverses and slice from 0 to 30 then assign to current view model
    //    validates everything is renderred correctly: number of rows, first index, bot buffer height
    it([
      'renders with 100 items',
      '  -- reduces to 8',
      '  -- lesser than (repeat.elementsInView)',
    ].join('\n\t'), async () => {
      const { virtualRepeat, viewModel } = await bootstrapComponent({ items: items });

      const table = (component['host'] as HTMLElement).querySelector('table');
      expect(virtualRepeat.elementsInView).toBe(Math.ceil(500 / 50) + 1, 'repeat.elementsInView');
      expect(virtualRepeat._viewsLength).toBe(22, 'repeat._viewsLength');
      expect(table.tBodies[0].rows.length).toBe(2 + virtualRepeat._viewsLength); // 2 buffers + 20 rows based on 50 height
      
      expect(virtualRepeat._first).toBe(0);
      expect(virtualRepeat._bottomBufferHeight).toBe(50 * (virtualRepeat.items.length - virtualRepeat._viewsLength));

      // start more difficult cases

      // 1. mutate scroll state
      table.parentElement.scrollTop = table.parentElement.scrollHeight;
      await ensureScrolled(50);
      expect(virtualRepeat._viewsLength).toBe(22, 'repeat._viewsLength');
      // when scrolling, the first bound row is calculated differently compared to other scenarios
      // as it can be known exactly what the last process was
      // so it can create views with optimal number (scroll container height / itemHeight)
      expect(virtualRepeat._first).toBe(/*items count*/100 - /*views count*/500 / 50 - /*0 based index*/1, 'repeat._first 1');
      expect(virtualRepeat._bottomBufferHeight).toBe(0);

      viewModel.items = viewModel.items.slice(0).reverse().slice(0, 8);
      await ensureScrolled(50);

      expect(virtualRepeat._viewsLength).toBe(22, 'repeat._viewsLength');
      expect(table.tBodies[0].rows.length).toBe(2 + 8, 'table > tr count'); // 2 buffers + 20 rows based on 50 height

      // This check is different from the above:
      // after instance changed, it restart the "_first" view based on safe number of views
      // this safe number of views is different with the case of no collection size changes
      // this case triggers a scroll event
      expect(virtualRepeat._first).toBe(0, 'repeat._first 2');

      // the following check is based on subtraction of total items count and total views count
      // as total number of views hasn't been changed, and their binding contexts created by [repeat]
      // haven't been changed either, despite scroll event happened
      for (let i = 0, ii = viewModel.items.length - virtualRepeat._viewsLength; ii > i; ++i) {
        const view = virtualRepeat.view(i);
        const currIndex = i + (viewModel.items.length - virtualRepeat._viewsLength);
        expect(view).not.toBeNull(`view-${i} !== null`);
        expect(view.bindingContext.item).toBe(`item${100 - currIndex - 1}`, 'bindingContext.item');
        expect((view.firstChild as Element).firstElementChild.textContent).toBe(`item${100 - currIndex - 1}`, 'row.textContent');
      }
      expect(virtualRepeat._topBufferHeight).toBe(0);
      expect(virtualRepeat._bottomBufferHeight).toBe(0);
      expect(virtualRepeat.topBufferEl.getBoundingClientRect().height).toBe(0);
      expect(virtualRepeat.bottomBufferEl.getBoundingClientRect().height).toBe(0);
    });
  });

  describe('<tbody virtual-repeat.for>', () => {
    beforeEach(() => {
      view =
      `<div style="height: 500px; overflow-y: auto">
        <table style="border-spacing: 0">
          <tbody virtual-repeat.for="item of items">
            <tr style="height: 50px;">
              <td>\${item}</td>
            </tr>
          </tbody>
        </table>
      </div>`;
    });

    it('renders with 100 items', async () => {
      const { virtualRepeat, viewModel } = await bootstrapComponent({ items: items });

      const table = (component['host'] as HTMLElement).querySelector('table');
      expect(virtualRepeat.elementsInView).toBe(Math.ceil(500 / 50) + 1, 'repeat.elementsInView');
      expect(virtualRepeat._viewsLength).toBe(22, 'repeat._viewsLength');
      // buffers are TR element
      expect(table.tBodies.length).toBe(/*no buffer 2 +*/virtualRepeat._viewsLength, 'table.tBodies.length 1'); // 2 buffers + 20 rows based on 50 height
      
      expect(virtualRepeat._first).toBe(0);
      expect(virtualRepeat._bottomBufferHeight).toBe(50 * (virtualRepeat.items.length - virtualRepeat._viewsLength));

      // start more difficult cases

      // 1. mutate scroll state
      table.parentElement.scrollTop = table.parentElement.scrollHeight;
      await ensureScrolled(50);
      expect(virtualRepeat._viewsLength).toBe(22, 'repeat._viewsLength');
      // when scrolling, the first bound row is calculated differently compared to other scenarios
      // as it can be known exactly what the last process was
      // so it can create views with optimal number (scroll container height / itemHeight)
      expect(virtualRepeat._first).toBe(/*items count*/100 - /*views count*/500 / 50 - /*0 based index*/1, 'repeat._first 1');
      expect(virtualRepeat._bottomBufferHeight).toBe(0);

      viewModel.items = viewModel.items.slice(0).reverse();
      await ensureScrolled();

      expect(virtualRepeat._viewsLength).toBe(22, 'repeat._viewsLength');
      // buffers are TR elements
      expect(table.tBodies.length).toBe(/*no buffer 2 +*/virtualRepeat._viewsLength, 'table.tBodies.length 2'); // 2 buffers + 20 rows based on 50 height
      // This check is different from the above:
      // after instance changed, it restart the "_first" view based on safe number of views
      expect(virtualRepeat._first).toBe(/*items count*/100 - /*views count*/virtualRepeat._viewsLength, 'repeat._first 2');

      for (let i = 0, ii = viewModel.items.length - virtualRepeat._first; ii > i; ++i) {
        const view = virtualRepeat.view(i);
        const currIndex = i + virtualRepeat._first;
        expect(view).not.toBeNull(`view-${i} !== null`);
        expect(view.bindingContext.item).toBe(`item${viewModel.items.length - currIndex - 1}`);
        expect((view.firstChild as Element).firstElementChild.firstElementChild.textContent).toBe(`item${viewModel.items.length - currIndex - 1}`);
      }
      expect(virtualRepeat._bottomBufferHeight).toBe(0);
    });

    it([
      'renders with 100 items',
      '  -- reduces to 30',
      '  -- greater than (repeat._viewsLength)',
    ].join('\n\t'), async () => {
      const { virtualRepeat, viewModel } = await bootstrapComponent({ items: items });

      const table = (component['host'] as HTMLElement).querySelector('table');
      expect(virtualRepeat.elementsInView).toBe(Math.ceil(500 / 50) + 1, 'repeat.elementsInView');
      expect(virtualRepeat._viewsLength).toBe(22, 'repeat._viewsLength');
      // buffers are TR elements
      expect(table.tBodies.length).toBe(/*no buffer 2 +*/virtualRepeat._viewsLength, 'table.tBodies.length 1'); // 2 buffers + 20 rows based on 50 height
      
      expect(virtualRepeat._first).toBe(0);
      expect(virtualRepeat._bottomBufferHeight).toBe(50 * (virtualRepeat.items.length - virtualRepeat._viewsLength), 'repeat._bottomBufferHeight');

      // start more difficult cases

      // 1. mutate scroll state
      table.parentElement.scrollTop = table.parentElement.scrollHeight;
      await ensureScrolled(50);
      expect(virtualRepeat._viewsLength).toBe(22, 'repeat._viewsLength');
      // when scrolling, the first bound row is calculated differently compared to other scenarios
      // as it can be known exactly what the last process was
      // so it can create views with optimal number (scroll container height / itemHeight)
      expect(virtualRepeat._first).toBe(/*items count*/100 - /*views count*/500 / 50 - /*0 based index*/1, 'repeat._first 1');
      expect(virtualRepeat._bottomBufferHeight).toBe(0);

      viewModel.items = viewModel.items.slice(0).reverse().slice(0, 30);
      await ensureScrolled(50);

      expect(virtualRepeat._viewsLength).toBe(22, 'repeat._viewsLength');
      // buffers are TR elements
      expect(table.tBodies.length).toBe(/*no buffer 2 +*/virtualRepeat._viewsLength, 'table.tBodies.length 2'); // 2 buffers + 20 rows based on 50 height

      // This check is different from the above:
      // after instance changed, it restart the "_first" view based on safe number of views
      // this safe number of views is different with the case of no collection size changes
      // this case triggers a scroll event
      expect(virtualRepeat._first).toBe(/*items count*/30 - /*element in views*/11, 'repeat._first 2');

      // the following check is based on subtraction of total items count and total views count
      // as total number of views hasn't been changed, and their binding contexts created by [repeat]
      // haven't been changed either, despite scroll event happened
      for (let i = 0, ii = viewModel.items.length - virtualRepeat._viewsLength; ii > i; ++i) {
        const view = virtualRepeat.view(i);
        const currIndex = i + (viewModel.items.length - virtualRepeat._viewsLength);
        expect(view).not.toBeNull(`view-${i} !== null`);
        expect(view.bindingContext.item).toBe(`item${100 - currIndex - 1}`, 'bindingContext.item');
        expect((view.firstChild as Element).firstElementChild.firstElementChild.textContent).toBe(`item${100 - currIndex - 1}`, 'row.textContent');
      }
      expect(virtualRepeat._bottomBufferHeight).toBe(0);
    });

    it([
      'renders with 100 items',
      '  -- reduces to 16',
      '  -- lesser than (repeat._viewsLength)',
      '  -- greater than (repeat.elementsInView)'
    ].join('\n\t'), async () => {
      const { virtualRepeat, viewModel } = await bootstrapComponent({ items: items });

      const table = (component['host'] as HTMLElement).querySelector('table');
      expect(virtualRepeat.elementsInView).toBe(Math.ceil(500 / 50) + 1, 'repeat.elementsInView');
      expect(virtualRepeat._viewsLength).toBe(22, 'repeat._viewsLength');
      // buffers are TR elements
      expect(table.tBodies.length).toBe(/*no buffer 2 +*/virtualRepeat._viewsLength, 'table.tBodies.length'); // 2 buffers + 20 rows based on 50 height
      
      expect(virtualRepeat._first).toBe(0);
      expect(virtualRepeat._bottomBufferHeight).toBe(50 * (virtualRepeat.items.length - virtualRepeat._viewsLength));

      // start more difficult cases

      // 1. mutate scroll state
      table.parentElement.scrollTop = table.parentElement.scrollHeight;
      await ensureScrolled(50);
      expect(virtualRepeat._viewsLength).toBe(22, 'repeat._viewsLength');
      // when scrolling, the first bound row is calculated differently compared to other scenarios
      // as it can be known exactly what the last process was
      // so it can create views with optimal number (scroll container height / itemHeight)
      expect(virtualRepeat._first).toBe(/*items count*/100 - /*views count*/500 / 50 - /*0 based index*/1, 'repeat._first 1');
      expect(virtualRepeat._bottomBufferHeight).toBe(0, 'repeat._bottomBufferHeight');

      viewModel.items = viewModel.items.slice(0).reverse().slice(0, 16);
      await ensureScrolled(50);

      expect(virtualRepeat._viewsLength).toBe(22, 'repeat._viewsLength');
      // buffers are TR elements
      expect(table.tBodies.length).toBe(/*no buffer 2 +*/16, 'table.tBodies.length'); // 2 buffers + 20 rows based on 50 height

      // This check is different from the above:
      // after instance changed, it restart the "_first" view based on safe number of views
      // this safe number of views is different with the case of no collection size changes
      // this case triggers a scroll event
      expect(virtualRepeat._first).toBe(/*items count*/16 - /*element in views*/11, 'repeat._first 2');

      // the following check is based on subtraction of total items count and total views count
      // as total number of views hasn't been changed, and their binding contexts created by [repeat]
      // haven't been changed either, despite scroll event happened
      for (let i = 0, ii = viewModel.items.length - virtualRepeat._viewsLength; ii > i; ++i) {
        const view = virtualRepeat.view(i);
        const currIndex = i + (viewModel.items.length - virtualRepeat._viewsLength);
        expect(view).not.toBeNull(`view-${i} !== null`);
        expect(view.bindingContext.item).toBe(`item${100 - currIndex - 1}`, 'bindingContext.item');
        expect((view.firstChild as Element).firstElementChild.firstElementChild.textContent).toBe(`item${100 - currIndex - 1}`, 'row.textContent');
      }
      expect(virtualRepeat._bottomBufferHeight).toBe(0);
    });

    it([
      'renders with 100 items',
      '  -- reduces to 8',
      '  -- lesser than (repeat.elementsInView)',
    ].join('\n\t'), async () => {
      const { virtualRepeat, viewModel } = await bootstrapComponent({ items: items });

      const table = (component['host'] as HTMLElement).querySelector('table');
      expect(virtualRepeat.elementsInView).toBe(Math.ceil(500 / 50) + 1, 'repeat.elementsInView');
      expect(virtualRepeat._viewsLength).toBe(22, 'repeat._viewsLength');
      // buffers are tr elements
      expect(table.tBodies.length).toBe(/*no buffer 2 +*/virtualRepeat._viewsLength, 'table.tBodies.length 1'); // 2 buffers + 20 rows based on 50 height
      
      expect(virtualRepeat._first).toBe(0);
      expect(virtualRepeat._bottomBufferHeight).toBe(50 * (virtualRepeat.items.length - virtualRepeat._viewsLength));

      // start more difficult cases

      // 1. mutate scroll state
      table.parentElement.scrollTop = table.parentElement.scrollHeight;
      await ensureScrolled(50);
      expect(virtualRepeat._viewsLength).toBe(22, 'repeat._viewsLength');
      // when scrolling, the first bound row is calculated differently compared to other scenarios
      // as it can be known exactly what the last process was
      // so it can create views with optimal number (scroll container height / itemHeight)
      expect(virtualRepeat._first).toBe(/*items count*/100 - /*views count*/500 / 50 - /*0 based index*/1, 'repeat._first 1');
      expect(virtualRepeat._bottomBufferHeight).toBe(0);

      viewModel.items = viewModel.items.slice(0).reverse().slice(0, 8);
      await ensureScrolled(50);

      expect(virtualRepeat._viewsLength).toBe(22, 'repeat._viewsLength');
      // buffers are tr elements
      expect(table.tBodies.length).toBe(/*no buffer 2 +*/8, 'table.tBodies.length 2'); // 2 buffers + 20 rows based on 50 height

      // This check is different from the above:
      // after instance changed, it restart the "_first" view based on safe number of views
      // this safe number of views is different with the case of no collection size changes
      // this case triggers a scroll event
      expect(virtualRepeat._first).toBe(0, 'repeat._first 2');

      // the following check is based on subtraction of total items count and total views count
      // as total number of views hasn't been changed, and their binding contexts created by [repeat]
      // haven't been changed either, despite scroll event happened
      for (let i = 0, ii = viewModel.items.length - virtualRepeat._viewsLength; ii > i; ++i) {
        const view = virtualRepeat.view(i);
        const currIndex = i + (viewModel.items.length - virtualRepeat._viewsLength);
        expect(view).not.toBeNull(`view-${i} !== null`);
        expect(view.bindingContext.item).toBe(`item${100 - currIndex - 1}`, 'bindingContext.item');
        expect((view.firstChild as Element).firstElementChild.firstElementChild.textContent).toBe(`item${100 - currIndex - 1}`, 'row.textContent');
      }
      expect(virtualRepeat._topBufferHeight).toBe(0);
      expect(virtualRepeat._bottomBufferHeight).toBe(0);
      expect(virtualRepeat.topBufferEl.getBoundingClientRect().height).toBe(0);
      expect(virtualRepeat.bottomBufferEl.getBoundingClientRect().height).toBe(0);
    });
  });


  async function bootstrapComponent<T>($viewModel?: ITestAppInterface<T>) {
    component = StageComponent
      .withResources(resources)
      .inView(view)
      .boundTo($viewModel);
    await component.create(bootstrap);
    return { virtualRepeat: component.viewModel, viewModel: $viewModel, component: component };
  }

  function createItems(amount: number, name: string = 'item') {
    return Array.from({ length: amount }, (_, index) => name + index);
  }
});
