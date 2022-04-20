import './setup';
import { StageComponent, ComponentTester } from 'aurelia-testing';
import { PLATFORM } from 'aurelia-pal';
import { bootstrap } from 'aurelia-bootstrapper';
import { validateScrolledState, waitForNextFrame, waitForFrames, scrollRepeat } from './utilities';
import { VirtualRepeat } from '../src/virtual-repeat';
import { ITestAppInterface } from './interfaces';
import { eachCartesianJoin } from './lib';

PLATFORM.moduleName('src/virtual-repeat');
PLATFORM.moduleName('test/noop-value-converter');
PLATFORM.moduleName('src/infinite-scroll-next');

describe('vr-integration.infinite-scroll.spec.ts', () => {
  const resources = [
    'src/virtual-repeat',
    'src/infinite-scroll-next',
    'test/noop-value-converter',
  ];
  class IdentityValueConverter {
    static $resource = {
      type: 'valueConverter',
      name: 'identity',
    };
    toView(val: any[]) {
      return val;
    }
  }
  class CloneArrayValueConverter {
    static $resource = {
      type: 'valueConverter',
      name: 'cloneArray',
    };
    toView(val: any[]) {
      return Array.isArray(val) ? val.slice() : val;
    }
  }

  let component: ComponentTester<VirtualRepeat>;
  let view: string;
  let itemHeight = 100;

  beforeEach(() => {
    component = undefined;
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

  const testGroups: ITestCaseGroup[] = [
    {
      desc: 'div > div',
      title: (repeatExpression, scrollNextAttr) =>
        `div > div[repeat ${repeatExpression}][${scrollNextAttr}]`,
      createView: (repeatExpression, scrollNextAttr) =>
        `<div style="height: 500px; overflow-y: scroll">
          <div
            virtual-repeat.for="item of items ${repeatExpression}"
            ${scrollNextAttr}
            style="height: ${itemHeight}px;">\${item}</div>
        </div>`,
    },
    {
      desc: 'ul > li',
      title: (repeatExpression, scrollNextAttr) =>
        `ul > li[repeat ${repeatExpression}][${scrollNextAttr}]`,
      createView: (repeatExpression, scrollNextAttr) =>
        `<ul style="height: 500px; overflow-y: scroll; padding: 0; margin: 0;">
          <li
            virtual-repeat.for="item of items ${repeatExpression}"
            ${scrollNextAttr}
            style="height: ${itemHeight}px;">\${item}</li>
        </ul>`,
    },
    {
      desc: 'ol > li',
      title: (repeatExpression, scrollNextAttr) =>
        `ol > li[repeat ${repeatExpression}][${scrollNextAttr}]`,
      createView: (repeatExpression, scrollnextAttr) =>
        `<ol style="height: 500px; overflow-y: scroll; padding: 0; margin: 0;">
          <li
            virtual-repeat.for="item of items ${repeatExpression}"
            ${scrollnextAttr}
            style="height: ${itemHeight}px;">\${item}</li>
        </ol>`,
    },
    {
      desc: 'div > table > tr',
      title: (repeatExpression: string, scrollNextAttr: string): string => {
        return `div > table > tr[repeat ${repeatExpression}][${scrollNextAttr}]`;
      },
      createView: (repeatExpression: string, scrollNextAttr: string): string => {
        return `<div style="height: 500px; overflow-y: scroll; padding: 0; margin: 0;">
          <table style="border-spacing: 0">
            <tr
              virtual-repeat.for="item of items ${repeatExpression}"
              ${scrollNextAttr}
              style="height: ${itemHeight}px;"><td>\${item}</td></tr>
          </table>
        </div>`;
      },
    },
    {
      desc: 'div > table > tbody',
      title: (repeatExpression: string, scrollNextAttr: string): string => {
        return `div > table > tbody[repeat${repeatExpression}][${scrollNextAttr}]`;
      },
      createView: (repeatExpression: string, scrollNextAttr: string): string => {
        return `<div style="height: 500px; overflow-y: scroll; padding: 0; margin: 0;">
          <table style="border-spacing: 0">
            <tbody
              virtual-repeat.for="item of items ${repeatExpression}"
              ${scrollNextAttr}>
              <tr
                style="height: ${itemHeight}px;">
                <td>\${item}</td>
              </tr>
            </tbody>
          </table>
        </div>`;
      },
    },
  ];

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

  eachCartesianJoin(
    [repeatScrollNextCombos, testGroups],
    ([repeatExpression, scrollNextAttr, extraResources], { title, createView }) => {
      runTestGroup(
        title(repeatExpression, scrollNextAttr),
        createView(repeatExpression, scrollNextAttr),
        extraResources
      );
    }
  );

  type IRepeatScrollNextCombo = [/*repeat extra expression*/string, /*infinite-scroll-next attr*/string, /*extraResources*/ any[]?];

  interface ITestCaseGroup {
    desc?: string;
    title: (repeatExpression: string, scrollNextAttr: string) => string;
    createView: (repeatExpression: string, scrollNextAttr: string) => string;
  }

  function runTestGroup(title: string, $view: string, extraResources: any[] = []): void {

    it([
      title,
      'Initial 3 - 4 - 5 - 6 items',
      ' -- wait',
      ' -- assert get more',
      '',
    ].join('\n\t'), async () => {
      let scrollNextArgs: [number, boolean, boolean];
      const spy = jasmine.createSpy('viewModel.getNextPage(): void', function(this: ITestAppInterface<string>, ...args: any[]) {
        scrollNextArgs = normalizeScrollNextArgs(args);
        let itemLength = this.items.length;
        for (let i = 0; i < 100; ++i) {
          let itemNum = itemLength + i;
          this.items.push('item' + itemNum);
        }
      }).and.callThrough();
      let { component, virtualRepeat, viewModel } = await bootstrapComponent(
        {
          items: createItems(3),
          getNextPage: spy,
        },
        extraResources,
        $view
      );

      await waitForNextFrame();
      expect(virtualRepeat.minViewsRequired).toBe(6, 'repeat.elementsInView');
      expect(spy.calls.count()).toBe(1, '3 items getNextPage() calls');
      // await waitForNextFrame();
      // expect(spy.calls.count()).toBe(1, '3 items - next frame -- getNextPage() calls');
      let [firstIndex, isAtBottom, isAtTop] = scrollNextArgs;
      expect(firstIndex).toBe(0, 'scrollNextArgs[0] 1');
      expect(isAtBottom).toBe(true, 'scrollNextArgs[1] -- isAtBottom 1');
      expect(isAtTop).toBe(true, 'scrollNextArgs[2] -- isAtTop 1');

      expect(viewModel.items.length).toBe(103, 'items.length 1');
      validateScrolledState(virtualRepeat, viewModel, itemHeight);

      component.dispose();
      spy.calls.reset();

      ({ component, virtualRepeat, viewModel } = await bootstrapComponent(
        {
          items: createItems(4),
          getNextPage: spy,
        },
        extraResources,
        $view
      ));
      await waitForNextFrame();
      expect(virtualRepeat.minViewsRequired * 2).toBe(12, 'repeat._viewsLength');
      expect(spy.calls.count()).toBe(1, '4 items getNextPage() calls');
      [firstIndex, isAtBottom, isAtTop] = scrollNextArgs;
      expect(firstIndex).toBe(0, 'scrollNextArgs[0] 2');
      expect(isAtBottom).toBe(true, 'scrollNextArgs[1] -- isAtBottom 2');
      expect(isAtTop).toBe(true, 'scrollNextArgs[2] -- isAtTop 2');

      expect(viewModel.items.length).toBe(104, 'items.length 2');
      validateScrolledState(virtualRepeat, viewModel, itemHeight);

      component.dispose();
      spy.calls.reset();

      ({ component, virtualRepeat, viewModel } = await bootstrapComponent(
        {
          items: createItems(5),
          getNextPage: spy,
        },
        extraResources,
        $view
      ));
      await waitForNextFrame();
      expect(virtualRepeat.minViewsRequired * 2).toBe(12, 'repeat._viewsLength');
      expect(spy.calls.count()).toBe(1, '5 items getNextPage() calls');
      [firstIndex, isAtBottom, isAtTop] = scrollNextArgs;
      expect(firstIndex).toBe(0, 'scrollNextArgs[0] 3');
      expect(isAtBottom).toBe(true, 'scrollNextArgs[1] -- isAtBottom 3');
      expect(isAtTop).toBe(true, 'scrollNextArgs[2] -- isAtTop 3');

      expect(viewModel.items.length).toBe(105, 'items.length 3');
      validateScrolledState(virtualRepeat, viewModel, itemHeight);

      component.dispose();
      spy.calls.reset();

      ({ component, virtualRepeat, viewModel } = await bootstrapComponent(
        {
          items: createItems(6),
          getNextPage: spy,
        },
        extraResources,
        $view
      ));
      await waitForNextFrame();
      expect(virtualRepeat.minViewsRequired * 2).toBe(12, 'repeat._viewsLength');
      expect(spy.calls.count()).toBe(0, '6 items = 0 getNextPage() calls');
      [firstIndex, isAtBottom, isAtTop] = scrollNextArgs;
      expect(firstIndex).toBe(0, 'scrollNextArgs[0] 4');
      expect(isAtBottom).toBe(true, 'scrollNextArgs[1] -- isAtBottom 4');
      expect(isAtTop).toBe(true, 'scrollNextArgs[2] -- isAtTop 4');

      expect(viewModel.items.length).toBe(6, 'items.length 4');
      validateScrolledState(virtualRepeat, viewModel, itemHeight);
    });

    it([
      title,
      'Initial 100 items',
      ' -- scroll down + get 100 more',
      ' -- wait',
      ' -- scroll up + get 100 more',
      '',
    ].join('\n\t'), async () => {
      const spy = jasmine.createSpy('viewModel.getNextPage(): void', function(this: ITestAppInterface<string>) {
        let itemLength = this.items.length;
        for (let i = 0; i < 100; ++i) {
          let itemNum = itemLength + i;
          this.items.push('item' + itemNum);
        }
      }).and.callThrough();
      const { virtualRepeat, viewModel } = await bootstrapComponent(
        {
          items: createItems(100),
          getNextPage: spy,
        },
        extraResources,
        $view
      );
      expect(virtualRepeat.minViewsRequired * 2).toBe(12, 'repeat._viewsLength');
      expect(spy.calls.count()).toBe(0, 'no getNextPage() calls');

      expect(viewModel.items.length).toBe(100, 'items.length 1');
      validateScrolledState(virtualRepeat, viewModel, itemHeight);

      scrollRepeat(virtualRepeat, 'end');
      expect(spy.calls.count()).toBe(0, '@scroll 1 start -> end');
      await waitForFrames(1);
      expect(spy.calls.count()).toBe(0, '@scroll 1 start -> end');
      await waitForFrames(2);
      expect(spy.calls.count()).toBe(1, '@scroll 1 start -> end');
      expect(viewModel.items.length).toBe(200, 'items.length 2');
      let firstViewIndex = virtualRepeat.firstViewIndex();
      let lastViewIndex = virtualRepeat.lastViewIndex();
      expect(firstViewIndex).toBeGreaterThanOrEqual(100 - (5 + 1) * 2, 'repeat._firstViewIndex() 1');
      expect(firstViewIndex).toBeLessThan(200 - (5 + 1) * 2, 'repeat._firstViewIndex < bottom');
      expect(lastViewIndex).toBeGreaterThanOrEqual(100, 'repeat._lastViewIndex() 1');
      validateScrolledState(virtualRepeat, viewModel, itemHeight);

      scrollRepeat(virtualRepeat, 'start');
      expect(spy.calls.count()).toBe(1, '@scroll 2 end -> start');
      await waitForFrames(1);
      expect(spy.calls.count()).toBe(1, '@scroll 2 end -> start');
      await waitForFrames(2);
      expect(spy.calls.count()).toBe(2, '@scroll 2 end -> start');
      expect(viewModel.items.length).toBe(300, 'items.length 3');
      firstViewIndex = virtualRepeat.firstViewIndex();
      lastViewIndex = virtualRepeat.lastViewIndex();
      expect(firstViewIndex).toBe(0, 'repeat._firstViewIndex() 2');
      expect(lastViewIndex).toBe(11, 'repeat._lastViewIndex() 2');
      validateScrolledState(virtualRepeat, viewModel, itemHeight);
    });

    it([
      title,
      'passes the current index and location state',
      ' -- start 100',
      ' -- jump to end',
      ' -- wait and assert',
      ' -- jump to start',
      ' -- wait and assert',
    ].join('\n\t'), async () => {
      let scrollNextArgs: [number, /*is near bottom*/boolean, /*is near top*/boolean];
      const spy = jasmine.createSpy('viewModel.getNextPage(): void', function(this: ITestAppInterface<string>, ...args: any[]) {
        scrollNextArgs = normalizeScrollNextArgs(args);
        if (scrollNextArgs[2]) {
          let itemLength = this.items.length;
          for (let i = 0; i < 100; ++i) {
            let itemNum = itemLength + i;
            this.items.unshift('item' + itemNum);
          }
        }
      }).and.callThrough();
      const { virtualRepeat, viewModel } = await bootstrapComponent(
        {
          items: createItems(100),
          getNextPage: spy,
        },
        extraResources,
        $view
      );
      expect(scrollNextArgs).toBe(undefined, 'getNextPage() args[]');
      expect(virtualRepeat.minViewsRequired * 2).toBe(12, 'repeat._viewsLength');
      expect(virtualRepeat.viewCount()).toBe(12, 'repeat.viewCount()');
      expect(spy.calls.count()).toBe(0, 'no getNextPage() calls');

      expect(viewModel.items.length).toBe(100, 'items.length 1');
      validateScrolledState(virtualRepeat, viewModel, itemHeight);

      scrollRepeat(virtualRepeat, 'end');
      expect(spy.calls.count()).toBe(0, '@scroll 1 start -> end');
      await waitForFrames(1);
      expect(spy.calls.count()).toBe(0, '@scroll 1 start -> end');
      await waitForFrames(2);
      expect(spy.calls.count()).toBe(1, '@scroll 1 start -> end');
      expect(viewModel.items.length).toBe(100, 'items.length 2');
      let virtualRepeatFirst = virtualRepeat.$first;
      let firstViewIndex = virtualRepeat.firstViewIndex();
      let lastViewIndex = virtualRepeat.lastViewIndex();
      expect(firstViewIndex).toBe(88, 'repeat._firstViewIndex() 1');
      expect(virtualRepeatFirst).toBe(88, 'repeat._first 1 = 88');
      // expect(virtualRepeatFirst).toBe(94, 'repeat._first 1 <= 94');
      expect(lastViewIndex).toBe(99, 'repeat._lastViewIndex() 1');
      validateScrolledState(virtualRepeat, viewModel, itemHeight);
      expect(Array.isArray(scrollNextArgs)).toBe(true, 'scrollNextArgs is defined');
      let [firstIndex, isAtBottom, isAtTop] = scrollNextArgs;
      expect(firstIndex).toBe(88, 'scrollNextArgs[0] 1');
      expect(isAtBottom).toBe(true, 'scrollNextArgs[1] -- isAtBottom 1');
      expect(isAtTop).toBe(false, 'scrollNextArgs[2] -- isAtTop 1');

      scrollRepeat(virtualRepeat, 'start');
      expect(spy.calls.count()).toBe(1, '@scroll 2 end -> start');
      await waitForFrames(1);
      expect(spy.calls.count()).toBe(1, '@scroll 2 end -> start');
      await waitForFrames(2);
      expect(spy.calls.count()).toBe(2, '@scroll 2 end -> start');
      expect(viewModel.items.length).toBe(200, 'items.length 3');
      virtualRepeatFirst = virtualRepeat.$first;
      firstViewIndex = virtualRepeat.firstViewIndex();
      lastViewIndex = virtualRepeat.lastViewIndex();
      expect(firstViewIndex).toBe(0, 'repeat._firstViewIndex() 2');
      expect(lastViewIndex).toBe(11, 'repeat._lastViewIndex() 2');
      validateScrolledState(virtualRepeat, viewModel, itemHeight);
      [firstIndex, isAtBottom, isAtTop] = scrollNextArgs;
      expect(firstIndex).toBe(virtualRepeatFirst, 'scrollNextArgs[0] 2');
      expect(isAtBottom).toBe(false, 'scrollNextArgs[1] -- isAtBottom 2');
      expect(isAtTop).toBe(true, 'scrollNextArgs[2] -- isAtTop 2');
    });

    it([
      title,
      'passes the current index and location state',
      ' -- start 100',
      ' -- scroll down 20',
      ' -- wait and assert',
      ' -- scroll up',
      ' -- wait and assert',
    ].join('\n\t'), async () => {
      let scrollNextArgs: [number, /*is near bottom*/boolean, /*is near top*/boolean];
      const spy = jasmine.createSpy('viewModel.getNextPage(): void', function(this: ITestAppInterface<string>, ...args: any[]) {
        scrollNextArgs = normalizeScrollNextArgs(args);
        if (scrollNextArgs[2]) {
          let itemLength = this.items.length;
          for (let i = 0; i < 100; ++i) {
            let itemNum = itemLength + i;
            this.items.unshift('item' + itemNum);
          }
        }
      }).and.callThrough();
      const { virtualRepeat, viewModel } = await bootstrapComponent(
        {
          items: createItems(100),
          getNextPage: spy,
        },
        extraResources,
        $view
      );
      expect(scrollNextArgs).toBe(undefined, 'getNextPage() args[]');
      expect(virtualRepeat.minViewsRequired * 2).toBe(12, 'repeat._viewsLength');
      expect(virtualRepeat.viewCount()).toBe(12, 'repeat.viewCount()');
      expect(spy.calls.count()).toBe(0, 'no getNextPage() calls');

      expect(viewModel.items.length).toBe(100, 'items.length 1');
      validateScrolledState(virtualRepeat, viewModel, itemHeight);

      scrollRepeat(virtualRepeat, 20 * itemHeight);
      await waitForFrames(2);
      expect(viewModel.items.length).toBe(100, 'items.length 2');
      let virtualRepeatFirst = virtualRepeat.$first;
      let firstViewIndex = virtualRepeat.firstViewIndex();
      let lastViewIndex = virtualRepeat.lastViewIndex();
      expect(firstViewIndex).toBe(20, 'repeat._firstViewIndex() 1');
      expect(virtualRepeatFirst).toBe(20, 'repeat._first 1 = 88');
      expect(lastViewIndex).toBe(20 + virtualRepeat.minViewsRequired * 2 - 1, 'repeat._lastViewIndex() 1');
      validateScrolledState(virtualRepeat, viewModel, itemHeight);
      expect(scrollNextArgs).toBe(undefined, 'scrollNextArgs is undefined');

      for (let i = 0; 15 >= i; ++i) {
        scrollRepeat(virtualRepeat, (20 - i) * itemHeight);
        await waitForFrames(2);
        virtualRepeatFirst = virtualRepeat.$first;
        firstViewIndex = virtualRepeat.firstViewIndex();
        lastViewIndex = virtualRepeat.lastViewIndex();
        expect(firstViewIndex).toBe(20 - i, 'repeat._firstViewIndex() 2');
        expect(lastViewIndex).toBe(20 - i + virtualRepeat.minViewsRequired * 2 - 1, 'repeat._lastViewIndex() 2');
      }

      scrollRepeat(virtualRepeat, 4 * itemHeight);
      expect(spy.calls.count()).toBe(0, '@scroll 2 end -> start');
      await waitForFrames(1);
      expect(spy.calls.count()).toBe(0, '@scroll 2 end -> start');
      await waitForFrames(2);
      expect(spy.calls.count()).toBe(1, '@scroll 2 end -> start');
      expect(viewModel.items.length).toBe(200, 'items.length 3');

      let hasValueConverterInExpression = extraResources.length > 0;
      virtualRepeatFirst = virtualRepeat.$first;
      firstViewIndex = virtualRepeat.firstViewIndex();
      lastViewIndex = virtualRepeat.lastViewIndex();

      expect(firstViewIndex).toBe(hasValueConverterInExpression ? 4 : 104, 'repeat._firstViewIndex() 3');
      expect(lastViewIndex).toBe((hasValueConverterInExpression ? 4 : 104) + virtualRepeat.minViewsRequired * 2 - 1, 'repeat._lastViewIndex() 3');
      validateScrolledState(virtualRepeat, viewModel, itemHeight);

      let [firstIndex, isAtBottom, isAtTop] = scrollNextArgs;
      expect(firstIndex).toBe(4, 'scrollNextArgs[0] 2');
      expect(isAtBottom).toBe(false, 'scrollNextArgs[1] -- isAtBottom 2');
      expect(isAtTop).toBe(true, 'scrollNextArgs[2] -- isAtTop 2');
    });

    it([
      title,
      'handles getting next data set with promises',
      ' -- sroll to end',
      ' -- wait',
      ' -- scroll to top',
    ].join('\n\t'), async () => {
      let scrollNextArgs: [number, boolean, boolean];
      const spy = jasmine.createSpy('viewModel.getNextPage(): void', function(this: ITestAppInterface<string>, ...args: any[]) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        let [_, isAtBottom] = scrollNextArgs = normalizeScrollNextArgs(args);
        return new Promise<void>(async (resolve) => {
          await waitForFrames(2);
          let itemLength = this.items.length;
          for (let i = 0; i < 100; ++i) {
            let itemNum = itemLength + i;
            this.items.push('item' + itemNum);
          }
          resolve();
        });
      }).and.callThrough();
      let { virtualRepeat, viewModel } = await bootstrapComponent(
        {
          items: createItems(100),
          getNextPage: spy,
        },
        extraResources,
        $view
      );

      expect(scrollNextArgs).toBe(undefined, 'getNextPage() args[]');
      expect(virtualRepeat.minViewsRequired * 2).toBe(12, 'repeat._viewsLength');
      expect(virtualRepeat.viewCount()).toBe(12, 'repeat.viewCount()');
      expect(spy.calls.count()).toBe(0, 'no getNextPage() calls 1');

      expect(viewModel.items.length).toBe(100, 'items.length 1');
      validateScrolledState(virtualRepeat, viewModel, itemHeight);

      scrollRepeat(virtualRepeat, 'end');
      // assert that nothing changed after
      // 1 frame for scroll handler to start working
      // 1 frame for getMore to be invoked
      await waitForFrames(2);
      expect(scrollNextArgs).toEqual([88, true, false], 'scrollNextArgs 1');
      expect(spy.calls.count()).toBe(1, '1 getNextPage() calls 2');

      // not yet loaded
      expect(viewModel.items.length).toBe(100, 'items.length 2 | promise started, not loaded');
      await waitForFrames(2);
      // loaded
      expect(viewModel.items.length).toBe(200, 'items.length 2 | promise resolved, loaded');
    });

    it([
      title,
      'handles getting next data set with promises',
      ' -- start 10 (smaller than min views required: 12)',
      ' -- sroll 1px (no change in indices)',
    ].join('\n\t'), async () => {
      let scrollNextArgs: [number, boolean, boolean];
      const spy = jasmine.createSpy('viewModel.getNextPage(): void', function(this: ITestAppInterface<string>, ...args: any[]) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        let [_, isAtBottom] = scrollNextArgs = normalizeScrollNextArgs(args);
        return new Promise<void>(async (resolve) => {
          await waitForFrames(2);
          let itemLength = this.items.length;
          for (let i = 0; i < 1; ++i) {
            let itemNum = itemLength + i;
            this.items.push('item' + itemNum);
          }
          resolve();
        });
      }).and.callThrough();
      let { virtualRepeat, viewModel } = await bootstrapComponent(
        {
          items: createItems(10),
          getNextPage: spy,
        },
        extraResources,
        $view
      );

      expect(scrollNextArgs).toBe(undefined, 'getNextPage() args[]');
      expect(virtualRepeat.minViewsRequired * 2).toBe(12, 'repeat._viewsLength');
      expect(virtualRepeat.viewCount()).toBe(10, 'repeat.viewCount()');
      expect(spy.calls.count()).toBe(0, 'no getNextPage() calls 1');

      expect(viewModel.items.length).toBe(10, 'items.length 1');
      validateScrolledState(virtualRepeat, viewModel, itemHeight);

      scrollRepeat(virtualRepeat, 1);
      // assert that nothing changed after
      // 1 frame for scroll handler to start working
      // 1 frame for getMore to be invoked
      await waitForFrames(2);
      assertScrollNextArgsEqual(scrollNextArgs, [0, true, true], 'scrollnextArgs 1');
      // expect(scrollNextArgs).toEqual([/* first view index */0, true, false], 'scrollNextArgs 1');
      expect(spy.calls.count()).toBe(1, '1 getNextPage() calls 2');

      // not yet loaded
      expect(viewModel.items.length).toBe(10, 'items.length 2 | promise started, not loaded');
      await waitForFrames(2);
      // loaded
      expect(viewModel.items.length).toBe(11, 'items.length 2 | promise resolved, loaded');
      validateScrolledState(virtualRepeat, viewModel, itemHeight);

      // ========================
      // try to scroll again, but back to 0 from 1px
      scrollRepeat(virtualRepeat, 0);
      // assert that nothing changed after
      // 1 frame for scroll handler to start working
      // 1 frame for getMore to be invoked
      await waitForFrames(2);
      assertScrollNextArgsEqual(scrollNextArgs, [0, true, true], 'scrollnextArgs 2');
      expect(spy.calls.count()).toBe(2, '2 getNextPage() calls 3');

      // not yet loaded
      expect(viewModel.items.length).toBe(11, 'items.length 3 | promise started, not loaded');
      await waitForFrames(2);
      // loaded
      expect(viewModel.items.length).toBe(12, 'items.length 3 | promise resolved, loaded');

    });
  }

  async function bootstrapComponent<T>($viewModel?: ITestAppInterface<T>, extraResources?: any[], $view = view) {
    component = StageComponent
      .withResources([
        ...resources,
        ...extraResources,
      ])
      .inView($view)
      .boundTo($viewModel);
    await component.create(bootstrap);
    expect(document.body.contains(component.element)).toBe(true, 'repeat is setup in document');
    return { virtualRepeat: component.viewModel, viewModel: $viewModel, component: component };
  }

  function createItems(amount: number, name = 'item') {
    return Array.from({ length: amount }, (_, index) => name + index);
  }

  function normalizeScrollNextArgs(args: any[]): [number, boolean, boolean] {
    return typeof args[0] === 'number'
      ? [args[0], args[1], args[2]]
      : [args[0].topIndex, args[0].isAtBottom, args[0].isAtTop];
  }

  function assertScrollNextArgsEqual(scrollnextInfo: [number, boolean, boolean], expectedScrollnextInfo: [number, boolean, boolean], prefixMessage = ''): void {
    expect(Array.isArray(scrollnextInfo)).toBe(true, `[${prefixMessage}] scroll next info should have been defined`);
    const [actualTopIndex, actualIsNearBottom, actualIsNearTop] = scrollnextInfo;
    const [expectedTopIndex, expectedIsNearBottom, expectedIsNearTop] = expectedScrollnextInfo;
    expect(actualTopIndex).toBe(expectedTopIndex, `[${prefixMessage}] {top index(${actualTopIndex})} to be ${expectedTopIndex}`);
    expect(actualIsNearBottom).toBe(expectedIsNearBottom, `[${prefixMessage}] {is near bottom(${actualIsNearBottom})} to be ${expectedIsNearBottom}`);
    expect(actualIsNearTop).toBe(expectedIsNearTop, `[${prefixMessage}] {is near top (${actualIsNearTop})} to be ${expectedIsNearTop}`);
  }
});
