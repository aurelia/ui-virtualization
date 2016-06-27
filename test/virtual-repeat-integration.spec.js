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

        create = component.create().then(() => {
          virtualRepeat = component.sut;
          viewModel = component.viewModel;
          spyOn(virtualRepeat, '_onScroll').and.callThrough();
        });
      });

      afterEach(() => {
        component.cleanUp();
      });

      it('handles scrolling', done => {
          create.then(() => {
              validateScroll(() => {
                  expect(virtualRepeat._onScroll).toHaveBeenCalled();
                  done();
              })
          });
      })
      it('handles getting next data set', done => {
          create.then(() => {
              validateScroll(() => {
                  expect(vm.getNextPage).toHaveBeenCalled();
                  done();
              })
          });
      })
  })
});
