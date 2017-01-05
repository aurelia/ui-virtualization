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
  let component;
  let virtualRepeat;
  let viewModel;
  let itemHeight = 100;
  let create;
  let items;

  function validateState() {
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

  function validateScrolledState() {
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
    let i = 0;
    let ii = Math.min(viewModel.items.length - startingLoc, views.length);
    for (; i < ii; i++) {
      let itemIndex = startingLoc + i;
      expect(views[i].bindingContext.item).toBe(viewModel.items[itemIndex]);
      let overrideContext = views[i].overrideContext;
      expect(overrideContext.parentOverrideContext.bindingContext).toBe(viewModel);
      expect(overrideContext.bindingContext).toBe(views[i].bindingContext);
      let first = itemIndex === 0;
      let last = itemIndex === viewModel.items.length - 1;
      let even = itemIndex % 2 === 0;
      expect(overrideContext.$index).toBe(itemIndex);
      expect(overrideContext.$first).toBe(first);
      expect(overrideContext.$last).toBe(last);
      expect(overrideContext.$middle).toBe(!first && !last);
      expect(overrideContext.$odd).toBe(!even);
      expect(overrideContext.$even).toBe(even);
    }
  }

  function validateScroll(done) {
      let elem = document.getElementById('scrollContainer');
      let event = new Event('scroll');
      elem.scrollTop = elem.scrollHeight;
      elem.dispatchEvent(event);
      window.setTimeout(()=>{
          window.requestAnimationFrame(() => {
              validateScrolledState();
              done();
          });
      });
  }

  function validateScrollUp(done) {
      let elem = document.getElementById('scrollContainer');
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
                  validateScrolledState();
                  done();
                });
            });
          });
      });
  }

  function validatePush(done) {
    viewModel.items.push('Foo');
    nq(() => validateState());

    for(let i = 0; i < 5; ++i) {
      viewModel.items.push(`Foo ${i}`);
    }

    nq(() => validateState());
    nq(() => done());
  }

  function validatePop(done) {
    viewModel.items.pop();
      nq(() => validateState());
      nq(() => viewModel.items.pop());
      nq(() => validateState());
      nq(() => viewModel.items.pop());
      nq(() => validateState());
      nq(() => done());
  }

  function validateUnshift(done) {
    viewModel.items.unshift('z');
      nq(() => validateState());
      nq(() => viewModel.items.unshift('y', 'x'));
      nq(() => validateState());
      nq(() => viewModel.items.unshift());
      nq(() => validateState());
      nq(() => done());
  }

  function validateShift(done) {
    viewModel.items.shift();
      nq(() => validateState());
      nq(() => viewModel.items.shift());
      nq(() => validateState());
      nq(() => viewModel.items.shift());
      nq(() => validateState());
      nq(() => done());
  }

  function validateReverse(done) {
    viewModel.items.reverse();
      nq(() => validateState());
      nq(() => done());
  }

  function validateSplice(done) {
    viewModel.items.splice(2, 1, 'x', 'y');
      nq(() => validateState());
      nq(() => done());
  }

  describe('iterating div', () => {
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
    });

    describe('handles delete', () => {
      it('can delete one at start', done => {
        create.then(() => {
          viewModel.items.splice(0, 1);
          nq(() => validateState());
          nq(() => done());
        });
      });

      it('can delete one at end', done => {
        create.then(() => {
          viewModel.items.splice(viewModel.items.length - 1, 1);
          nq(() => validateState());
          nq(() => done());
        });
      });

      it('can delete two at start', done => {
        create.then(() => {
          viewModel.items.splice(0, 1);
          viewModel.items.splice(0, 1);
          nq(() => validateState());
          nq(() => done());
        });
      });

      it('can delete two at end', done => {
        create.then(() => {
          viewModel.items.splice(viewModel.items.length - 1, 1);
          viewModel.items.splice(viewModel.items.length - 1, 1);
          nq(() => validateState());
          nq(() => done());
        });
      });

      it('can delete as many as in the DOM', done => {
        create.then(() => {
          let deleteCount = virtualRepeat.viewCount();
          for(let i = 0; i < deleteCount; ++i) {
            viewModel.items.splice(0, 1);
          }
          nq(() => validateState());
          nq(() => done());
        });
      });

      it('can delete more element than what is in the DOM', done => {
        create.then(() => {
          let deleteCount = virtualRepeat.viewCount() * 2;
          for(let i = 0; i < deleteCount; ++i) {
            viewModel.items.splice(0, 1);
          }
          nq(() => validateState());
          nq(() => done());
        });
      });

      it('can delete all', done => {
        create.then(() => {
          let deleteCount = viewModel.items.length;
          for(let i = 0; i < deleteCount; ++i) {
            viewModel.items.splice(0, 1);
          }
          nq(() => validateState());
          nq(() => done());
        });
      });

    });

    afterEach(() => {
      component.cleanUp();
    });

    it('handles push', done => {
      create.then(() => validatePush(done));
    });

    it('handles pop', done => {
      create.then(() => validatePop(done));
    });

    it('handles unshift', done => {
      create.then(() => validateUnshift(done));
    });

    it('handles shift', done => {
      create.then(() => validateShift(done));
    });

    it('handles reverse', done => {
      create.then(() => validateReverse(done));
    });

    it('handles splice', done => {
      create.then(() => validateSplice(done));
    });
  });

  describe('iterating table', () => {
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
      create.then(() => validatePush(done));
    });
  });

  describe('value converters', () => {
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
      create.then(() => validatePush(done));
    });

    it('handles pop', done => {
      create.then(() => validatePop(done));
    });

    it('handles unshift', done => {
      create.then(() => {
        viewModel.items.unshift('z');
        nq(() => validateState());
        nq(() => done());
      });
    });

    it('handles shift', done => {
      create.then(() => validateShift(done));
    });

    it('handles reverse', done => {
      create.then(() => validateReverse(done));
    });

    it('handles splice', done => {
      create.then(() => validateSplice(done));
    });
  });

  describe('infinite scroll', () =>{
      let vm;
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
        promisedVm = {
            items: items,
            getNextPage: function(){
              console.log('here');
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

        component = StageComponent
          .withResources(['src/virtual-repeat', 'src/virtual-repeat-next'])
          .inView(`<div id="scrollContainer" style="height: 500px; overflow-y: scroll">
                        <div style="height: ${itemHeight}px;" virtual-repeat.for="item of items" virtual-repeat-next="getNextPage">\${item}</div>
                    </div>`)
          .boundTo(vm);
        promisedComponent = StageComponent
          .withResources(['src/virtual-repeat', 'src/virtual-repeat-next'])
          .inView(`<div id="scrollContainer" style="height: 500px; overflow-y: scroll">
                        <div style="height: ${itemHeight}px;" virtual-repeat.for="item of items" virtual-repeat-next="getNextPage">\${item}</div>
                    </div>`)
          .boundTo(promisedVm);

        create = component.create().then(() => {
          virtualRepeat = component.sut;
          viewModel = component.viewModel;
          spyOn(virtualRepeat, '_onScroll').and.callThrough();
        });
        promisedCreate = promisedComponent.create().then(() => {
          promisedVirtualRepeat = promisedComponent.sut;
          promisedViewModel = promisedComponent.viewModel;
        });
      });

      afterEach(() => {
        component.cleanUp();
        promisedComponent.cleanUp();
      });

      it('handles scrolling', done => {
          create.then(() => {
              validateScroll(() => {
                  expect(virtualRepeat._onScroll).toHaveBeenCalled();
                  done();
              })
          });
      });
      it('handles getting next data set', done => {
          create.then(() => {
              validateScroll(() => {
                  expect(vm.getNextPage).toHaveBeenCalled();
                  done();
              })
          });
      });
      it('handles getting next data set scrolling up', done => {
        create.then(() => {
            validateScrollUp(() => {
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
              validateScroll(() => {
                //Jasmine spies seem to not be working with returned promises and getting the instance of them, causing regular checks on getNextPage to fail
                expect(promisedVm.items.length).toBe(1100);
                done();
              })
          });
      });
      it('passes the current index and location state', done => {
        create.then(() => {
            validateScroll(() => {
              //Taking into account 1 index difference due to default styles on browsers causing small margins of error
              var args = vm.getNextPage.calls.argsFor(0);
              expect(args[0]).toBeGreaterThan(988);
              expect(args[0]).toBeLessThan(991);
              expect(args[1]).toBe(true);
              expect(args[2]).toBe(false);
              done();
            })
        });
      })
  })

  describe('scrolling div', () => {
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
        validateScroll(() => {
          viewModel.items.splice(995, 1, 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j');
          nq(() => validateScrolledState());
          nq(() => validateScroll(() => {
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
        viewModel.items.splice(5, 990);
        nq(() => validateScrolledState());
        nq(() => done());
      });
    });

    it('handles splice removing many + add', done => {
      create.then(() => {
        viewModel.items.splice(5, 990, 'a', 'b', 'c');
        nq(() => validateScrolledState());
        nq(() => done());
      });
    });

    it('handles splice remove remaining + add', done => {
      create.then(() => {
        viewModel.items.splice(5, 995, 'a', 'b', 'c');
        nq(() => validateScrolledState());
        nq(() => done());
      });
    });
  });
});
