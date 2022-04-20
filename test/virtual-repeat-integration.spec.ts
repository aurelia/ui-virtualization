
import './setup';
import { StageComponent } from './component-tester';
import { PLATFORM } from 'aurelia-pal';
import { createAssertionQueue, validateState, validateScrolledState, AsyncQueue, waitForTimeout } from './utilities';
import { VirtualRepeat } from '../src/virtual-repeat';

PLATFORM.moduleName('src/virtual-repeat');
PLATFORM.moduleName('test/noop-value-converter');
PLATFORM.moduleName('src/infinite-scroll-next');

describe('virtual-repeat-integration.spec.ts', () => {

  // async queue
  let nq: AsyncQueue = createAssertionQueue();
  let itemHeight = 100;

  /**
   * Manually dispatch a scroll event and validate scrolled state of virtual repeat
   *
   * Programatically set `scrollTop` of element specified with `elementSelector` query string
   * (or `#scrollContainer` by default) to be equal with its `scrollHeight`
   */
  function validateScroll(virtualRepeat: VirtualRepeat, viewModel: any, done: Function, elementSelector?: string): void {
    let elem = document.getElementById(elementSelector || 'scrollContainer');
    let event = new Event('scroll');
    elem.scrollTop = elem.scrollHeight;
    elem.dispatchEvent(event);
    window.setTimeout(() => {
      window.requestAnimationFrame(() => {
        validateScrolledState(virtualRepeat, viewModel, itemHeight);
        done();
      });
    });
  }

  function validatePush(virtualRepeat: VirtualRepeat, viewModel: any, done: Function) {
    viewModel.items.push('Foo');
    nq(() => validateState(virtualRepeat, viewModel, itemHeight));

    for (let i = 0; i < 5; ++i) {
      viewModel.items.push(`Foo ${i}`);
    }

    nq(() => validateState(virtualRepeat, viewModel, itemHeight));
    nq(() => done());
  }

  function validatePop(virtualRepeat: VirtualRepeat, viewModel: any, done: Function) {
    viewModel.items.pop();
    nq(() => validateState(virtualRepeat, viewModel, itemHeight));
    nq(() => viewModel.items.pop());
    nq(() => validateState(virtualRepeat, viewModel, itemHeight));
    nq(() => viewModel.items.pop());
    nq(() => validateState(virtualRepeat, viewModel, itemHeight));
    nq(() => done());
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function validateUnshift(virtualRepeat, viewModel, done) {
    viewModel.items.unshift('z');
    nq(() => validateState(virtualRepeat, viewModel, itemHeight));
    nq(() => viewModel.items.unshift('y', 'x'));
    nq(() => validateState(virtualRepeat, viewModel, itemHeight));
    nq(() => viewModel.items.unshift());
    nq(() => validateState(virtualRepeat, viewModel, itemHeight));
    nq(() => done());
  }

  function validateShift(virtualRepeat, viewModel, done) {
    viewModel.items.shift();
    nq(() => validateState(virtualRepeat, viewModel, itemHeight));
    nq(() => viewModel.items.shift());
    nq(() => validateState(virtualRepeat, viewModel, itemHeight));
    nq(() => viewModel.items.shift());
    nq(() => validateState(virtualRepeat, viewModel, itemHeight));
    nq(() => done());
  }

  function validateReverse(virtualRepeat, viewModel, done) {
    viewModel.items.reverse();
    nq(() => validateState(virtualRepeat, viewModel, itemHeight));
    nq(() => done());
  }

  function validateSplice(virtualRepeat: VirtualRepeat, viewModel: any, done: Function) {
    viewModel.items.splice(2, 1, 'x', 'y');
    nq(() => validateState(virtualRepeat, viewModel, itemHeight));
    nq(() => done());
  }

  function validateArrayChange(virtualRepeat, viewModel, done) {
    const createItems = (name, amount) => new Array(amount).map((v, index) => name + index);

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

  describe('iterating div', () => {
    let component;
    let virtualRepeat: VirtualRepeat;
    let viewModel;
    let create;
    let items;

    let hiddenComponent;
    let hiddenCreate;
    let hiddenVirtualRepeat: VirtualRepeat;
    let hiddenViewModel;

    let containerComponent;
    let containerCreate;
    let containerVirtualRepeat: VirtualRepeat;
    let containerViewModel;

    beforeEach(() => {
      items = [];
      for (let i = 0; i < 1000; ++i) {
        items.push('item' + i);
      }
      component = StageComponent
        .withResources('src/virtual-repeat')
        .inView(`<div style="height: ${itemHeight}px;" virtual-repeat.for="item of items">\${item}</div>`)
        .boundTo({ items: items });

      create = component.create().then(() => {
        virtualRepeat = component.sut;
        viewModel = component.viewModel;
      });

      hiddenComponent = StageComponent
        .withResources('src/virtual-repeat')
        .inView(`<div id="scrollContainer" style="height: 500px; overflow-y: scroll; display: none">
                        <div style="height: ${itemHeight}px;" virtual-repeat.for="item of items">\${item}</div>
                    </div>`)
        .boundTo({ items: items });

      hiddenCreate = hiddenComponent.create().then(() => {
        hiddenVirtualRepeat = hiddenComponent.sut;
        hiddenViewModel = hiddenComponent.viewModel;
      });

      containerComponent = StageComponent
        .withResources('src/virtual-repeat')
        .inView(`<div id="scrollContainer2" style="height: 500px; overflow-y: scroll;">
                        <div style="height: ${itemHeight}px;" virtual-repeat.for="item of items">\${item}</div>
                    </div>`)
        .boundTo({ items: items });

      containerCreate = containerComponent.create().then(() => {
        containerVirtualRepeat = containerComponent.sut;
        containerViewModel = containerComponent.viewModel;
        spyOn(containerVirtualRepeat, '_onScroll').and.callThrough();
      });

      create = Promise.all([
        create,
        hiddenCreate,
        containerCreate,
      ]);
    });

    afterEach(() => {
      component.cleanUp();
      hiddenComponent.cleanUp();
      containerComponent.cleanUp();
    });

    describe('handles delete', () => {
      it('can delete one at start', async () => {
        await create;
        await new Promise<void>(resolve => {
          viewModel.items.splice(0, 1);
          nq(() => validateState(virtualRepeat, viewModel, itemHeight));
          nq(() => resolve());
        });
      });

      it('can delete one at end', done => {
        create.then(() => {
          viewModel.items.splice(viewModel.items.length - 1, 1);
          nq(() => validateState(virtualRepeat, viewModel, itemHeight));
          nq(() => done());
        });
      });

      it('can delete two at start', done => {
        create.then(() => {
          viewModel.items.splice(0, 1);
          viewModel.items.splice(0, 1);
          nq(() => validateState(virtualRepeat, viewModel, itemHeight));
          nq(() => done());
        });
      });

      it('can delete two at end', done => {
        create.then(() => {
          viewModel.items.splice(viewModel.items.length - 1, 1);
          viewModel.items.splice(viewModel.items.length - 1, 1);
          nq(() => validateState(virtualRepeat, viewModel, itemHeight));
          nq(() => done());
        });
      });

      it('can delete as many as in the DOM', done => {
        create.then(() => {
          let deleteCount = virtualRepeat.viewCount();
          for (let i = 0; i < deleteCount; ++i) {
            viewModel.items.splice(0, 1);
          }
          nq(() => validateState(virtualRepeat, viewModel, itemHeight));
          nq(() => done());
        });
      });

      it('can delete more element than what is in the DOM', done => {
        create.then(() => {
          let deleteCount = virtualRepeat.viewCount() * 2;
          for (let i = 0; i < deleteCount; ++i) {
            viewModel.items.splice(0, 1);
          }
          nq(() => validateState(virtualRepeat, viewModel, itemHeight));
          nq(() => done());
        });
      });

      it('can delete all', done => {
        create.then(() => {
          let deleteCount = viewModel.items.length;
          for (let i = 0; i < deleteCount; ++i) {
            viewModel.items.splice(0, 1);
          }
          nq(() => validateState(virtualRepeat, viewModel, itemHeight));
          nq(() => done());
        });
      });
    });

    it('handles push', done => {
      create.then(() => validatePush(virtualRepeat, viewModel, done));
    });

    it('handles pop', done => {
      create.then(() => validatePop(virtualRepeat, viewModel, done));
    });

    it('handles unshift', async () => {
      await create;
      viewModel.items.unshift('z');
      expect(virtualRepeat.view(0).bindingContext.item).toBe('item0', 'unshifting z 1');

      await Promise.resolve();
      expect(virtualRepeat.view(0).bindingContext.item).toBe('z', 'unshifted z 1');
      validateScrolledState(virtualRepeat, viewModel, itemHeight);

      viewModel.items.unshift('y', 'x');
      expect(virtualRepeat.view(0).bindingContext.item).toBe('z', 'unshifting y,x 1');
      await Promise.resolve();
      expect(virtualRepeat.view(0).bindingContext.item).toBe('y', 'unshifted y,x 1');
      expect(virtualRepeat.view(1).bindingContext.item).toBe('x', 'unshifted y,x 2');
      validateScrolledState(virtualRepeat, viewModel, itemHeight);

      // verify that unshifting undefined won't disrupt anything
      viewModel.items.unshift();
      expect(virtualRepeat.view(0).bindingContext.item).toBe('y', 'unshifting undefined 1');
      await Promise.resolve();
      expect(virtualRepeat.view(0).bindingContext.item).toBe('y', 'unshifted undefined 1');
      validateScrolledState(virtualRepeat, viewModel, itemHeight);
    });

    it('handles shift', done => {
      create.then(() => validateShift(virtualRepeat, viewModel, done));
    });

    it('handles reverse', done => {
      create.then(() => validateReverse(virtualRepeat, viewModel, done));
    });

    it('handles splice', done => {
      create.then(() => validateSplice(virtualRepeat, viewModel, done));
    });

    it('handles displaying when initially hidden', async () => {
      await hiddenCreate;

      await new Promise<void>(resolve => {
        hiddenVirtualRepeat.scrollerEl.style.display = 'block';
        window.requestAnimationFrame(() => {
          window.setTimeout(() => {
            validateState(hiddenVirtualRepeat, hiddenViewModel, itemHeight);
            resolve();
          }, 750);
        });
      });
    });

    it('does not invoke _onScroll after attached()', async () => {
      await containerCreate;
      await new Promise<void>(resolve => {
        validateScroll(containerVirtualRepeat, containerViewModel, () => {
          expect(containerVirtualRepeat._onScroll).not.toHaveBeenCalled();
          resolve();
        }, 'scrollContainer2');
      });
    });

    it('handles array changes', done => {
      create.then(() => validateArrayChange(virtualRepeat, viewModel, done));
    });

    it('handles array changes with null / undefined', async () => {
      await create;
      viewModel.items = null;
      await waitForTimeout(50);

      let topBufferHeight = virtualRepeat.topBufferEl.getBoundingClientRect().height;
      let bottomBufferHeight = virtualRepeat.bottomBufferEl.getBoundingClientRect().height;

      expect(topBufferHeight + bottomBufferHeight).toBe(0);

      await new Promise<void>(resolve => {
        validateArrayChange(virtualRepeat, viewModel, resolve);
      });
    });
  });

  describe('value converters', () => {
    let component;
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
        .withResources(['src/virtual-repeat', 'test/noop-value-converter'])
        .inView(`<div style="height: ${itemHeight}px;" virtual-repeat.for="item of items | noop">\${item}</div>`)
        .boundTo({ items: items });

      create = component.create().then(() => {
        virtualRepeat = component.sut;
        viewModel = component.viewModel;
      });
    });

    afterEach(() => {
      component.cleanUp();
    });

    it('handles push', done => {
      create.then(() => validatePush(virtualRepeat, viewModel, done));
    });

    it('handles pop', done => {
      create.then(() => validatePop(virtualRepeat, viewModel, done));
    });

    it('handles unshift', done => {
      create.then(() => {
        viewModel.items.unshift('z');
        nq(() => validateState(virtualRepeat, viewModel, itemHeight));
        nq(() => done());
      });
    });

    it('handles shift', done => {
      create.then(() => validateShift(virtualRepeat, viewModel, done));
    });

    it('handles reverse', done => {
      create.then(() => validateReverse(virtualRepeat, viewModel, done));
    });

    it('handles splice', done => {
      create.then(() => validateSplice(virtualRepeat, viewModel, done));
    });
  });

});
