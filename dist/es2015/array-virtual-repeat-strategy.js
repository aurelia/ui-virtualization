import { ArrayRepeatStrategy, createFullOverrideContext } from 'aurelia-templating-resources';
import { updateVirtualOverrideContexts, rebindAndMoveView, getElementDistanceToBottomViewPort } from './utilities';

export let ArrayVirtualRepeatStrategy = class ArrayVirtualRepeatStrategy extends ArrayRepeatStrategy {
  createFirstItem(repeat) {
    let overrideContext = createFullOverrideContext(repeat, repeat.items[0], 0, 1);
    repeat.addView(overrideContext.bindingContext, overrideContext);
  }

  instanceChanged(repeat, items) {
    this._inPlaceProcessItems(repeat, items);
  }

  _standardProcessInstanceChanged(repeat, items) {
    for (let i = 1, ii = repeat._viewsLength; i < ii; ++i) {
      let overrideContext = createFullOverrideContext(repeat, items[i], i, ii);
      repeat.addView(overrideContext.bindingContext, overrideContext);
    }
  }

  _inPlaceProcessItems(repeat, items) {
    let itemsLength = items.length;
    let viewsLength = repeat.viewCount();
    let first = repeat._getIndexOfFirstView();

    while (viewsLength > itemsLength) {
      viewsLength--;
      repeat.removeView(viewsLength, true);
    }

    let local = repeat.local;

    for (let i = 0; i < viewsLength; i++) {
      let view = repeat.view(i);
      let last = i === itemsLength - 1;
      let middle = i !== 0 && !last;

      if (view.bindingContext[local] === items[i + first] && view.overrideContext.$middle === middle && view.overrideContext.$last === last) {
        continue;
      }

      view.bindingContext[local] = items[i + first];
      view.overrideContext.$middle = middle;
      view.overrideContext.$last = last;
      repeat.updateBindings(view);
    }

    let minLength = Math.min(repeat._viewsLength, items.length);
    for (let i = viewsLength; i < minLength; i++) {
      let overrideContext = createFullOverrideContext(repeat, items[i], i, itemsLength);
      repeat.addView(overrideContext.bindingContext, overrideContext);
    }
  }

  instanceMutated(repeat, array, splices) {
    this._standardProcessInstanceMutated(repeat, array, splices);
  }

  _standardProcessInstanceMutated(repeat, array, splices) {
    if (repeat.__queuedSplices) {
      for (let i = 0, ii = splices.length; i < ii; ++i) {
        let { index, removed, addedCount } = splices[i];
        mergeSplice(repeat.__queuedSplices, index, removed, addedCount);
      }
      repeat.__array = array.slice(0);
      return;
    }

    let maybePromise = this._runSplices(repeat, array.slice(0), splices);
    if (maybePromise instanceof Promise) {
      let queuedSplices = repeat.__queuedSplices = [];

      let runQueuedSplices = () => {
        if (!queuedSplices.length) {
          delete repeat.__queuedSplices;
          delete repeat.__array;
          return;
        }

        let nextPromise = this._runSplices(repeat, repeat.__array, queuedSplices) || Promise.resolve();
        nextPromise.then(runQueuedSplices);
      };

      maybePromise.then(runQueuedSplices);
    }
  }

  _runSplices(repeat, array, splices) {
    let removeDelta = 0;
    let rmPromises = [];

    for (let i = 0, ii = splices.length; i < ii; ++i) {
      let splice = splices[i];
      let removed = splice.removed;
      let removedLength = removed.length;
      for (let j = 0, jj = removedLength; j < jj; ++j) {
        let viewOrPromise = this._removeViewAt(repeat, splice.index + removeDelta + rmPromises.length, true, j, removedLength);
        if (viewOrPromise instanceof Promise) {
          rmPromises.push(viewOrPromise);
        }
      }
      removeDelta -= splice.addedCount;
    }

    if (rmPromises.length > 0) {
      return Promise.all(rmPromises).then(() => {
        this._handleAddedSplices(repeat, array, splices);
        updateVirtualOverrideContexts(repeat, 0);
      });
    }
    this._handleAddedSplices(repeat, array, splices);
    updateVirtualOverrideContexts(repeat, 0);
  }

  _removeViewAt(repeat, collectionIndex, returnToCache, j, removedLength) {
    let viewOrPromise;
    let view;
    let viewSlot = repeat.viewSlot;
    let viewCount = repeat.viewCount();
    let viewAddIndex;
    let removeMoreThanInDom = removedLength > viewCount;
    if (repeat._viewsLength <= j) {
      repeat._bottomBufferHeight = repeat._bottomBufferHeight - repeat.itemHeight;
      repeat._adjustBufferHeights();
      return;
    }

    if (!this._isIndexBeforeViewSlot(repeat, viewSlot, collectionIndex) && !this._isIndexAfterViewSlot(repeat, viewSlot, collectionIndex)) {
      let viewIndex = this._getViewIndex(repeat, viewSlot, collectionIndex);
      viewOrPromise = repeat.removeView(viewIndex, returnToCache);
      if (repeat.items.length > viewCount) {
        let collectionAddIndex;
        if (repeat._bottomBufferHeight > repeat.itemHeight) {
          viewAddIndex = viewCount;
          if (!removeMoreThanInDom) {
            let lastViewItem = repeat._getLastViewItem();
            collectionAddIndex = repeat.items.indexOf(lastViewItem) + 1;
          } else {
            collectionAddIndex = j;
          }
          repeat._bottomBufferHeight = repeat._bottomBufferHeight - repeat.itemHeight;
        } else if (repeat._topBufferHeight > 0) {
          viewAddIndex = 0;
          collectionAddIndex = repeat._getIndexOfFirstView() - 1;
          repeat._topBufferHeight = repeat._topBufferHeight - repeat.itemHeight;
        }
        let data = repeat.items[collectionAddIndex];
        if (data) {
          let overrideContext = createFullOverrideContext(repeat, data, collectionAddIndex, repeat.items.length);
          view = repeat.viewFactory.create();
          view.bind(overrideContext.bindingContext, overrideContext);
        }
      }
    } else if (this._isIndexBeforeViewSlot(repeat, viewSlot, collectionIndex)) {
      if (repeat._bottomBufferHeight > 0) {
        repeat._bottomBufferHeight = repeat._bottomBufferHeight - repeat.itemHeight;
        rebindAndMoveView(repeat, repeat.view(0), repeat.view(0).overrideContext.$index, true);
      } else {
        repeat._topBufferHeight = repeat._topBufferHeight - repeat.itemHeight;
      }
    } else if (this._isIndexAfterViewSlot(repeat, viewSlot, collectionIndex)) {
      repeat._bottomBufferHeight = repeat._bottomBufferHeight - repeat.itemHeight;
    }

    if (viewOrPromise instanceof Promise) {
      viewOrPromise.then(() => {
        repeat.viewSlot.insert(viewAddIndex, view);
        repeat._adjustBufferHeights();
      });
    } else if (view) {
      repeat.viewSlot.insert(viewAddIndex, view);
    }
    repeat._adjustBufferHeights();
  }

  _isIndexBeforeViewSlot(repeat, viewSlot, index) {
    let viewIndex = this._getViewIndex(repeat, viewSlot, index);
    return viewIndex < 0;
  }

  _isIndexAfterViewSlot(repeat, viewSlot, index) {
    let viewIndex = this._getViewIndex(repeat, viewSlot, index);
    return viewIndex > repeat._viewsLength - 1;
  }

  _getViewIndex(repeat, viewSlot, index) {
    if (repeat.viewCount() === 0) {
      return -1;
    }

    let topBufferItems = repeat._topBufferHeight / repeat.itemHeight;
    return index - topBufferItems;
  }

  _handleAddedSplices(repeat, array, splices) {
    let arrayLength = array.length;
    let viewSlot = repeat.viewSlot;
    for (let i = 0, ii = splices.length; i < ii; ++i) {
      let splice = splices[i];
      let addIndex = splice.index;
      let end = splice.index + splice.addedCount;
      for (; addIndex < end; ++addIndex) {
        let hasDistanceToBottomViewPort = getElementDistanceToBottomViewPort(repeat.viewStrategy.getLastElement(repeat.bottomBuffer)) > 0;
        if (repeat.viewCount() === 0 || !this._isIndexBeforeViewSlot(repeat, viewSlot, addIndex) && !this._isIndexAfterViewSlot(repeat, viewSlot, addIndex) || hasDistanceToBottomViewPort) {
          let overrideContext = createFullOverrideContext(repeat, array[addIndex], addIndex, arrayLength);
          repeat.insertView(addIndex, overrideContext.bindingContext, overrideContext);
          if (!repeat._hasCalculatedSizes) {
            repeat._calcInitialHeights(1);
          } else if (repeat.viewCount() > repeat._viewsLength) {
            if (hasDistanceToBottomViewPort) {
              repeat.removeView(0, true, true);
              repeat._topBufferHeight = repeat._topBufferHeight + repeat.itemHeight;
              repeat._adjustBufferHeights();
            } else {
              repeat.removeView(repeat.viewCount() - 1, true, true);
              repeat._bottomBufferHeight = repeat._bottomBufferHeight + repeat.itemHeight;
            }
          }
        } else if (this._isIndexBeforeViewSlot(repeat, viewSlot, addIndex)) {
          repeat._topBufferHeight = repeat._topBufferHeight + repeat.itemHeight;
        } else if (this._isIndexAfterViewSlot(repeat, viewSlot, addIndex)) {
          repeat._bottomBufferHeight = repeat._bottomBufferHeight + repeat.itemHeight;
          repeat.isLastIndex = false;
        }
      }
    }
    repeat._adjustBufferHeights();
  }
};