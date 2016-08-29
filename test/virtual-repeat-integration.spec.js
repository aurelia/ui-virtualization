import {StageComponent} from './component-tester';
import {TableStrategy} from '../src/template-strategy';

// async queue
function createAssertionQueue() {
  let queue = [];

  let next;
  next = () => {
    if (queue.length) {
      let func = queue.pop();
      setTimeout(() => {
        func();
        next();
      })
    }
  };

  return func => {
    queue.push(func);
    if (queue.length === 1) {
      next();
    }
  };
}
let nq = createAssertionQueue();

describe('VirtualRepeat Integration', () => {
  let itemHeight = 100;

  function validateState(virtualRepeat, viewModel) {
    let views = virtualRepeat.viewSlot.children;
    let expectedHeight = viewModel.items.length * itemHeight;
    let topBufferHeight = virtualRepeat.topBuffer.getBoundingClientRect().height;
    let bottomBufferHeight = virtualRepeat.bottomBuffer.getBoundingClientRect().height;
    let renderedItemsHeight = views.length * itemHeight;
    expect(topBufferHeight + renderedItemsHeight + bottomBufferHeight).toBe(expectedHeight);

    if(viewModel.items.length > views.length) {
      expect(topBufferHeight + bottomBufferHeight).toBeGreaterThan(0);
    }

    // validate contextual data
    for (let i = 0; i < views.length; i++) {
      expect(views[i].bindingContext.item).toBe(viewModel.items[i]);
      let overrideContext = views[i].overrideContext;
      expect(overrideContext.parentOverrideContext.bindingContext).toBe(viewModel);
      expect(overrideContext.bindingContext).toBe(views[i].bindingContext);
      let first = i === 0;
      let last = i === viewModel.items.length - 1;
      let even = i % 2 === 0;
      expect(overrideContext.$index).toBe(i);
      expect(overrideContext.$first).toBe(first);
      expect(overrideContext.$last).toBe(last);
      expect(overrideContext.$middle).toBe(!first && !last);
      expect(overrideContext.$odd).toBe(!even);
      expect(overrideContext.$even).toBe(even);
    }
  }

  function validateScrolledState(virtualRepeat, viewModel) {
    let views = virtualRepeat.viewSlot.children;
    let expectedHeight = viewModel.items.length * itemHeight;
    let topBufferHeight = virtualRepeat.topBuffer.getBoundingClientRect().height;
    let bottomBufferHeight = virtualRepeat.bottomBuffer.getBoundingClientRect().height;
    let renderedItemsHeight = views.length * itemHeight;
    expect(topBufferHeight + renderedItemsHeight + bottomBufferHeight).toBe(expectedHeight);

    if(viewModel.items.length > views.length) {
      expect(topBufferHeight + bottomBufferHeight).toBeGreaterThan(0);
    }

    // validate contextual data
    let startingLoc = viewModel.items.indexOf(views[0].bindingContext.item);
    for (let i = startingLoc; i < views.length; i++) {
      expect(views[i].bindingContext.item).toBe(viewModel.items[i]);
      let overrideContext = views[i].overrideContext;
      expect(overrideContext.parentOverrideContext.bindingContext).toBe(viewModel);
      expect(overrideContext.bindingContext).toBe(views[i].bindingContext);
      let first = i === 0;
      let last = i === viewModel.items.length - 1;
      let even = i % 2 === 0;
      expect(overrideContext.$index).toBe(i);
      expect(overrideContext.$first).toBe(first);
      expect(overrideContext.$last).toBe(last);
      expect(overrideContext.$middle).toBe(!first && !last);
      expect(overrideContext.$odd).toBe(!even);
      expect(overrideContext.$even).toBe(even);
    }
  }

  function validateScroll(virtualRepeat, viewModel, done, element) {
      let elem = document.getElementById(element || 'scrollContainer');
      let event = new Event('scroll');
      elem.scrollTop = elem.scrollHeight;
      elem.dispatchEvent(event);
      window.setTimeout(()=>{
          window.requestAnimationFrame(() => {
              validateScrolledState(virtualRepeat, viewModel);
              done();
          });
      });
  }

  function validateScrollUp(virtualRepeat, viewModel, done, element) {
      let elem = document.getElementById(element || 'scrollContainer');
      let event = new Event('scroll');
      elem.scrollTop = elem.scrollHeight/2; //Scroll down but not far enough to reach bottom and call 'getNext'
      elem.dispatchEvent(event);
      window.setTimeout(()=>{
          window.requestAnimationFrame(() => {
            let eventUp = new Event('scroll');
            elem.scrollTop = 0;
            elem.dispatchEvent(eventUp);
            window.setTimeout(()=>{
                window.requestAnimationFrame(() => {
                  validateScrolledState(virtualRepeat, viewModel);
                  done();
                });
            });
          });
      });
  }

  function validatePush(virtualRepeat, viewModel, done) {
    viewModel.items.push('Foo');
    nq(() => validateState(virtualRepeat, viewModel));

    for(let i = 0; i < 5; ++i) {
      viewModel.items.push(`Foo ${i}`);
    }

    nq(() => validateState(virtualRepeat, viewModel));
    nq(() => done());
  }

  function validatePop(virtualRepeat, viewModel, done) {
    viewModel.items.pop();
      nq(() => validateState(virtualRepeat, viewModel));
      nq(() => viewModel.items.pop());
      nq(() => validateState(virtualRepeat, viewModel));
      nq(() => viewModel.items.pop());
      nq(() => validateState(virtualRepeat, viewModel));
      nq(() => done());
  }

  function validateUnshift(virtualRepeat, viewModel, done) {
    viewModel.items.unshift('z');
      nq(() => validateState(virtualRepeat, viewModel));
      nq(() => viewModel.items.unshift('y', 'x'));
      nq(() => validateState(virtualRepeat, viewModel));
      nq(() => viewModel.items.unshift());
      nq(() => validateState(virtualRepeat, viewModel));
      nq(() => done());
  }

  function validateShift(virtualRepeat, viewModel, done) {
    viewModel.items.shift();
      nq(() => validateState(virtualRepeat, viewModel));
      nq(() => viewModel.items.shift());
      nq(() => validateState(virtualRepeat, viewModel));
      nq(() => viewModel.items.shift());
      nq(() => validateState(virtualRepeat, viewModel));
      nq(() => done());
  }

  function validateReverse(virtualRepeat, viewModel, done) {
    viewModel.items.reverse();
      nq(() => validateState(virtualRepeat, viewModel));
      nq(() => done());
  }

  function validateSplice(virtualRepeat, viewModel, done) {
    viewModel.items.splice(2, 1, 'x', 'y');
      nq(() => validateState(virtualRepeat, viewModel));
      nq(() => done());
  }

  describe('iterating div', () => {
    let component;
    let virtualRepeat;
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
      for(let i = 0; i < 1000; ++i) {
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
    });

    afterEach(() => {
      component.cleanUp();
      hiddenComponent.cleanUp();
      containerComponent.cleanUp();
    });

    describe('handles delete', () => {
      it('can delete one at start', done => {
        create.then(() => {
          viewModel.items.splice(0, 1);
          nq(() => validateState(virtualRepeat, viewModel));
          nq(() => done());
        });
      });

      it('can delete one at end', done => {
        create.then(() => {
          viewModel.items.splice(viewModel.items.length - 1, 1);
          nq(() => validateState(virtualRepeat, viewModel));
          nq(() => done());
        });
      });

      it('can delete two at start', done => {
        create.then(() => {
          viewModel.items.splice(0, 1);
          viewModel.items.splice(0, 1);
          nq(() => validateState(virtualRepeat, viewModel));
          nq(() => done());
        });
      });

      it('can delete two at end', done => {
        create.then(() => {
          viewModel.items.splice(viewModel.items.length - 1, 1);
          viewModel.items.splice(viewModel.items.length - 1, 1);
          nq(() => validateState(virtualRepeat, viewModel));
          nq(() => done());
        });
      });

      it('can delete as many as in the DOM', done => {
        create.then(() => {
          let deleteCount = virtualRepeat.viewCount();
          for(let i = 0; i < deleteCount; ++i) {
            viewModel.items.splice(0, 1);
          }
          nq(() => validateState(virtualRepeat, viewModel));
          nq(() => done());
        });
      });

      it('can delete more element than what is in the DOM', done => {
        create.then(() => {
          let deleteCount = virtualRepeat.viewCount() * 2;
          for(let i = 0; i < deleteCount; ++i) {
            viewModel.items.splice(0, 1);
          }
          nq(() => validateState(virtualRepeat, viewModel));
          nq(() => done());
        });
      });

      it('can delete all', done => {
        create.then(() => {
          let deleteCount = viewModel.items.length;
          for(let i = 0; i < deleteCount; ++i) {
            viewModel.items.splice(0, 1);
          }
          nq(() => validateState(virtualRepeat, viewModel));
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
        hiddenVirtualRepeat.scrollContainer.style.display = "block";
        window.requestAnimationFrame(()=>{
          window.setTimeout(()=>{
            validateState(hiddenVirtualRepeat, hiddenViewModel);
            done();
          }, 750)
        });
      });
    });

    it('handles scrolling to bottom', done => {
        containerCreate.then(() => {
            validateScroll(containerVirtualRepeat, containerViewModel, () => {
                expect(containerVirtualRepeat._onScroll).toHaveBeenCalled();
                done();
            }, 'scrollContainer2')
        });
    });
  });

  describe('iterating table', () => {
    let component;
    let virtualRepeat;
    let viewModel;
    let create;
    let items;

    beforeEach(() => {

      items = [];
      for(let i = 0; i < 1000; ++i) {
        items.push('item' + i);
      }
      component = StageComponent
        .withResources(['src/virtual-repeat', 'test/noop-value-converter'])
        .inView(`<table><tr style="height: ${itemHeight}px;" virtual-repeat.for="item of items"><td>\${item}</td></tr></table>`)
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
  });

  describe('value converters', () => {
    let component;
    let virtualRepeat;
    let viewModel;
    let create;
    let items;

    beforeEach(() => {
      items = [];
      for(let i = 0; i < 1000; ++i) {
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
        nq(() => validateState(virtualRepeat, viewModel));
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

  describe('infinite scroll', () =>{
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
          getNextPage: function(){
            let itemLength = this.items.length;
            for(let i = 0; i < 100; ++i) {
                let itemNum = itemLength + i;
                this.items.push('item' + itemNum);
            }
          }
      };
      nestedVm = {
        items: items,
        bar: [1],
        getNextPage: function(topIndex, isAtBottom, isAtTop){
          let itemLength = this.items.length;
          for(let i = 0; i < 100; ++i) {
              let itemNum = itemLength + i;
              this.items.push('item' + itemNum);
          }
        }
      };
      promisedVm = {
          items: items,
          test: '2',
          getNextPage: function(){
            return new Promise((resolve, reject) => {
              let itemLength = this.items.length;
              for(let i = 0; i < 100; ++i) {
                  let itemNum = itemLength + i;
                  this.items.push('item' + itemNum);
              }
              resolve(true);
            });
          }
      };
      for(let i = 0; i < 1000; ++i) {
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
                      <div style="height: ${itemHeight}px;" virtual-repeat.for="item of items" infinite-scroll-next.call="$parent.getNextPage($scrollContext)">\${item}</div>
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
            })
        });
    });
    it('handles getting next data set', done => {
        create.then(() => {
            validateScroll(virtualRepeat, viewModel, () => {
                expect(vm.getNextPage).toHaveBeenCalled();
                done();
            })
        });
    });
    it('handles getting next data set from nested function', done => {
        nestedCreate.then(() => {
            validateScroll(nestedVirtualRepeat, nestedViewModel, () => {
                expect(nestedVm.getNextPage).toHaveBeenCalled();
                done();
            }, 'scrollContainerNested')
        });
    });
    it('handles getting next data set scrolling up', done => {
      create.then(() => {
          validateScrollUp(virtualRepeat, viewModel, () => {
            var args = vm.getNextPage.calls.argsFor(0);
            expect(args[0]).toEqual(0);
            expect(args[1]).toBe(false);
            expect(args[2]).toBe(true);
            done();
          });
      });
    });
    it('handles getting next data set with promises', done => {
        promisedCreate.then(() => {
            validateScroll(promisedVirtualRepeat, promisedViewModel, () => {
              //Jasmine spies seem to not be working with returned promises and getting the instance of them, causing regular checks on getNextPage to fail
              expect(promisedVm.items.length).toBe(1100);
              done();
            }, 'scrollContainerPromise')
        });
    });
    it('handles getting next data set with small page size', done => {
      vm.items = [];
      for(let i = 0; i < 5; ++i) {
        vm.items.push('item' + i);
      }
      create.then(() => {
        validateScroll(virtualRepeat, viewModel, () => {
          expect(vm.getNextPage).toHaveBeenCalled();
          done();
        })
      });
    });
    it('passes the current index and location state', done => {
      create.then(() => {
          validateScroll(virtualRepeat, viewModel, () => {
            //Taking into account 1 index difference due to default styles on browsers causing small margins of error
            var args = vm.getNextPage.calls.argsFor(0);
            expect(args[0]).toBeGreaterThan(988);
            expect(args[0]).toBeLessThan(991);
            expect(args[1]).toBe(true);
            expect(args[2]).toBe(false);
            done();
          })
      });
    });
    it('passes context information when using call', done => {
        nestedCreate.then(() => {
            validateScroll(nestedVirtualRepeat, nestedViewModel, () => {
              //Taking into account 1 index difference due to default styles on browsers causing small margins of error
              expect(nestedVm.getNextPage).toHaveBeenCalled();
              var scrollContext = nestedVm.getNextPage.calls.argsFor(0)[0];
              expect(scrollContext.topIndex).toBeGreaterThan(988);
              expect(scrollContext.topIndex).toBeLessThan(991);
              expect(scrollContext.isAtBottom).toBe(true);
              expect(scrollContext.isAtTop).toBe(false);
              done();
            }, 'scrollContainerNested')
        });
    });
  })
});
