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

  describe('iterating table', () => {
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

  fdescribe('<tbody virtual-repeat.for>', () => {
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

    it('works', async (done) => {

      component.inView('<table><tbody virtual-repeat.for="item of items"><tr><td>\${item}</td></tr></tbody>');
      await component.create().then(() => {
        virtualRepeat = component.sut;
        viewModel = component.viewModel;
      });
      const element = virtualRepeat['element'];
      expect(virtualRepeat.topBuffer.nextElementSibling.tagName).toBe('TABLE');
      expect(virtualRepeat.bottomBuffer.previousElementSibling.tagName).toBe('TABLE');
      done();
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
