/* eslint-disable @typescript-eslint/no-unused-vars */
import { bootstrap } from 'aurelia-bootstrapper';
import { PLATFORM } from 'aurelia-pal';
import { ComponentTester, StageComponent } from 'aurelia-testing';
import { VirtualRepeat } from '../src/virtual-repeat';
import { ITestAppInterface } from './interfaces';
import './setup';
import { AsyncQueue, createAssertionQueue, waitForNextFrame } from './utilities';
import { CloneArrayValueConverter, IdentityValueConverter } from './value-converters';
import { eachCartesianJoin } from './lib';
import { calcMinViewsRequired as calcMinViewsRequired } from '../src/utilities';

PLATFORM.moduleName('src/virtual-repeat');
PLATFORM.moduleName('test/noop-value-converter');
PLATFORM.moduleName('src/infinite-scroll-next');

describe('vr-integration.scrolling.spec.ts', () => {
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
      'test/noop-value-converter',
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

  // describe('<tr virtual-repeat.for>', () => {

  //   beforeEach(() => {
  //     view =
  //     `<div style="height: 500px; overflow-y: auto">
  //       <table style="border-spacing: 0">
  //         <tr style="height: 30px">
  //           <th>#</th>
  //           <th>Name</th>
  //         <tr>
  //         <tr virtual-repeat.for="item of items" style="height: 50px;">
  //           <td>\${$index}</td>
  //           <td>\${item}</td>
  //         </tr>
  //       </table>
  //     </div>`;
  //   });

  //   it([
  //     '100 items',
  //     '\t[header row] <-- h:30',
  //     '\t[body rows] <-- h:50 each',
  //     '\t-- scrollTop from 0 to 79 should not affect first row'
  //   ].join('\n'), async () => {
  //     const { viewModel, virtualRepeat } = await bootstrapComponent({ items: createItems(100) });
  //     const scrollCtEl = virtualRepeat.getScroller();
  //     expect(scrollCtEl.scrollHeight).toEqual(100 * 50 + 30, 'scrollCtEl.scrollHeight');
  //     for (let i = 0; 79 > i; ++i) {
  //       scrollCtEl.scrollTop = i;
  //       await waitForNextFrame();
  //       expect(virtualRepeat.view(0).bindingContext.item).toEqual('item0');
  //       // todo: more validation of scrolled state here
  //     }
  //     for (let i = 80; 80 + 49 > i; ++i) {
  //       scrollCtEl.scrollTop = i;
  //       await waitForNextFrame();
  //       expect(virtualRepeat.view(0).bindingContext.item).toEqual('item1');
  //       // todo: more validation of scrolled state here
  //     }
  //   });

  // });

  // describe('<tbody virtual-repeat.for>', () => {

  //   beforeEach(() => {
  //     view =
  //     `<div style="height: 500px; overflow-y: auto">
  //       <table style="border-spacing: 0">
  //         <thead>
  //           <tr style="height: 30px">
  //             <th>#</th>
  //             <th>Name</th>
  //           <tr>
  //         </thead>
  //         <tbody virtual-repeat.for="item of items">
  //           <tr style="height: 50px;">
  //             <td>\${$index}</td>
  //             <td>\${item}</td>
  //           </tr>
  //         </tbody>
  //       </table>
  //     </div>`;
  //   });

  //   it([
  //     '100 items',
  //     '\t[theader row] <-- h:30',
  //     '\t[tbody rows] <-- h:50 each',
  //     '\t-- scrollTop from 0 to 79 should not affect first row'
  //   ].join('\n'), async () => {
  //     const { viewModel, virtualRepeat } = await bootstrapComponent({ items: createItems(100) });
  //     const scrollCtEl = document.querySelector('#scrollCtEl');
  //     expect(scrollCtEl.scrollHeight).toEqual(100 * 50 + 30, 'scrollCtEl.scrollHeight');
  //     for (let i = 0; 79 > i; ++i) {
  //       scrollCtEl.scrollTop = i;
  //       await waitForNextFrame();
  //       expect(virtualRepeat.view(0).bindingContext.item).toEqual('item0');
  //       // todo: more validation of scrolled state here
  //     }
  //     for (let i = 80; 80 + 49 > i; ++i) {
  //       scrollCtEl.scrollTop = i;
  //       await waitForNextFrame();
  //       expect(virtualRepeat.view(0).bindingContext.item).toEqual('item1');
  //       // todo: more validation of scrolled state here
  //     }
  //   });

  // });

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
      '\t-- scrollTop from 0 to 79 should not affect first row',
    ].join('\n'), async () => {
      const { viewModel, virtualRepeat } = await bootstrapComponent({ items: createItems(100) }, view);
      const scrollCtEl = document.querySelector('#scrollCtEl');
      expect(scrollCtEl.scrollHeight).toEqual(
        /* 2 repeats */200
        * /* height of each row */50
        + /* height of header */30
        + /* height of separator */100,
        'scrollCtEl.scrollHeight'
      );
      for (let i = 0; 79 > i; i += 7) {
        scrollCtEl.scrollTop = i;
        await waitForNextFrame();
        expect(virtualRepeat.view(0).bindingContext.item).toEqual('item0');
        // todo: more validation of scrolled state here
      }
      for (let i = 80; 80 + 49 > i; i += 7) {
        scrollCtEl.scrollTop = i;
        await waitForNextFrame();
        expect(virtualRepeat.view(0).bindingContext.item).toEqual('item1');
        // todo: more validation of scrolled state here
      }
      const secondRepeatStart = 100 * 50 + 30 + 100;
      const secondRepeat = component['rootView'].controllers[1].viewModel;
      expect(secondRepeat).toBeDefined();
      for (let i = 0; 50 > i; i += 7) {
        scrollCtEl.scrollTop = secondRepeatStart + i;
        await waitForNextFrame();
        expect(virtualRepeat.topBufferHeight).toEqual(100 * 50 - (500 / 50 + 1) * 2 * 50, 'height:repeat1.topBuffer');
        expect(virtualRepeat.bottomBufferHeight).toEqual(0, 'height:repeat1.botBuffer');
        expect(secondRepeat.view(0).bindingContext.item).toEqual('item0');
        // todo: more validation of scrolled state here
      }
    });
  });

  const repeatScrollNextCombos: IRepeatScrollNextCombo[] = [
    ['', 'infinite-scroll-next="getNextPage"'],
    ['', 'infinite-scroll-next.call="getNextPage($scrollContext)"'],
    [' & toView', 'infinite-scroll-next="getNextPage"'],
    [' & twoWay', 'infinite-scroll-next="getNextPage"'],
    [' & twoWay', 'infinite-scroll-next.call="getNextPage($scrollContext)"'],
    [' | cloneArray', 'infinite-scroll-next="getNextPage"', [CloneArrayValueConverter]],
    [' | cloneArray', 'infinite-scroll-next.call="getNextPage($scrollContext)"', [CloneArrayValueConverter]],
    [' | identity | cloneArray & toView', 'infinite-scroll-next="getNextPage"', [IdentityValueConverter, CloneArrayValueConverter]],
    [' | identity | cloneArray & toView', 'infinite-scroll-next.call="getNextPage($scrollContext)"', [IdentityValueConverter, CloneArrayValueConverter]],
    [' | cloneArray & toView', 'infinite-scroll-next="getNextPage"', [CloneArrayValueConverter]],

    // cloneArray and two way creates infinite loop
    // [' | cloneArray & twoWay', 'infinite-scroll-next="getNextPage"', [CloneArrayValueConverter]]
  ];

  const scrollingTestGroups: IScrollingTestCaseGroup[] = [
    {
      topBufferOffset: 30,
      itemHeight: 50,
      scrollerHeight: 500,
      title: (itemHeight, scrollerHeight, topBufferOffset, repeatAttr: string) =>
        [
          `div[scroller h:${scrollerHeight}] > table > tr[repeat${repeatAttr}]`,
          '-- 100 items',
          `-- [theader row] <-- h:${topBufferOffset}`,
          `-- [tr rows] <-- h:${itemHeight} each`,
          '',
        ].join('\n\t'),
      createView: (itemHeight, scrollerHeight, topBufferOffset, repeatAttr) =>
        `<div style="height: ${scrollerHeight}px; overflow-y: auto">
          <table style="border-spacing: 0">
            <thead>
              <tr style="height: ${topBufferOffset}px">
                <th>#</th>
                <th>Name</th>
              <tr>
            </thead>
            <tr virtual-repeat.for="item of items ${repeatAttr}" style="height: ${itemHeight}px;">
              <td>\${$index}</td>
              <td>\${item}</td>
            </tr>
          </table>
        </div>`,
    },
    {
      topBufferOffset: 30,
      itemHeight: 50,
      scrollerHeight: 500,
      title: (itemHeight, scrollerHeight, topBufferOffset, repeatAttr: string) =>
        [
          `div[scroller h:${scrollerHeight}] > table > tbody[repeat${repeatAttr}]`,
          '-- 100 items',
          `-- [theader row] <-- h:${topBufferOffset}`,
          `-- [tbody rows] <-- h:${itemHeight} each`,
          '',
        ].join('\n\t'),
      createView: (itemHeight, scrollerHeight, topBufferOffset, repeatAttr) =>
        `<div style="height: ${scrollerHeight}px; overflow-y: auto">
          <table style="border-spacing: 0">
            <thead>
              <tr style="height: ${topBufferOffset}px">
                <th>#</th>
                <th>Name</th>
              <tr>
            </thead>
            <tbody virtual-repeat.for="item of items ${repeatAttr}">
              <tr style="height: ${itemHeight}px;">
                <td>\${$index}</td>
                <td>\${item}</td>
              </tr>
            </tbody>
          </table>
        </div>`,
    },
    {
      topBufferOffset: 0,
      itemHeight: 50,
      scrollerHeight: 500,
      title: (itemHeight, scrollerHeight, topBufferOffset, repeatAttr: string) =>
        [
          `div[scroller h:${scrollerHeight}] > ol > li[repeat${repeatAttr}]`,
          '-- 100 items',
          `-- [li rows] <-- h:${itemHeight} each`,
          '',
        ].join('\n\t'),
      createView: (itemHeight, scrollerHeight, topBufferOffset, repeatAttr) =>
        `<div style="height: ${scrollerHeight}px; overflow-y: auto">
          <ol style="list-style: none; margin: 0;">
            <li virtual-repeat.for="item of items ${repeatAttr}" style="height: ${itemHeight}px;">
              \${$index}
            </li>
          </ol>
        </div>`,
    },
    {
      topBufferOffset: 0,
      itemHeight: 50,
      scrollerHeight: 500,
      title: (itemHeight, scrollerHeight, topBufferOffset, repeatAttr: string) =>
        [
          `ol[scroller h:${scrollerHeight}] > li[repeat${repeatAttr}]`,
          '-- 100 items',
          `-- [li rows] <-- h:${itemHeight} each`,
          '',
        ].join('\n\t'),
      createView: (itemHeight, scrollerHeight, topBufferOffset, repeatAttr) =>
        `<ol style="height: ${scrollerHeight}px; overflow-y: auto; list-style: none; margin: 0;">
          <li virtual-repeat.for="item of items ${repeatAttr}" style="height: ${itemHeight}px;">
            \${$index}
          </li>
        </ol>`,
    },
  ];

  eachCartesianJoin(
    [repeatScrollNextCombos, scrollingTestGroups],
    (testAttributesCombo, testGroup) => {
      const [repeatAttr, scrollNextAttr, resources] = testAttributesCombo;
      const { title, itemHeight, scrollerHeight, topBufferOffset, createView, extraAssert } = testGroup;
      runTestGroup(
        title(itemHeight, scrollerHeight, topBufferOffset, repeatAttr),
        createView(itemHeight, scrollerHeight, topBufferOffset, repeatAttr),
        { itemHeight, scrollerHeight, topBufferOffset },
        extraAssert
      );
    }
  );

  function runTestGroup(
    title: string,
    $view: string,
    {
      itemHeight,
      scrollerHeight,
      topBufferOffset,
    }: {
      itemHeight: number;
      scrollerHeight: number;
      topBufferOffset: number;
    },
    extraAssert: (repeat, component) => void,
    extraResources?: any[]
  ): void {
    describe(title, () => {
      it([
        '100 items',
        `-- scrollTop from 0 to ${itemHeight - 1} should not affect first row`,
      ].join('\n\t'), async () => {
        const ITEM_COUNT = 100;
        const { viewModel, virtualRepeat } = await bootstrapComponent(
          { items: createItems(ITEM_COUNT) },
          $view,
          [CloneArrayValueConverter, IdentityValueConverter]
        );
        const scrollCtEl = virtualRepeat.getScroller();
        expect(scrollCtEl.scrollHeight).toEqual(ITEM_COUNT * itemHeight + topBufferOffset, 'scrollCtEl.scrollHeight');
        for (let i = 0; itemHeight > i; i += Math.floor(itemHeight / 9)) {
          scrollCtEl.scrollTop = i;
          await waitForNextFrame();
          expect(virtualRepeat.view(0).bindingContext.item).toEqual('item0');
          // todo: more validation of scrolled state here
        }
        for (let i = itemHeight + topBufferOffset; itemHeight + topBufferOffset + (itemHeight - 1) > i; i += Math.floor(itemHeight / 9)) {
          scrollCtEl.scrollTop = i;
          await waitForNextFrame();
          expect(virtualRepeat.view(0).bindingContext.item).toEqual('item1');
          // todo: more validation of scrolled state here
        }
      });

      it([
        `100 items`,
        `-- scroll to bottom`,
        `-- scroll from bottom to index ${100 - calcMinViewsRequired(scrollerHeight, itemHeight)} should not affect first row`,
      ].join('\n\t'), async () => {
        const ITEM_COUNT = 100;
        const { viewModel, virtualRepeat } = await bootstrapComponent(
          { items: createItems(ITEM_COUNT) },
          $view,
          [CloneArrayValueConverter, IdentityValueConverter]
        );
        const scroller_el = virtualRepeat.getScroller();
        expect(scroller_el.scrollHeight).toEqual(ITEM_COUNT * itemHeight + topBufferOffset, 'scrollCtEl.scrollHeight');
        scroller_el.scrollTop = scroller_el.scrollHeight;
        await waitForNextFrame();
        const minViewsRequired = calcMinViewsRequired(scrollerHeight, itemHeight);
        const maxViewsRequired = minViewsRequired * 2;
        let expected_first_index = 100 - maxViewsRequired;
        expect(virtualRepeat.$first).toBe(expected_first_index, '@scroll bottom -> repeat._first 1');

        const maxScrollTop = scroller_el.scrollTop;
        // only minViewsRequired > i because by default
        // it's already scrolled half way equal to minViewsRequired as scrollTop max = scrollHeight - minViewsRequired * itemHeight
        for (let i = 0; minViewsRequired >= i; ++i) {
          scroller_el.scrollTop = maxScrollTop - i * itemHeight;
          await waitForNextFrame();
          expect(virtualRepeat.$first).toBe(expected_first_index, '@scroll ⬆ -> repeat._first 2:' + i);
        }
      });
    });
  }

  type IRepeatScrollNextCombo = [
    /*repeat extra expression*/string,
    /*infinite-scroll-next attr*/string,
    /*extraResources*/ any[]?
  ];

  interface IScrollingTestCaseGroup {
    topBufferOffset: number;
    itemHeight: number;
    scrollerHeight: number;
    title: (itemHeight: number, scrollerHeight: number, topBufferOffset: number, repeatAttr: string) => string;
    createView: (itemHeight: number, scrollerHeight: number, topBufferOffset: number, repeatAttr: string) => string;
    extraAssert?: (repeat: VirtualRepeat, component: ComponentTester<VirtualRepeat>) => void;
  }

  async function bootstrapComponent<T>($viewModel: ITestAppInterface<T>, $view: string, extraResources: any[] = []) {
    component = StageComponent
      .withResources(Array.from(new Set([...resources, ...extraResources])))
      .inView($view)
      .boundTo($viewModel);
    await component.create(bootstrap);
    return { virtualRepeat: component.viewModel, viewModel: $viewModel, component: component };
  }

  function createItems(amount: number, name = 'item') {
    return Array.from({ length: amount }, (_, index) => name + index);
  }
});
