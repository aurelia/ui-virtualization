import './setup';
import { StageComponent } from './component-tester';
import { PLATFORM } from 'aurelia-pal';
import { createAssertionQueue, validateState, validateScrolledState, AsyncQueue, waitForTimeout } from './utilities';
import { VirtualRepeat } from '../src/virtual-repeat';

PLATFORM.moduleName('src/virtual-repeat');
PLATFORM.moduleName('test/noop-value-converter');
PLATFORM.moduleName('src/infinite-scroll-next');

describe('VirtualRepeat Integration', () => {

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

  function validateScrollUp(virtualRepeat: VirtualRepeat, viewModel: any, done: Function, element?: string): void {
    let elem = document.getElementById(element || 'scrollContainer');
    let event = new Event('scroll');
    elem.scrollTop = elem.scrollHeight / 2; // Scroll down but not far enough to reach bottom and call 'getNext'
    elem.dispatchEvent(event);
    window.setTimeout(() => {
      window.requestAnimationFrame(() => {
        let eventUp = new Event('scroll');
        elem.scrollTop = 0;
        elem.dispatchEvent(eventUp);
        window.setTimeout(() => {
          window.requestAnimationFrame(() => {
            validateScrolledState(virtualRepeat, viewModel, itemHeight);
            done();
          });
        });
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
    let hiddenVirtualRepeat;
    let hiddenViewModel;

    let containerComponent;
    let containerCreate;
    let containerVirtualRepeat;
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
        containerCreate
      ]);
    });

    afterEach(() => {
      component.cleanUp();
      hiddenComponent.cleanUp();
      containerComponent.cleanUp();
    });

    describe('handles delete', () => {
      it('can delete one at start', async done => {
        await create;
        viewModel.items.splice(0, 1);
        nq(() => validateState(virtualRepeat, viewModel, itemHeight));
        nq(() => done());
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

    it('handles unshift', done => {
      create.then(() => validateUnshift(virtualRepeat, viewModel, done));
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

    it('handles displaying when initially hidden', done => {
      hiddenCreate.then(() => {
        hiddenVirtualRepeat.scrollContainer.style.display = 'block';
        window.requestAnimationFrame(() => {
          window.setTimeout(() => {
            validateState(hiddenVirtualRepeat, hiddenViewModel, itemHeight);
            done();
          }, 750);
        });
      });
    });

    it('handles scrolling to bottom', done => {
      containerCreate.then(() => {
        validateScroll(containerVirtualRepeat, containerViewModel, () => {
          expect(containerVirtualRepeat._onScroll).toHaveBeenCalled();
          done();
        }, 'scrollContainer2');
      });
    });

    it('handles array changes', done => {
      create.then(() => validateArrayChange(virtualRepeat, viewModel, done));
    });

    it('handles array changes with null / undefined', async (done) => {
      await create;
      viewModel.items = null;
      await waitForTimeout(50);

      let topBufferHeight = virtualRepeat.topBufferEl.getBoundingClientRect().height;
      let bottomBufferHeight = virtualRepeat.bottomBufferEl.getBoundingClientRect().height;

      expect(topBufferHeight + bottomBufferHeight).toBe(0);

      validateArrayChange(virtualRepeat, viewModel, done);
    });
  });

  describe('value converters', () => {
    let component;
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

  describe('infinite scroll', () => {
    let component;
    let virtualRepeat;
    let viewModel;
    let create;
    let items;

    let vm;
    let nestedVm;
    let nestedComponent;
    let nestedCreate;
    let nestedVirtualRepeat;
    let nestedViewModel;
    let promisedVm;
    let promisedComponent;
    let promisedCreate;
    let promisedVirtualRepeat;
    let promisedViewModel;
    beforeEach(() => {
      items = [];
      vm = {
        items: items,
        getNextPage: function () {
          let itemLength = this.items.length;
          for (let i = 0; i < 100; ++i) {
            let itemNum = itemLength + i;
            this.items.push('item' + itemNum);
          }
        }
      };
      nestedVm = {
        items: items,
        bar: [1],
        getNextPage: function (topIndex, isAtBottom, isAtTop) {
          let itemLength = this.items.length;
          for (let i = 0; i < 100; ++i) {
            let itemNum = itemLength + i;
            this.items.push('item' + itemNum);
          }
        }
      };
      promisedVm = {
        items: items,
        test: '2',
        getNextPage: jasmine.createSpy('promisedVm.getNextPage', function() {
          return new Promise((resolve, reject) => {
            let itemLength = this.items.length;
            for (let i = 0; i < 100; ++i) {
              let itemNum = itemLength + i;
              this.items.push('item' + itemNum);
            }
            resolve(true);
          });
        }).and.callThrough()
      };
      for (let i = 0; i < 1000; ++i) {
        items.push('item' + i);
      }

      spyOn(vm, 'getNextPage').and.callThrough();
      spyOn(nestedVm, 'getNextPage').and.callThrough();

      component = StageComponent
        .withResources(['src/virtual-repeat', 'src/infinite-scroll-next'])
        .inView(`<div id="scrollContainer" style="height: 500px; overflow-y: scroll">
                      <div style="height: ${itemHeight}px;" virtual-repeat.for="item of items" infinite-scroll-next="getNextPage">\${item}</div>
                  </div>`)
        .boundTo(vm);
      nestedComponent = StageComponent
        .withResources(['src/virtual-repeat', 'src/infinite-scroll-next'])
        .inView(`<div id="scrollContainerNested" style="height: 500px; overflow-y: scroll" repeat.for="foo of bar">
                      <div style="height: ${itemHeight}px;"
                        virtual-repeat.for="item of items"
                        infinite-scroll-next.call="$parent.getNextPage($scrollContext)">\${item}</div>
                  </div>`)
        .boundTo(nestedVm);
      promisedComponent = StageComponent
        .withResources(['src/virtual-repeat', 'src/infinite-scroll-next'])
        .inView(`<div id="scrollContainerPromise" style="height: 500px; overflow-y: scroll">
                      <div style="height: ${itemHeight}px;" virtual-repeat.for="item of items" infinite-scroll-next="getNextPage">\${item}</div>
                  </div>`)
        .boundTo(promisedVm);

      create = component.create().then(() => {
        virtualRepeat = component.sut;
        viewModel = component.viewModel;
        spyOn(virtualRepeat, '_onScroll').and.callThrough();
      });
      nestedCreate = nestedComponent.create().then(() => {
        nestedVirtualRepeat = nestedComponent.sut.view(0).controllers[0].viewModel;
        nestedViewModel = nestedComponent.viewModel;
      });
      promisedCreate = promisedComponent.create().then(() => {
        promisedVirtualRepeat = promisedComponent.sut;
        promisedViewModel = promisedComponent.viewModel;
      });

      create = Promise.all([
        create,
        nestedCreate,
        promisedCreate
      ]);
    });

    afterEach(() => {
      component.cleanUp();
      nestedComponent.cleanUp();
      promisedComponent.cleanUp();
    });

    it('handles scrolling', done => {
      create.then(() => {
        validateScroll(virtualRepeat, viewModel, () => {
          expect(virtualRepeat._onScroll).toHaveBeenCalled();
          done();
        });
      });
    });

    it('handles getting next data set', done => {
      create.then(() => {
        validateScroll(virtualRepeat, viewModel, () => {
          expect(vm.getNextPage).toHaveBeenCalled();
          done();
        });
      });
    });
    it('handles getting next data set from nested function', done => {
      nestedCreate.then(() => {
        validateScroll(nestedVirtualRepeat, nestedViewModel, () => {
          expect(nestedVm.getNextPage).toHaveBeenCalled();
          done();
        }, 'scrollContainerNested');
      });
    });
    it('handles getting next data set scrolling up', done => {
      create.then(() => {
        validateScrollUp(virtualRepeat, viewModel, () => {
          let args = vm.getNextPage.calls.argsFor(0);
          expect(args[0]).toEqual(0);
          expect(args[1]).toBe(false);
          expect(args[2]).toBe(true);
          done();
        });
      });
    });
    it('handles getting next data set with promises', async done => {
      await create;
      await promisedCreate;
      validateScroll(
        promisedVirtualRepeat,
        promisedViewModel,
        async () => {
          await waitForTimeout(500);
          expect(promisedVm.getNextPage).toHaveBeenCalled();
          // Jasmine spies seem to not be working with returned promises and getting the instance of them, causing regular checks on getNextPage to fail
          expect(promisedVm.items.length).toBe(1100);
          done();
        },
        'scrollContainerPromise'
      );
    });
    it('handles getting next data set with small page size', done => {
      vm.items = [];
      for (let i = 0; i < 7; ++i) {
        vm.items.push('item' + i);
      }
      create.then(() => {
        validateScroll(virtualRepeat, viewModel, () => {
          expect(vm.getNextPage).toHaveBeenCalled();
          done();
        });
      });
    });
    // The following test used to pass because there was no getMore() invoked during initialization
    // so `validateScroll()` would not have been able to trigger all flow within _handleScroll of VirtualRepeat instance
    // with the commit to fix issue 129, it starts to have more item and thus, scrollContainer has real scrollbar
    // making synthesized scroll event in `validateScroll` work, resulting in failed test
    // kept but commented out for history reason
    // it('handles not scrolling if number of items less than elements in view', done => {
    //   vm.items = [];
    //   for (let i = 0; i < 5; ++i) {
    //     vm.items.push('item' + i);
    //   }
    //   create.then(() => {
    //     validateScroll(virtualRepeat, viewModel, () => {
    //       expect(vm.getNextPage).not.toHaveBeenCalled();
    //       done();
    //     });
    //   });
    // });
    it('passes the current index and location state', done => {
      create.then(() => {
        validateScroll(virtualRepeat, viewModel, () => {
          // Taking into account 1 index difference due to default styles on browsers causing small margins of error
          let args = vm.getNextPage.calls.argsFor(0);
          expect(args[0]).toBeGreaterThan(988);
          expect(args[0]).toBeLessThan(995);
          expect(args[1]).toBe(true);
          expect(args[2]).toBe(false);
          done();
        });
      });
    });
    it('passes context information when using call', done => {
      nestedCreate.then(() => {
        validateScroll(nestedVirtualRepeat, nestedViewModel, () => {
          // Taking into account 1 index difference due to default styles on browsers causing small margins of error
          expect(nestedVm.getNextPage).toHaveBeenCalled();
          let scrollContext = nestedVm.getNextPage.calls.argsFor(0)[0];
          expect(scrollContext.topIndex).toBeGreaterThan(988);
          expect(scrollContext.topIndex).toBeLessThan(995);
          expect(scrollContext.isAtBottom).toBe(true);
          expect(scrollContext.isAtTop).toBe(false);
          done();
        }, 'scrollContainerNested');
      });
    });

    xdescribe('scrolling div', () => {
      beforeEach(() => {
        items = [];
        for (let i = 0; i < 1000; ++i) {
          items.push('item' + i);
        }

        component = StageComponent
          .withResources(['src/virtual-repeat'])
          .inView(`<div id="scrollContainer" style="height: 500px; overflow-y: scroll;">
                    <div style="height: ${itemHeight}px;" virtual-repeat.for="item of items">\${item}</div>
                  </div>`)
          .boundTo({ items: items });

        create = component.create().then(() => {
          virtualRepeat = component.sut;
          viewModel = component.viewModel;
        });
      });

      afterEach(() => {
        component.cleanUp();
      });

      it('handles splice when scrolled to end', done => {
        create.then(() => {
          validateScroll(virtualRepeat, viewModel, () => {
            viewModel.items.splice(995, 1, 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j');
            nq(() => validateScrolledState(virtualRepeat, viewModel, itemHeight));
            nq(() => validateScroll(virtualRepeat, viewModel, () => {
              let views = virtualRepeat.viewSlot.children;
              setTimeout(() => {
                expect(views[views.length - 1].bindingContext.item).toBe(viewModel.items[viewModel.items.length - 1]);
                done();
              }, 500);
            }));
          });
        });
      });

      it('handles splice removing non-consecutive when scrolled to end', done => {
        create.then(() => {
          validateScroll(virtualRepeat, viewModel, () => {
            for (let i = 0, ii = 100; i < ii; i++) {
              viewModel.items.splice(i + 1, 9);
            }
            nq(() => validateScrolledState(virtualRepeat, viewModel, itemHeight));
            nq(() => validateScroll(virtualRepeat, viewModel, () => {
              let views = virtualRepeat.viewSlot.children;
              setTimeout(() => {
                expect(views[views.length - 1].bindingContext.item).toBe(viewModel.items[viewModel.items.length - 1]);
                done();
              }, 500);
            }));
          });
        });
      });

      it('handles splice non-consecutive when scrolled to end', done => {
        create.then(() => {
          validateScroll(virtualRepeat, viewModel, () => {
            for (let i = 0, ii = 80; i < ii; i++) {
              viewModel.items.splice(10 * i, 3, i);
            }
            nq(() => validateScrolledState(virtualRepeat, viewModel, itemHeight));
            nq(() => validateScroll(virtualRepeat, viewModel, () => {
              let views = virtualRepeat.viewSlot.children;
              setTimeout(() => {
                expect(views[views.length - 1].bindingContext.item).toBe(viewModel.items[viewModel.items.length - 1]);
                done();
              }, 500);
            }));
          });
        });
      });

      it('handles splice removing many', done => {
        create.then(() => {
          // more items remaining than viewslot capacity
          viewModel.items.splice(5, 1000 - virtualRepeat._viewsLength - 10);
          nq(() => validateScrolledState(virtualRepeat, viewModel, itemHeight));
          nq(() => done());
        });
      });

      it('handles splice removing more', done => {
        // number of items remaining exactly as viewslot capacity
        create.then(() => {
          viewModel.items.splice(5, 1000 - virtualRepeat._viewsLength);
          nq(() => expect(virtualRepeat.viewSlot.children.length).toBe(viewModel.items.length));
          nq(() => validateScrolledState(virtualRepeat, viewModel, itemHeight));
          nq(() => done());
        });
      });

      it('handles splice removing even more', done => {
        // less items remaining than viewslot capacity
        create.then(() => {
          viewModel.items.splice(5, 1000 - virtualRepeat._viewsLength + 10);
          nq(() => expect(virtualRepeat.viewSlot.children.length).toBe(viewModel.items.length));
          nq(() => validateScrolledState(virtualRepeat, viewModel, itemHeight));
          nq(() => done());
        });
      });

      it('handles splice removing non-consecutive', done => {
        create.then(() => {
          for (let i = 0, ii = 100; i < ii; i++) {
            viewModel.items.splice(i + 1, 9);
          }
          nq(() => validateScrolledState(virtualRepeat, viewModel, itemHeight));
          nq(() => done());
        });
      });

      it('handles splice non-consecutive', done => {
        create.then(() => {
          for (let i = 0, ii = 100; i < ii; i++) {
            viewModel.items.splice(3 * (i + 1), 3, i);
          }
          nq(() => validateScrolledState(virtualRepeat, viewModel, itemHeight));
          nq(() => done());
        });
      });

      it('handles splice removing many + add', done => {
        create.then(() => {
          viewModel.items.splice(5, 990, 'a', 'b', 'c');
          nq(() => validateScrolledState(virtualRepeat, viewModel, itemHeight));
          nq(() => done());
        });
      });

      it('handles splice remove remaining + add', done => {
        create.then(() => {
          viewModel.items.splice(5, 995, 'a', 'b', 'c');
          nq(() => validateScrolledState(virtualRepeat, viewModel, itemHeight));
          nq(() => done());
        });
      });
    });
  });
});
