import './setup';
import { StageComponent, ComponentTester } from 'aurelia-testing';
import { PLATFORM } from 'aurelia-pal';
import { bootstrap } from 'aurelia-bootstrapper';
import { createAssertionQueue, validateState, AsyncQueue, validateScroll, waitForNextFrame } from './utilities';
import { VirtualRepeat } from '../src/virtual-repeat';
import { IScrollNextScrollContext } from '../src/interfaces';

PLATFORM.moduleName('src/virtual-repeat');
PLATFORM.moduleName('test/noop-value-converter');
PLATFORM.moduleName('src/infinite-scroll-next');

describe('vr-integration.table.spec.ts', () => {
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

  describe('<tr virtual-repeat.for>', () => {
    beforeEach(() => {
      view = `<table>
        <tr style="height: ${itemHeight}px;" virtual-repeat.for="item of items"><td>\${item}</td></tr>
      </table>`;
    });

    it('handles push', done => {
      bootstrapComponent()
        .then(() => {
          validatePush(virtualRepeat, viewModel, done);
        })
        .catch(done.fail);
    });

    it('handles array changes', done => {
      bootstrapComponent()
        .then(() => {
          validateArrayChange(virtualRepeat, viewModel, done);
        })
        .catch(done.fail);
    });
  });

  describe('<tbody virtual-repeat.for>', () => {

    beforeEach(() => {
      view = `<table><tr style="height: ${itemHeight}px;" virtual-repeat.for="item of items"><td>\${item}</td></tr></table>`;
    });

    it('creates right structure', async () => {
      await bootstrapComponent();
      const { topBufferEl: topBuffer, bottomBufferEl: bottomBuffer } = virtualRepeat;
      expect(topBuffer.nextElementSibling.tagName).toBe('TR');
      expect(topBuffer.tagName).toBe('TR');
      expect(topBuffer.childNodes.length).toBe(0);
      expect(bottomBuffer.previousSibling.nodeType).toBe(Node.COMMENT_NODE);
      expect(bottomBuffer.previousElementSibling.tagName).toBe('TR');
      expect(bottomBuffer.tagName).toBe('TR');
      expect(bottomBuffer.childNodes.length).toBe(0);
    });

    it('works', (done) => {
      view =
      `<table style="border-spacing: 0">
        <tbody virtual-repeat.for="item of items">
          <tr style="height: ${itemHeight}px;"><td>\${item}</td></tr>
        </tbody>
      </table>`;
      bootstrapComponent()
        .then(() => {
          queue(() => validateState(component.viewModel, viewModel, itemHeight));
          queue(() => done());
        })
        .catch(done.fail);
    });

    it('works with static row', (done) => {
      // there is a small border spacing between tbodies, rows that will add up
      // need to add border spacing 0 for testing purposes
      view =
      `<table style="border-spacing: 0">
        <tr><td>Name</td></tr>
        <tbody virtual-repeat.for="item of items">
          <tr style="height: ${itemHeight}px;"><td>\${item}</td></tr>
        </tbody>
      </table>`;

      bootstrapComponent()
        .then(() => {
          const element = virtualRepeat['element'];
          const table = element.parentNode;
          expect(table.firstElementChild).toBe(virtualRepeat.topBufferEl.previousElementSibling);
          expect(table.firstElementChild.innerHTML.trim()).toBe('<tr><td>Name</td></tr>');
          queue(() => validateState(virtualRepeat, viewModel, itemHeight));
          queue(() => validatePush(virtualRepeat, viewModel, done));
        })
        .catch(done.fail);
    });

    describe('with [infinite-scroll-next]', () => {

      beforeEach(() => {
        resources.push('src/infinite-scroll-next');
      });

      describe('invoke "_getMore()" when initial amount of items is small', () => {

        it('works with string as value of scroll-next attribute', async () => {
          view =
          `<div style="height: 500px; overflow-y: scroll">
            <table>
              <tbody
                virtual-repeat.for="item of items"
                infinite-scroll-next="getNextPage">
                <tr style="height: 50px;"><td>\${item}</td></tr>
              </tbody>
            </table>
          </div>`;

          let called = false;
          viewModel.items = createItems(5);
          viewModel.getNextPage = jasmine.createSpy('getNextPage()').and.callFake(
            (topIndex: number, isAtTop: boolean, isAtBottom: boolean) => {
              expect(topIndex).toBe(0, 'topIndex === 0');
              expect(isAtTop).toBe(true, 'isAtTop === true');
              expect(isAtBottom).toBe(true, 'isAtBottom === true');
              called = true;
            }
          );

          await bootstrapComponent();
          await waitForNextFrame();

          expect(called).toBe(true, 'infinite-scroll-next called()');
          expect(viewModel.getNextPage).toHaveBeenCalledTimes(1);
        });

        it('works with call binding expression', async () => {
          view =
          `<div style="height: 500px; overflow-y: scroll">
            <table>
              <tbody
                virtual-repeat.for="item of items"
                infinite-scroll-next.call="getNextPage($scrollContext)">
                <tr style="height: 50px;"><td>\${item}</td></tr>
              </tbody>
            </table>
          </div>`;

          let scrollContext: IScrollNextScrollContext;
          viewModel.items = createItems(5);
          viewModel.getNextPage = jasmine.createSpy('getNextPage()').and.callFake(($scrollContext: IScrollNextScrollContext) => {
            scrollContext = $scrollContext;
          });

          await bootstrapComponent();
          await waitForNextFrame();

          expect(scrollContext).toBeDefined();
          expect(scrollContext.isAtTop).toBe(true);
          expect(scrollContext.isAtBottom).toBe(true, 'Expected is at bottom to be true, recevied:' + scrollContext.isAtBottom);
          expect(scrollContext.topIndex).toBe(0);
          expect(viewModel.getNextPage).toHaveBeenCalledTimes(1);
        });

        it('does not work with normal binding expression', async () => {
          view =
          `<div style="height: 500px; overflow-y: scroll">
            <table>
              <tbody
                virtual-repeat.for="item of items"
                infinite-scroll-next.bind="getNextPage">
                <tr style="height: 50px;"><td>\${item}</td></tr>
              </tbody>
            </table>
          </div>`;

          viewModel.items = createItems(5);
          viewModel.getNextPage = jasmine.createSpy('getNextPage()');

          await bootstrapComponent();

          expect(viewModel.getNextPage).not.toHaveBeenCalled();
        });
      });
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

  function validateArrayChange(virtualRepeat: VirtualRepeat, viewModel, done) {

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
