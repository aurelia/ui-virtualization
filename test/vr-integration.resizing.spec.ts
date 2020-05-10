import './setup';
import { PLATFORM } from 'aurelia-pal';
import { validateScrolledState, waitForFrames } from './utilities';
import { VirtualRepeat } from '../src/virtual-repeat';
import { StageComponent, ComponentTester } from 'aurelia-testing';
import { bootstrap } from 'aurelia-bootstrapper';
import { ITestAppInterface } from './interfaces';
import { eachCartesianJoin } from './lib';
import { ElementEvents } from 'aurelia-framework';
import { IdentityValueConverter, CloneArrayValueConverter } from './value-converters';

PLATFORM.moduleName('src/virtual-repeat');
PLATFORM.moduleName('test/noop-value-converter');
PLATFORM.moduleName('src/infinite-scroll-next');

describe('vr-integration.resizing.spec.ts', () => {
  const SAFE_FRAME_COUNT_FOR_CHANGE_PROPAGATION = 3;
  let component: ComponentTester<VirtualRepeat>;

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
      sizes: { ct_h: 500, ct_w: 400, item_h: 45, item_w: 0 },
      title: (repeatExpression, scrollNextAttr, sizes) =>
        `div > div[repeat ${repeatExpression}][${scrollNextAttr}]`,
      createView: (repeatExpression, scrollNextAttr, {ct_h, ct_w, item_h, item_w}) =>
        `<div style="height: ${ct_h}px; overflow-y: scroll">
          <div
            virtual-repeat.for="item of items ${repeatExpression}"
            ${scrollNextAttr}
            class="v-repeat-item"
            style="height: ${item_h}px;">\${item}</div>
        </div>`
    },
    {
      desc: 'ul > li',
      sizes: { ct_h: 500, ct_w: 400, item_h: 45, item_w: 0 },
      title: (repeatExpression, scrollNextAttr) =>
        `ul > li[repeat ${repeatExpression}][${scrollNextAttr}]`,
      createView: (repeatExpression, scrollNextAttr, {ct_h, ct_w, item_h, item_w}) =>
        `<ul style="height: ${ct_h}px; overflow-y: scroll; padding: 0; margin: 0; list-style: none;">
          <li
            virtual-repeat.for="item of items ${repeatExpression}"
            ${scrollNextAttr}
            style="height: ${item_h}px;">\${item}</li>
        </ul>`
    },
    {
      desc: 'ol > li',
      sizes: { ct_h: 500, ct_w: 400, item_h: 45, item_w: 0 },
      title: (repeatExpression, scrollNextAttr) =>
        `ol > li[repeat ${repeatExpression}][${scrollNextAttr}]`,
      createView: (repeatExpression, scrollnextAttr, {ct_h, ct_w, item_h, item_w}) =>
        `<ol style="height: ${ct_h}px; overflow-y: scroll; padding: 0; margin: 0; list-style: none;">
          <li
            virtual-repeat.for="item of items ${repeatExpression}"
            ${scrollnextAttr}
            style="height: ${item_h}px;">\${item}</li>
        </ol>`
    },
    {
      desc: 'div > table > tr',
      sizes: { ct_h: 500, ct_w: 400, item_h: 45, item_w: 0 },
      title: (repeatExpression: string, scrollNextAttr: string): string => {
        return `div > table > tr[repeat ${repeatExpression}][${scrollNextAttr}]`;
      },
      createView: (repeatExpression: string, scrollNextAttr: string, {ct_h, ct_w, item_h, item_w}): string => {
        return `<div style="height: ${ct_h}px; overflow-y: scroll; padding: 0; margin: 0;">
          <table style="border-spacing: 0">
            <tr
              virtual-repeat.for="item of items ${repeatExpression}"
              ${scrollNextAttr}
              style="height: ${item_h}px;"><td>\${item}</td></tr>
          </table>
        </div>`;
      }
    },
    {
      desc: 'div > table > tbody',
      sizes: { ct_h: 500, ct_w: 400, item_h: 45, item_w: 0 },
      title: (repeatExpression: string, scrollNextAttr: string): string => {
        return `div > table > tbody[repeat${repeatExpression}][${scrollNextAttr}]`;
      },
      createView: (repeatExpression: string, scrollNextAttr: string, {ct_h, ct_w, item_h, item_w}): string => {
        return `<div style="height: ${ct_h}px; overflow-y: scroll; padding: 0; margin: 0;">
          <table style="border-spacing: 0">
            <tbody
              virtual-repeat.for="item of items ${repeatExpression}"
              ${scrollNextAttr}>
              <tr
                style="height: ${item_h}px;">
                <td>\${item}</td>
              </tr>
            </tbody>
          </table>
        </div>`;
      }
    }
  ];

  const repeatResizingCombos: IRepeatSizingCombo[] = [
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
    [repeatResizingCombos, testGroups],
    ([repeatExpression, scrollNextAttr, extraResources], { sizes, title, createView }, callIndex) => {
      runSizingTestGroup(
        title(repeatExpression, scrollNextAttr, sizes),
        createView(repeatExpression, scrollNextAttr, sizes),
        sizes,
        extraResources
      );
    }
  );

  type IRepeatSizingCombo = [
    /*repeat extra expression*/string,
    /*infinite-scroll-next attr*/string,
    /*extraResources*/ any[]?
  ];

  interface IRepeatSizingSizeVariables {
    ct_w: number;
    ct_h: number;
    item_w: number;
    item_h: number;
  }

  interface ITestCaseGroup {
    desc?: string;
    sizes: IRepeatSizingSizeVariables;
    title: (
      repeatExpression: string,
      scrollNextAttr: string,
      sizes: IRepeatSizingSizeVariables
    ) => string;
    createView: (
      repeatExpression: string,
      scrollNextAttr: string,
      sizes: IRepeatSizingSizeVariables
    ) => string;
  }

  function runSizingTestGroup(
    title: string,
    $view: string,
    { ct_h, ct_w, item_w, item_h}: IRepeatSizingSizeVariables,
    extraResources: any[] = []
  ) {

    it([
      title,
      `100 items`,
      `  1. item: [h: ${item_h}], ct: [w: ${ct_w}, h: ${ct_h}]`,
      `  2. resize ct [w: ${ct_w}, h: ${ct_h / 2}]`,
      `  3. wait + assert`,
      `  4. resize ct [w: ${ct_w / 2}, h: ${ct_h / 2}]`,
      `  5. wait + assert`,
      `  6. restore ct [w: ${ct_w}, h: ${ct_h}]`,
      `  7. wait + assert`,
      ''
    ].join('\n\t'), async () => {
      const { virtualRepeat, viewModel } = await bootstrapComponent(
        {
          items: createItems(100),
          getNextPage: PLATFORM.noop as any
        },
        $view,
        extraResources
      );
      const scroller = virtualRepeat.getScroller();

      assertElementsInView(virtualRepeat, ct_h, item_h);

      scroller.style.height = `${ct_h / 2}px`;
      await waitForFrames(SAFE_FRAME_COUNT_FOR_CHANGE_PROPAGATION);

      expect(scroller).toBe(virtualRepeat.getScroller(), 'repeat.getScroller() unchanged');
      assertElementsInView(virtualRepeat, ct_h / 2, item_h, 'Step 3. ');
      validateScrolledState(virtualRepeat, viewModel, item_h, `resize: [w: ${ct_w}, h: ${ct_h / 2}]`);

      scroller.style.width = `${ct_w / 2}px`;
      await waitForFrames(SAFE_FRAME_COUNT_FOR_CHANGE_PROPAGATION);

      expect(scroller).toBe(virtualRepeat.getScroller(), 'repeat.getScroller() unchanged');
      assertElementsInView(virtualRepeat, ct_h / 2, item_h, 'Step 5. ');
      validateScrolledState(virtualRepeat, viewModel, item_h, `resize: [w: ${ct_w / 2}, h: ${ct_h / 2}]`);

      scroller.style.height = `${ct_h}px`;
      scroller.style.width = `${ct_w}px`;
      await waitForFrames(SAFE_FRAME_COUNT_FOR_CHANGE_PROPAGATION);

      expect(scroller).toBe(virtualRepeat.getScroller(), 'repeat.getScroller() unchanged');
      assertElementsInView(virtualRepeat, ct_h, item_h, 'Step 7. ');
      validateScrolledState(virtualRepeat, viewModel, item_h, `resize: [w: ${ct_w}, h: ${ct_h}]`);
    });

    it([
      title,
      `100 items + (resize + mutation)`,
      `  1. item: [h: ${item_h}], ct: [w: ${ct_w}, h: ${ct_h}]`,
      `  2. resize ct [w: ${ct_w}, h: ${ct_h / 2}]`,
      `  3. splice to 30`,
      `  4. wait() and assert`,
      `  5. resize ct [w: ${ct_w / 2}, h: ${ct_h / 2}]`,
      `  6. splice to 0`,
      `  7. wait() and assert`,
      `  8. restore ct [w: ${ct_w}, h: ${ct_h}]`,
      `  9. wait() and assert`,
      ``
    ].join('\n\t'), async () => {
      const { virtualRepeat, viewModel } = await bootstrapComponent(
        {
          items: createItems(100),
          getNextPage: PLATFORM.noop as any
        },
        $view,
        extraResources
      );
      const scroller = virtualRepeat.getScroller();

      assertElementsInView(virtualRepeat, ct_h, item_h);

      scroller.style.height = `${ct_h / 2}px`;
      viewModel.items.splice(0, Math.max(viewModel.items.length - 30, 0));
      await waitForFrames(SAFE_FRAME_COUNT_FOR_CHANGE_PROPAGATION );

      expect(scroller).toBe(virtualRepeat.getScroller(), 'repeat.getScroller() unchanged');
      assertElementsInView(virtualRepeat, ct_h / 2, item_h, 'Step 4. ');
      validateScrolledState(virtualRepeat, viewModel, item_h, `resize: [w: ${ct_w}, h: ${ct_h / 2}]`);

      // step 5.
      scroller.style.height = `${ct_h / 2}px`;
      scroller.style.width = `${ct_w / 2}px`;
      // step 6.
      viewModel.items.splice(0, Infinity);
      await waitForFrames(SAFE_FRAME_COUNT_FOR_CHANGE_PROPAGATION);

      expect(scroller).toBe(virtualRepeat.getScroller(), 'repeat.getScroller() unchanged');
      assertElementsInView(virtualRepeat, ct_h / 2, item_h, 'Step 7. ');
      validateScrolledState(virtualRepeat, viewModel, item_h, `resize: [w: ${ct_w / 2}, h: ${ct_h / 2}]`);

      // step 8.
      scroller.style.height = `${ct_h}px`;
      scroller.style.width = `${ct_w}px`;
      await waitForFrames(SAFE_FRAME_COUNT_FOR_CHANGE_PROPAGATION);

      expect(scroller).toBe(virtualRepeat.getScroller(), 'repeat.getScroller() unchanged');
      assertElementsInView(virtualRepeat, ct_h, item_h, 'Step 9. ');
      validateScrolledState(virtualRepeat, viewModel, item_h, `resize: [w: ${ct_w}, h: ${ct_h}]`);
    });


    // xit([
    //   title,
    //   `100 items`,
    //   `  -- item: [h: ${item_h}], ct: [w: ${ct_w}, h: ${ct_h}]`,
    //   `  -- resize ct [w: ${ct_w}, h: ${ct_h / 2}]`,
    //   `  -- resize ct [w: ${ct_w / 2}, h: ${ct_h / 2}]`,
    //   `  -- restore ct [w: ${ct_w}, h: ${ct_h}]`,
    //   ''
    // ].join('\n\t'), async () => {
    //   // empty
    // });

    // it([
    //   '100 items',
    //   '\t[rows] <-- h:30 each',
    //   '\t[ct resized] <-- h:60 each',
    //   '\t-- scroll range synced'
    // ].join('\n'), async () => {
    //   const { viewModel, virtualRepeat } = await bootstrapComponent({ items: createItems(100) });
    //   const scrollCtEl = document.querySelector('#scrollCtEl');
    //   expect(scrollCtEl.scrollHeight).toEqual(100 * 50 + 30, 'scrollCtEl.scrollHeight');
    //   for (let i = 0; 79 > i; ++i) {
    //     scrollCtEl.scrollTop = i;
    //     await waitForNextFrame();
    //     expect(virtualRepeat.view(0).bindingContext.item).toEqual('item0');
    //     // todo: more validation of scrolled state here
    //   }
    //   for (let i = 80; 80 + 49 > i; ++i) {
    //     scrollCtEl.scrollTop = i;
    //     await waitForNextFrame();
    //     expect(virtualRepeat.view(0).bindingContext.item).toEqual('item1');
    //     // todo: more validation of scrolled state here
    //   }
    // });
  }

  async function bootstrapComponent<T>($viewModel: ITestAppInterface<T>, $view: string, extraResources?: any[]) {
    component = StageComponent
      .withResources([
        'src/virtual-repeat',
        ...extraResources
      ])
      .inView($view)
      .boundTo($viewModel);
    await component.create(bootstrap);

    expect(document.body.contains(component.element)).toBe(true, 'repeat is setup in document');
    const virtualRepeat = component.viewModel;
    assertBasicSetup(virtualRepeat);

    return {
      virtualRepeat: virtualRepeat,
      viewModel: $viewModel,
      component: component
    };
  }

  function assertBasicSetup(repeat: VirtualRepeat): void {
    const items = repeat.items;
    const scroller = repeat.getScroller();
    if (document.body.contains(scroller) && scroller !== document.body) {
      expect(repeat._calcDistanceToTopInterval).toBe(undefined, 'repeat._calcTopDistance === undefined ✔');
    }
    if (items) {
      expect(repeat._scrollerEvents instanceof ElementEvents)
        .toBe(true, 'repeat._scrollerEvents ✔');
      expect(repeat._scrollerResizeObserver instanceof PLATFORM.global.ResizeObserver)
        .toBe(true, 'repeat._scrollerResizeObserver ✔');
    } else {
      expect(repeat._scrollerEvents).toBe(undefined, 'repeat._scrollerEvents === undefined ✔');
      expect(repeat._scrollerResizeObserver).toBe(undefined, 'repeat._scrollerResizeObserver === undefined ✔');
    }
  }

  function assertElementsInView(repeat: VirtualRepeat, ctHeight: number, itemHeight: number, extraTitle: string = ''): void {
    const itemsCount = Array.isArray(repeat.items) ? repeat.items.length : 0;
    const elementsInView = itemsCount === 0 ? 0 : repeat.minViewsRequired;
    const viewsLength = itemsCount === 0 ? 0 : repeat.minViewsRequired * 2;
    const expectedElementsInView = itemsCount === 0
      ? 0
      : itemHeight === 0
        ? 1
        : Math.floor(ctHeight / itemHeight) + 1;

    expect(elementsInView).toBe(
      expectedElementsInView,
      `${extraTitle}repeat.elementsInView === ${expectedElementsInView} ? (1)`
    );
    expect(viewsLength).toBe(
      expectedElementsInView * 2,
      `${extraTitle}repeat._viewsLength === ${expectedElementsInView * 2} (2)`
    );
    if (repeat.items) {
      const realViewCount = repeat.viewCount();
      if (repeat.items.length >= expectedElementsInView * 2) {
        expect(realViewCount).toBe(
          expectedElementsInView * 2,
          `${extraTitle}repeat.viewCount() === ${expectedElementsInView * 2} (3)`
        );
      } else {
        expect(realViewCount).toBe(
          repeat.items.length,
          `${extraTitle}repeat.viewCount() === repeat.items.length (4)`
        );
      }
    }
  }

  function createItems(amount: number, name: string = 'item') {
    return Array.from({ length: amount }, (_, index) => name + index);
  }
});
