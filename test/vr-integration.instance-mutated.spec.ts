import './setup';
import { PLATFORM } from 'aurelia-pal';
import { validateScrolledState, scrollToEnd, waitForNextFrame, waitForFrames, scrollRepeat } from './utilities';
import { VirtualRepeat } from '../src/virtual-repeat';
import { StageComponent, ComponentTester } from 'aurelia-testing';
import { bootstrap } from 'aurelia-bootstrapper';
import { ITestAppInterface } from './interfaces';

PLATFORM.moduleName('src/virtual-repeat');
PLATFORM.moduleName('test/noop-value-converter');
PLATFORM.moduleName('src/infinite-scroll-next');

describe('vr-integration.instance-mutated.spec.ts', () => {
  let component: ComponentTester<VirtualRepeat>;
  let items: any[];
  let resources: any[];
  let itemHeight: number = 100;

  beforeEach(() => {
    component = undefined;
    items = createItems(1000);
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

  runTestsCases(
    '.for="item of items"',
    `<div id="scrollContainer" style="height: 500px; overflow-y: scroll;">
      <div style="height: ${itemHeight}px;" virtual-repeat.for="item of items">\${item}</div>
    </div>`
  );

  runTestsCases(
    '.for="item of items | identity',
    `<div id="scrollContainer" style="height: 500px; overflow-y: scroll;">
      <div style="height: ${itemHeight}px;" virtual-repeat.for="item of items | identity">\${item}</div>
    </div>`,
    [
      class {
        static $resource = {
          type: 'valueConverter',
          name: 'identity'
        };
        toView(val: any[]) {
          return val;
        }
      }
    ]
  );

  runTestsCases(
    '.for="item of items | cloneArray',
    `<div id="scrollContainer" style="height: 500px; overflow-y: scroll;">
      <div style="height: ${itemHeight}px;" virtual-repeat.for="item of items | cloneArray">\${item}</div>
    </div>`,
    [
      class {
        static $resource = {
          type: 'valueConverter',
          name: 'cloneArray'
        };
        toView(val: any[]) {
          return Array.isArray(val) ? val.slice() : val;
        }
      }
    ]
  );

  runTestsCases(
    '.for="item of items | cloneArray | cloneArray | identity | cloneArray',
    `<div id="scrollContainer" style="height: 500px; overflow-y: scroll;">
      <div style="height: ${itemHeight}px;" virtual-repeat.for="item of items | cloneArray | cloneArray | identity | cloneArray">\${item}</div>
    </div>`,
    [
      class {
        static $resource = {
          type: 'valueConverter',
          name: 'identity'
        };
        toView(val: any[]) {
          return val;
        }
      },
      class {
        static $resource = {
          type: 'valueConverter',
          name: 'cloneArray'
        };
        toView(val: any[]) {
          return Array.isArray(val) ? val.slice() : val;
        }
      }
    ]
  );

  runTestsCases(
    '.for="item of items & toView',
    `<div id="scrollContainer" style="height: 500px; overflow-y: scroll;">
      <div style="height: ${itemHeight}px;" virtual-repeat.for="item of items & toView">\${item}</div>
    </div>`
  );

  runTestsCases(
    '.for="item of items & twoWay',
    `<div id="scrollContainer" style="height: 500px; overflow-y: scroll;">
      <div style="height: ${itemHeight}px;" virtual-repeat.for="item of items & twoWay">\${item}</div>
    </div>`
  );

  runTestsCases(
    '.for="item of items | cloneArray | cloneArray | identity | cloneArray & toView',
    `<div id="scrollContainer" style="height: 500px; overflow-y: scroll;">
      <div style="height: ${itemHeight}px;" virtual-repeat.for="item of items | cloneArray | cloneArray | identity | cloneArray & toView">\${item}</div>
    </div>`,
    [
      class {
        static $resource = {
          type: 'valueConverter',
          name: 'identity'
        };
        toView(val: any[]) {
          return val;
        }
      },
      class {
        static $resource = {
          type: 'valueConverter',
          name: 'cloneArray'
        };
        toView(val: any[]) {
          return Array.isArray(val) ? val.slice() : val;
        }
      }
    ]
  );

  function runTestsCases(title: string, $view: string, extraResources: any[] = []): void {
    it([
      title,
      '\thandles splice when scrolled to end',
      ''
    ].join('\n'), async () => {
      const { virtualRepeat, viewModel } = await bootstrapComponent({ items: items });
      await scrollToEnd(virtualRepeat);

      viewModel.items.splice(995, 1, 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j');
      await waitForNextFrame();
      validateScrolledState(virtualRepeat, viewModel, itemHeight);

      await scrollToEnd(virtualRepeat);
      let views = virtualRepeat.viewSlot.children;
      expect(views[views.length - 1].bindingContext.item).toBe(viewModel.items[viewModel.items.length - 1]);
    });

    it([
      title,
      '\thandles splice removing non-consecutive when scrolled to end',
      ''
    ].join('\n'), async () => {
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

    it([
      title,
      '\thandles splice non-consecutive when scrolled to end',
      '\t1000 items',
      '\t-- 12 max views',
      '\t-- splice to 840 (every 10 increment, remove 3 add i, 80 times)',
      ''
    ].join('\n'), async () => {
      const { virtualRepeat, viewModel } = await bootstrapComponent({ items: items });
      await scrollToEnd(virtualRepeat);

      for (let i = 0, ii = 80; i < ii; i++) {
        viewModel.items.splice(10 * i, 3, i as any);
      }
      expect(virtualRepeat.element.parentElement.scrollTop).toEqual(100 * 995, 'scrollTop 1');

      await waitForNextFrame();

      expect(virtualRepeat.element.parentElement.scrollHeight).toEqual(100 * 840, 'scrollHeight 2');
      expect(virtualRepeat.element.parentElement.scrollTop).toEqual(100 * (840 - 5), 'scrollTop 2');
      validateScrolledState(virtualRepeat, viewModel, itemHeight);

      await scrollToEnd(virtualRepeat);
      let views = virtualRepeat.viewSlot.children;
      expect(views[views.length - 1].bindingContext.item).toBe(viewModel.items[viewModel.items.length - 1]);
    });

    it([
      title,
      '\thandles splice removing many',
      '\t1000 items',
      '\t-- 12 max views',
      '\t-- splice to 24',
      ''
    ].join('\n'), async () => {
      const { virtualRepeat, viewModel } = await bootstrapComponent({ items: items });
      await scrollToEnd(virtualRepeat);
      expect(virtualRepeat._viewsLength).toBe(12, 'virtualRepeat.viewsLength');
      expect(virtualRepeat.element.parentElement.scrollTop).toEqual(100 * 995, 'scrollTop 1');
      // more items remaining than viewslot capacity
      viewModel.items.splice(5, 1000 - virtualRepeat._viewsLength - 12);

      await waitForNextFrame();
      expect(virtualRepeat.items.length).toEqual(24, 'virtualRepeat.items.length');
      expect(virtualRepeat.element.parentElement.scrollHeight).toEqual(100 * 24, 'scrollHeight 2');
      expect(virtualRepeat.element.parentElement.scrollTop).toEqual(100 * (24 - 5), 'scrollTop 2');
      expect(virtualRepeat._first).toBe(1000 - (1000 - virtualRepeat._viewsLength), 'virtualRepeat._first 1');
      validateScrolledState(virtualRepeat, viewModel, itemHeight);
    });

    it([
      title,
      '\thandles splice removing more',
      ''
    ].join('\n'), async () => {
      // number of items remaining exactly as viewslot capacity
      const { virtualRepeat, viewModel } = await bootstrapComponent({ items: items });
      await scrollToEnd(virtualRepeat);

      viewModel.items.splice(5, 1000 - virtualRepeat._viewsLength);

      await waitForNextFrame();

      expect(virtualRepeat.viewSlot.children.length).toBe(viewModel.items.length);
      validateScrolledState(virtualRepeat, viewModel, itemHeight);
    });

    // less items remaining than viewslot capacity
    it([
      title,
      '\thandles splice removing even more',
      ''
    ].join('\n'), async () => {
      const { virtualRepeat, viewModel } = await bootstrapComponent({ items: items });
      await scrollToEnd(virtualRepeat);

      viewModel.items.splice(5, 1000 - virtualRepeat._viewsLength + 10);

      await waitForNextFrame();

      expect(virtualRepeat.viewSlot.children.length).toBe(viewModel.items.length);
      validateScrolledState(virtualRepeat, viewModel, itemHeight);
    });

    it([
      title,
      '\thandles splice removing non-consecutive',
      ''
    ].join('\n'), async () => {
      const { virtualRepeat, viewModel } = await bootstrapComponent({ items: items });
      await scrollToEnd(virtualRepeat);

      for (let i = 0, ii = 100; i < ii; i++) {
        viewModel.items.splice(i + 1, 9);
      }

      await waitForNextFrame();
      validateScrolledState(virtualRepeat, viewModel, itemHeight);
    });

    it([
      title,
      '\thandles splice non-consecutive',
      ''
    ].join('\n'), async () => {
      const { virtualRepeat, viewModel } = await bootstrapComponent({ items: items });
      await scrollToEnd(virtualRepeat);

      for (let i = 0, ii = 100; i < ii; i++) {
        viewModel.items.splice(3 * (i + 1), 3, i as any);
      }
      await waitForNextFrame();

      validateScrolledState(virtualRepeat, viewModel, itemHeight);
    });

    it([
      title,
      '\thandles splice removing many + add',
      '\t-- 1000 items',
      '\t-- 12 max views',
      '\t-- spliced to 12',
      ''
    ].join('\n'), async () => {
      let scrollCount = 0;
      const { virtualRepeat, viewModel } = await bootstrapComponent({ items: items });
      virtualRepeat.element.parentElement.onscroll = () => {
        scrollCount++;
      };

      expect(virtualRepeat._viewsLength).toBe(12, 'repeat._viewsLength');
      scrollRepeat(virtualRepeat, 'end');
      await waitForNextFrame();
      expect(scrollCount).toBe(1, '@scroll 1');
      expect(virtualRepeat.element.parentElement.scrollTop).toBe(100 * 995, 'anchor.parent.scrollTop 1');
      expect(virtualRepeat._first).toBe(988, 'repeat._first 1');

      viewModel.items.splice(5, 990, {}, {});
      const hasValueConverter = extraResources.length > 0;
      if (hasValueConverter) {
        await waitForFrames(2);
        expect(virtualRepeat.element.parentElement.scrollHeight).toBe(100 * 12, '| vc >> scroller.scrollHeight 2');
        expect(virtualRepeat.element.parentElement.scrollTop).toBe(100 * (12 - 500 / 100), '| vc >> scroller.scrollTop 2');
        expect(scrollCount).toBeGreaterThanOrEqual(2, '| vc >> @scroll 3');
        expect(virtualRepeat._first).toBe(0, '| vc >> repeat._first 2');
        validateScrolledState(virtualRepeat, viewModel, itemHeight);
      } else {
        expect(scrollCount).toBe(1, '@scroll 2');
        expect(virtualRepeat._first).toBe(988, 'repeat._first 2');
        expect(virtualRepeat.items.length).toBe(12, 'items.length 1');
        expect(virtualRepeat.element.parentElement.scrollTop).toBe(100 * 995, 'scroller.scrollTop 1');
        await waitForNextFrame();
        expect(virtualRepeat.element.parentElement.scrollHeight).toBe(100 * 12, 'scroller.scrollHeight 2');
        expect(virtualRepeat.element.parentElement.scrollTop).toBe(100 * (12 - 500 / 100), 'scroller.scrollTop 2');
        expect(scrollCount).toBe(2, '@scroll 3');
        expect(virtualRepeat._first).toBe(0, 'repeat._first 3');
        validateScrolledState(virtualRepeat, viewModel, itemHeight);
      }
      virtualRepeat.element.parentElement.onscroll = null;
    });

    // this case is a bit differnet to above case,
    // where final result after mutation is 1 item over the max views count required
    // the previous test above has same number of items and views required
    it([
      title,
      '\thandles splice removing many + add',
      '\t1000 items',
      '\t-- 12 max views',
      '\t-- spliced to 13',
      ''
    ].join('\n'), async () => {
      let scrollCount = 0;
      const { virtualRepeat, viewModel } = await bootstrapComponent({ items: items });
      virtualRepeat.element.parentElement.onscroll = () => {
        scrollCount++;
      };

      expect(virtualRepeat._viewsLength).toBe(12, 'repeat._viewsLength');
      await scrollToEnd(virtualRepeat);
      expect(scrollCount).toBe(2, '@scroll 1');
      expect(virtualRepeat.element.parentElement.scrollTop).toBe(100 * 995);

      viewModel.items.splice(5, 990, {}, {}, {});

      const hasValueConverter = extraResources.length > 0;
      if (hasValueConverter) {
        await waitForFrames(2);
        expect(scrollCount).toBeGreaterThanOrEqual(2, '| vc >> @scroll 2');
        expect(virtualRepeat.items.length).toBe(13, 'items.length 1');
        expect(virtualRepeat.element.parentElement.scrollHeight).toBe(100 * 13, '| vc >> scroller.scrollHeight 1');
        expect(virtualRepeat.element.parentElement.scrollTop).toBe(100 * (13 - 500 / 100), '| vc >> scroller.scrollTop 2');

        expect(virtualRepeat._first).toBe(13 - (5 + 1) * 2, '| vc >> repeat._first 1');
        validateScrolledState(virtualRepeat, viewModel, itemHeight);
      } else {
        expect(scrollCount).toBe(2, '@scroll 2');
        expect(virtualRepeat.items.length).toBe(13, 'items.length 1');
        expect(virtualRepeat.element.parentElement.scrollTop).toBe(100 * 995);

        await waitForNextFrame();
        expect(scrollCount).toBe(3, '@scroll 3');
        validateScrolledState(virtualRepeat, viewModel, itemHeight);
      }
      virtualRepeat.element.parentElement.onscroll = null;
    });

    it([
      title,
      '\thandles splice remove remaining + add',
      ''
    ].join('\n'), async () => {
      const { virtualRepeat, viewModel } = await bootstrapComponent({ items: items });
      await scrollToEnd(virtualRepeat);

      viewModel.items.splice(5, 995, 'a', 'b', 'c');

      await waitForNextFrame();
      validateScrolledState(virtualRepeat, viewModel, itemHeight);
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

  // interface IInstanceMutatedTestCase<T extends ITestAppInterface<any> = ITestAppInterface<any>> {
  //   view: string | HTMLElement | HTMLElement[];
  //   viewModel: T;
  //   extraResources?: any[];
  //   assert: (component: ComponentTester, repeat: VirtualRepeat, viewModel: T) => void;
  // }

  function createItems(amount: number, name: string = 'item') {
    return Array.from({ length: amount }, (_, index) => name + index);
  }
});
