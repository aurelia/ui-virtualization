import './setup';
import { StageComponent, ComponentTester } from 'aurelia-testing';
import { PLATFORM } from 'aurelia-pal';
import { bootstrap } from 'aurelia-bootstrapper';
import { validateScrolledState, scrollToEnd, scrollToStart, waitForNextFrame } from './utilities';
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
    'test/noop-value-converter'
  ];
  class IdentityValueConverter {
    static $resource = {
      type: 'valueConverter',
      name: 'identity'
    };
    toView(val: any[]) {
      return val;
    }
  }
  class CloneArrayValueConverter {
    static $resource = {
      type: 'valueConverter',
      name: 'cloneArray'
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
        </div>`
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
        </ul>`
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
        </ol>`
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
      }
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
      }
    }
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
    [' | cloneArray & toView', 'infinite-scroll-next="getNextPage"', [CloneArrayValueConverter]]

    // cloneArray and two way creates infinite loop
    // [' | cloneArray & twoWay', 'infinite-scroll-next="getNextPage"', [CloneArrayValueConverter]]
  ];

  eachCartesianJoin(
    [repeatScrollNextCombos, testGroups],
    ([repeatExpression, scrollNextAttr, extraResources], { title, createView }, callIndex) => {
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
      ''
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
          getNextPage: spy
        },
        extraResources,
        $view
      );

      expect(virtualRepeat._viewsLength).toBe(12, 'repeat._viewsLength');
      expect(spy.calls.count()).toBe(1, '1 getNextPage() calls');
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
          getNextPage: spy
        },
        extraResources,
        $view
      ));
      expect(virtualRepeat._viewsLength).toBe(12, 'repeat._viewsLength');
      expect(spy.calls.count()).toBe(1, '1 getNextPage() calls');
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
          getNextPage: spy
        },
        extraResources,
        $view
      ));
      expect(virtualRepeat._viewsLength).toBe(12, 'repeat._viewsLength');
      expect(spy.calls.count()).toBe(1, '1 getNextPage() calls');
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
          getNextPage: spy
        },
        extraResources,
        $view
      ));
      expect(virtualRepeat._viewsLength).toBe(12, 'repeat._viewsLength');
      expect(spy.calls.count()).toBe(0, 'no getNextPage() calls');
      [firstIndex, isAtBottom, isAtTop] = scrollNextArgs;
      expect(firstIndex).toBe(0, 'scrollNextArgs[0] 4');
      expect(isAtBottom).toBe(true, 'scrollNextArgs[1] -- isAtBottom 4');
      expect(isAtTop).toBe(true, 'scrollNextArgs[2] -- isAtTop 4');

      expect(viewModel.items.length).toBe(6, 'items.length 4');
      validateScrolledState(virtualRepeat, viewModel, itemHeight);
    });

    it([
      title,
      'Initial 30 items',
      ' -- scroll down + get 100 more',
      ' -- wait',
      ' -- scroll up + get 100 more',
      ''
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
          getNextPage: spy
        },
        extraResources,
        $view
      );
      expect(virtualRepeat._viewsLength).toBe(12, 'repeat._viewsLength');
      expect(spy.calls.count()).toBe(0, 'no getNextPage() calls');

      expect(viewModel.items.length).toBe(100, 'items.length 1');
      validateScrolledState(virtualRepeat, viewModel, itemHeight);

      await scrollToEnd(virtualRepeat);
      expect(spy.calls.count()).toBe(1, '@scroll 1 top -> end');
      expect(viewModel.items.length).toBe(200, 'items.length 2');
      let firstViewIndex = virtualRepeat._firstViewIndex();
      let lastViewIndex = virtualRepeat._lastViewIndex();
      expect(firstViewIndex).toBeGreaterThanOrEqual(100 - 1 - 5, 'repeat._firstViewIndex() 1');
      expect(firstViewIndex).toBeLessThan(200 - 1 - 5, 'repeat._firstViewIndex < bottom');
      expect(lastViewIndex).toBeGreaterThanOrEqual(100 - 1 - 5 + 12, 'repeat._lastViewIndex() 1');
      validateScrolledState(virtualRepeat, viewModel, itemHeight);

      await scrollToStart(virtualRepeat);
      expect(spy.calls.count()).toBe(2, '@scroll 2 end -> top');
      expect(viewModel.items.length).toBe(300, 'items.length 3');
      firstViewIndex = virtualRepeat._firstViewIndex();
      lastViewIndex = virtualRepeat._lastViewIndex();
      expect(firstViewIndex).toBe(0, 'repeat._firstViewIndex() 2');
      expect(lastViewIndex).toBe(11, 'repeat._lastViewIndex() 2');
      validateScrolledState(virtualRepeat, viewModel, itemHeight);
    });

    it([
      title,
      'passes the current index and location state',
      ''
    ].join('\n\t'), async () => {
      let scrollNextArgs: [number, boolean, boolean];
      const spy = jasmine.createSpy('viewModel.getNextPage(): void', function(this: ITestAppInterface<string>, ...args: any[]) {
        scrollNextArgs = normalizeScrollNextArgs(args);
      }).and.callThrough();
      const { virtualRepeat, viewModel } = await bootstrapComponent(
        {
          items: createItems(100),
          getNextPage: spy
        },
        extraResources,
        $view
      );
      expect(scrollNextArgs).toBe(undefined, 'getNextPage() args[]');
      expect(virtualRepeat._viewsLength).toBe(12, 'repeat._viewsLength');
      expect(virtualRepeat.viewCount()).toBe(12, 'repeat.viewCount()');
      expect(spy.calls.count()).toBe(0, 'no getNextPage() calls');

      expect(viewModel.items.length).toBe(100, 'items.length 1');
      validateScrolledState(virtualRepeat, viewModel, itemHeight);

      await scrollToEnd(virtualRepeat);
      expect(spy.calls.count()).toBe(1, '@scroll 1 top -> end');
      expect(viewModel.items.length).toBe(100, 'items.length 2');
      let virtualRepeatFirst = virtualRepeat._first;
      let firstViewIndex = virtualRepeat._firstViewIndex();
      let lastViewIndex = virtualRepeat._lastViewIndex();
      expect(firstViewIndex).toBe(88, 'repeat._firstViewIndex() 1');
      expect(virtualRepeatFirst).toBe(94, 'repeat._first 1');
      expect(lastViewIndex).toBe(99, 'repeat._lastViewIndex() 1');
      validateScrolledState(virtualRepeat, viewModel, itemHeight);
      expect(Array.isArray(scrollNextArgs)).toBe(true, 'scrollNextArgs is defined');
      let [firstIndex, isAtBottom, isAtTop] = scrollNextArgs;
      expect(firstIndex).toBe(virtualRepeatFirst, 'scrollNextArgs[0] 1');
      expect(isAtBottom).toBe(true, 'scrollNextArgs[1] -- isAtBottom 1');
      expect(isAtTop).toBe(false, 'scrollNextArgs[2] -- isAtTop 1');

      await scrollToStart(virtualRepeat);
      expect(spy.calls.count()).toBe(2, '@scroll 2 end -> top');
      expect(viewModel.items.length).toBe(100, 'items.length 3');
      virtualRepeatFirst = virtualRepeat._first;
      firstViewIndex = virtualRepeat._firstViewIndex();
      lastViewIndex = virtualRepeat._lastViewIndex();
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
      'handles getting next data set with promises',
      ' -- sroll to end',
      ' -- wait',
      ' -- scroll to top'
    ].join('\n\t'), async () => {
      let scrollNextArgs: [number, boolean, boolean];
      let currentPromise: Promise<any>;
      const spy = jasmine.createSpy('viewModel.getNextPage(): void', function(this: ITestAppInterface<string>, ...args: any[]) {
        let [_, isAtBottom] = scrollNextArgs = normalizeScrollNextArgs(args);
        return new Promise(async (resolve) => {
          await waitForNextFrame();
          await waitForNextFrame();
          let itemLength = this.items.length;
          for (let i = 0; i < 100; ++i) {
            let itemNum = itemLength + i;
            this.items.push('item' + itemNum);
          }
          resolve();
        });
      }).and.callThrough();
      let { component, virtualRepeat, viewModel } = await bootstrapComponent(
        {
          items: createItems(100),
          getNextPage: spy
        },
        extraResources,
        $view
      );

      expect(scrollNextArgs).toBe(undefined, 'getNextPage() args[]');
      expect(virtualRepeat._viewsLength).toBe(12, 'repeat._viewsLength');
      expect(virtualRepeat.viewCount()).toBe(12, 'repeat.viewCount()');
      expect(spy.calls.count()).toBe(0, 'no getNextPage() calls 1');

      expect(viewModel.items.length).toBe(100, 'items.length 1');
      validateScrolledState(virtualRepeat, viewModel, itemHeight);

      await scrollToEnd(virtualRepeat);
      expect(scrollNextArgs).toEqual([94, true, false], 'scrollNextArgs 1');
      expect(spy.calls.count()).toBe(1, '1 getNextPage() calls 2');

      // not yet loaded
      expect(viewModel.items.length).toBe(100, 'items.length 2 | promise started, not loaded');
      await waitForNextFrame();
      await waitForNextFrame();
      expect(viewModel.items.length).toBe(200, 'items.length 2 | promise resolved, loaded');
      // validateScroll(
      //   promisedVirtualRepeat,
      //   promisedViewModel,
      //   async () => {
      //     await waitForTimeout(500);
      //     expect(promisedVm.getNextPage).toHaveBeenCalled();
      //     // Jasmine spies seem to not be working with returned promises and getting the instance of them, causing regular checks on getNextPage to fail
      //     expect(promisedVm.items.length).toBe(1100);
      //     done();
      //   },
      //   'scrollContainerPromise'
      // );
    });
  }

  // it('handles getting next data set', done => {
  //   create.then(() => {
  //     validateScroll(virtualRepeat, viewModel, () => {
  //       expect(vm.getNextPage).toHaveBeenCalled();
  //       done();
  //     });
  //   });
  // });
  // it('handles getting next data set from nested function', done => {
  //   nestedCreate.then(() => {
  //     validateScroll(nestedVirtualRepeat, nestedViewModel, () => {
  //       expect(nestedVm.getNextPage).toHaveBeenCalled();
  //       done();
  //     }, 'scrollContainerNested');
  //   });
  // });
  // it('handles getting next data set scrolling up', done => {
  //   create.then(() => {
  //     validateScrollUp(virtualRepeat, viewModel, () => {
  //       let args = vm.getNextPage.calls.argsFor(0);
  //       expect(args[0]).toEqual(0);
  //       expect(args[1]).toBe(false);
  //       expect(args[2]).toBe(true);
  //       done();
  //     });
  //   });
  // });
  // it('handles getting next data set with promises', async done => {
  //   await create;
  //   await promisedCreate;
  //   validateScroll(
  //     promisedVirtualRepeat,
  //     promisedViewModel,
  //     async () => {
  //       await waitForTimeout(500);
  //       expect(promisedVm.getNextPage).toHaveBeenCalled();
  //       // Jasmine spies seem to not be working with returned promises and getting the instance of them, causing regular checks on getNextPage to fail
  //       expect(promisedVm.items.length).toBe(1100);
  //       done();
  //     },
  //     'scrollContainerPromise'
  //   );
  // });
  // it('handles getting next data set with small page size', async done => {
  //   vm.items = [];
  //   for (let i = 0; i < 3; ++i) {
  //     vm.items.push('item' + i);
  //   }
  //   await create;
  //   validateScroll(virtualRepeat, viewModel, () => {
  //     expect(vm.getNextPage).toHaveBeenCalled();
  //     done();
  //   });
  // });
  // // The following test used to pass because there was no getMore() invoked during initialization
  // // so `validateScroll()` would not have been able to trigger all flow within _handleScroll of VirtualRepeat instance
  // // with the commit to fix issue 129, it starts to have more item and thus, scrollContainer has real scrollbar
  // // making synthesized scroll event in `validateScroll` work, resulting in failed test
  // // kept but commented out for history reason
  // // it('handles not scrolling if number of items less than elements in view', done => {
  // //   vm.items = [];
  // //   for (let i = 0; i < 5; ++i) {
  // //     vm.items.push('item' + i);
  // //   }
  // //   create.then(() => {
  // //     validateScroll(virtualRepeat, viewModel, () => {
  // //       expect(vm.getNextPage).not.toHaveBeenCalled();
  // //       done();
  // //     });
  // //   });
  // // });
  // it('passes the current index and location state', done => {
  //   create.then(() => {
  //     validateScroll(virtualRepeat, viewModel, () => {
  //       // Taking into account 1 index difference due to default styles on browsers causing small margins of error
  //       let args = vm.getNextPage.calls.argsFor(0);
  //       expect(args[0]).toBeGreaterThan(988);
  //       expect(args[0]).toBeLessThan(995);
  //       expect(args[1]).toBe(true);
  //       expect(args[2]).toBe(false);
  //       done();
  //     });
  //   });
  // });
  // it('passes context information when using call', done => {
  //   nestedCreate.then(() => {
  //     validateScroll(nestedVirtualRepeat, nestedViewModel, () => {
  //       // Taking into account 1 index difference due to default styles on browsers causing small margins of error
  //       expect(nestedVm.getNextPage).toHaveBeenCalled();
  //       let scrollContext = nestedVm.getNextPage.calls.argsFor(0)[0];
  //       expect(scrollContext.topIndex).toBeGreaterThan(988);
  //       expect(scrollContext.topIndex).toBeLessThan(995);
  //       expect(scrollContext.isAtBottom).toBe(true);
  //       expect(scrollContext.isAtTop).toBe(false);
  //       done();
  //     }, 'scrollContainerNested');
  //   });
  // });

  async function bootstrapComponent<T>($viewModel?: ITestAppInterface<T>, extraResources?: any[], $view = view) {
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

  function createItems(amount: number, name: string = 'item') {
    return Array.from({ length: amount }, (_, index) => name + index);
  }

  function normalizeScrollNextArgs(args: any[]): [number, boolean, boolean] {
    return typeof args[0] === 'number'
      ? [args[0], args[1], args[2]]
      : [args[0].topIndex, args[0].isAtBottom, args[0].isAtTop];
  }
});
