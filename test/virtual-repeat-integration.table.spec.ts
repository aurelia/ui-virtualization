import './setup';
import {StageComponent, ComponentTester} from './component-tester';
import { PLATFORM } from 'aurelia-pal';
import { createAssertionQueue, validateState } from './utilities';
import { VirtualRepeat } from '../src/virtual-repeat';

PLATFORM.moduleName('src/virtual-repeat');
PLATFORM.moduleName('test/noop-value-converter');

fdescribe('VirtualRepeat Integration', () => {
  const itemHeight = 100;
  const nq = createAssertionQueue();

  describe('<tr virtual-repeat.for>', () => {
    let component: ComponentTester;
    let virtualRepeat;
    let viewModel;
    let create;
    let items;

    beforeEach(() => {

      items = [];
      for (let i = 0; i < 1000; ++i) {
        items.push('item' + i);
      }
      component = StageComponent
        .withResources([
          'src/virtual-repeat',
          'test/noop-value-converter'
        ])
        .inView(`<table><tr style="height: ${itemHeight}px;" virtual-repeat.for="item of items"><td>\${item}</td></tr></table>`)
        .boundTo({ items: items });

      create = component.create().then(() => {
        virtualRepeat = component.sut;
        viewModel = component.viewModel;
      });
    });

    afterEach(() => {
      return component.cleanUp();
    });

    it('handles push', async (done) => {
      await create;
      validatePush(virtualRepeat, viewModel, done);
    });
    it('handles array changes', async done => {
      await create;
      validateArrayChange(virtualRepeat, viewModel, done);
    });
  });

  describe('<tbody virtual-repeat.for>', () => {
    let component: ComponentTester;
    let virtualRepeat: VirtualRepeat;
    let viewModel;
    let create;
    let items;

    beforeEach(() => {

      items = [];
      for (let i = 0; i < 1000; ++i) {
        items.push('item' + i);
      }
      component = StageComponent
        .withResources([
          'src/virtual-repeat',
          'test/noop-value-converter'
        ])
        .inView(`<table><tr style="height: ${itemHeight}px;" virtual-repeat.for="item of items"><td>\${item}</td></tr></table>`)
        .boundTo({ items: items });

      // create = component.create().then(() => {
      //   virtualRepeat = component.sut;
      //   viewModel = component.viewModel;
      // });
    });

    afterEach(() => {
      if (component) {
        return component.cleanUp();
      }
    });

    it('creates right structure', async (done) => {
      try {
        component.inView('<table><tbody virtual-repeat.for="item of items"><tr><td>\${item}</td></tr></tbody>');
        await component.create().then(() => {
          virtualRepeat = component.sut;
          viewModel = component.viewModel;
        });
        const element = virtualRepeat['element'];
        const { topBuffer, bottomBuffer } = virtualRepeat;
        expect(topBuffer.nextElementSibling.tagName).toBe('TBODY');
        expect(topBuffer.tagName).toBe('TR');
        expect(topBuffer.childNodes.length).toBe(0);
        expect(bottomBuffer.previousSibling.nodeType).toBe(Node.COMMENT_NODE);
        expect(bottomBuffer.previousElementSibling.tagName).toBe('TBODY');
        expect(bottomBuffer.tagName).toBe('TR');
        expect(bottomBuffer.childNodes.length).toBe(0);
        done();
      } catch (ex) {
        done.fail(ex);
      }
    });

    it('works', async (done) => {
      try {
        component.inView(
        // there is a small border spacing between tbodies, rows that will add up
        // need to add border spacing 0 for testing purposes
        `<table style="border-spacing: 0">
          <tbody virtual-repeat.for="item of items">
            <tr style="height: ${itemHeight}px;"><td>\${item}</td></tr>
          </tbody>
        </table>`);
        await component.create().then(() => {
          virtualRepeat = component.sut;
          viewModel = component.viewModel;
        });
        nq(() => validateState(virtualRepeat, viewModel, itemHeight));
        nq(() => done());
      } catch (ex) {
        done.fail(ex);
      }
    });
  });

  function validatePush(virtualRepeat: VirtualRepeat, viewModel: any, done: Function) {
    viewModel.items.push('Foo');
    nq(() => validateState(virtualRepeat, viewModel, itemHeight));

    for (let i = 0; i < 5; ++i) {
      viewModel.items.push(`Foo ${i}`);
    }

    nq(() => validateState(virtualRepeat, viewModel, itemHeight));
    nq(() => done());
  }

  function validateArrayChange(virtualRepeat, viewModel, done) {
    const createItems = (name: string, amount: number) => new Array(amount).map((v, index) => name + index);

    viewModel.items = createItems('A', 4);
    nq(() => validateState(virtualRepeat, viewModel, itemHeight));
    nq(() => viewModel.items = createItems('B', 0));
    nq(() => validateState(virtualRepeat, viewModel, itemHeight));
    nq(() => viewModel.items = createItems('C', 101));
    nq(() => validateState(virtualRepeat, viewModel, itemHeight));
    nq(() => viewModel.items = createItems('D', 0));
    nq(() => validateState(virtualRepeat, viewModel, itemHeight));
    nq(() => done());
  }
});
