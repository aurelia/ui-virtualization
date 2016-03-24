import {ArrayRepeatStrategy} from 'aurelia-templating-resources/array-repeat-strategy';
import {createFullOverrideContext, updateOneTimeBinding} from 'aurelia-templating-resources/repeat-utilities';
import {updateVirtualOverrideContexts, rebindAndMoveView} from './utilities';

/**
* A strategy for repeating a template over an array.
*/
export class ArrayVirtualRepeatStrategy extends ArrayRepeatStrategy {
  // create first item to calculate the heights
  createFirstItem(repeat) {
    let overrideContext = createFullOverrideContext(repeat, repeat.items[0], 0, 1);
    let view = repeat.viewFactory.create();
    view.bind(overrideContext.bindingContext, overrideContext);
    repeat.viewSlot.add(view);
  }
  /**
  * Handle the repeat's collection instance changing.
  * @param repeat The repeater instance.
  * @param items The new array instance.
  */
  instanceChanged(repeat, items) {
    this._inPlaceProcessItems(repeat, items);
  }

  _standardProcessInstanceChanged(repeat, items) {
    for (let i = 1, ii = repeat._viewsLength; i < ii; ++i) {
      let overrideContext = createFullOverrideContext(repeat, items[i], i, ii);
      let view = repeat.viewFactory.create();
      view.bind(overrideContext.bindingContext, overrideContext);
      repeat.viewSlot.add(view);
    }
  }

  _inPlaceProcessItems(repeat, items) {
    let itemsLength = items.length;
    let viewsLength = repeat.viewSlot.children.length;
    let first = repeat._getIndexOfFirstView();
    // remove unneeded views.
    while (viewsLength > repeat._viewsLength) {
      viewsLength--;
      repeat.viewSlot.removeAt(viewsLength, true);
    }
    // avoid repeated evaluating the property-getter for the "local" property.
    let local = repeat.local;
    // re-evaluate bindings on existing views.
    for (let i = 0; i < viewsLength; i++) {
      let view = repeat.viewSlot.children[i];
      let last = i === itemsLength - 1;
      let middle = i !== 0 && !last;
      // any changes to the binding context?
      if (view.bindingContext[local] === items[i + first] && view.overrideContext.$middle === middle && view.overrideContext.$last === last) {
        // no changes. continue...
        continue;
      }
      // update the binding context and refresh the bindings.
      view.bindingContext[local] = items[i + first];
      view.overrideContext.$middle = middle;
      view.overrideContext.$last = last;
      let j = view.bindings.length;
      while (j--) {
        updateOneTimeBinding(view.bindings[j]);
      }
      j = view.controllers.length;
      while (j--) {
        let k = view.controllers[j].boundProperties.length;
        while (k--) {
          let binding = view.controllers[j].boundProperties[k].binding;
          updateOneTimeBinding(binding);
        }
      }
    }
    // add new views
    let minLength = Math.min(repeat._viewsLength, items.length);
    for (let i = viewsLength; i < minLength; i++) {
      let overrideContext = createFullOverrideContext(repeat, items[i], i, itemsLength);
      let view = repeat.viewFactory.create();
      view.bind(overrideContext.bindingContext, overrideContext);
      repeat.viewSlot.add(view);
    }
  }

  /**
  * Handle the repeat's collection instance mutating.
  * @param repeat The repeat instance.
  * @param array The modified array.
  * @param splices Records of array changes.
  */
  instanceMutated(repeat, array, splices) {
    this._standardProcessInstanceMutated(repeat, array, splices);
  }

  _standardProcessInstanceMutated(repeat, array, splices) {
    if (repeat.__queuedSplices) {
      for (let i = 0, ii = splices.length; i < ii; ++i) {
        let {index, removed, addedCount} = splices[i];
        mergeSplice(repeat.__queuedSplices, index, removed, addedCount);
      }
      repeat.__array = array.slice(0);
      return;
    }

    let maybePromise = this._runSplices(repeat, array.slice(0), splices);
    if (maybePromise instanceof Promise) {
      let queuedSplices = repeat.__queuedSplices = [];

      let runQueuedSplices = () => {
        if (! queuedSplices.length) {
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
      for (let j = 0, jj = removed.length; j < jj; ++j) {
        let viewOrPromise = this._removeViewAt(repeat, splice.index + removeDelta + rmPromises.length, true);
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

  _removeViewAt(repeat, collectionIndex, returnToCache) {
    let viewOrPromise;
    let view;
    let viewSlot = repeat.viewSlot;
    let viewAddIndex;
    // index in view slot?
    if (!this._isIndexBeforeViewSlot(repeat, viewSlot, collectionIndex) && !this._isIndexAfterViewSlot(repeat, viewSlot, collectionIndex)) {
      let viewIndex = this._getViewIndex(repeat, viewSlot, collectionIndex);
      viewOrPromise = viewSlot.removeAt(viewIndex, returnToCache);
      if (repeat.items.length > viewSlot.children.length) {
        // TODO: do not trigger view lifecycle here
        let collectionAddIndex;
        if (repeat._bottomBufferHeight > repeat.itemHeight) {
          viewAddIndex = viewSlot.children.length;
          collectionAddIndex = repeat._getIndexOfLastView() + 1;
          repeat._bottomBufferHeight = repeat._bottomBufferHeight - (repeat.itemHeight);
        } else if (repeat._topBufferHeight > 0) {
          viewAddIndex = 0;
          collectionAddIndex = repeat._getIndexOfFirstView() - 1;
          repeat._topBufferHeight = repeat._topBufferHeight - (repeat.itemHeight);
        }
        let data = repeat.items[collectionAddIndex];
        if (data) {
          let overrideContext = createFullOverrideContext(repeat, repeat.items[collectionAddIndex], collectionAddIndex, repeat.items.length);
          view = repeat.viewFactory.create();
          view.bind(overrideContext.bindingContext, overrideContext);
        }
      } else {
        return viewOrPromise;
      }
    } else if (this._isIndexBeforeViewSlot(repeat, viewSlot, collectionIndex)) {
      if (repeat._bottomBufferHeight > 0) {
        repeat._bottomBufferHeight = repeat._bottomBufferHeight - (repeat.itemHeight);
        rebindAndMoveView(repeat, viewSlot.children[0], viewSlot.children[0].overrideContext.$index, true);
      } else {
        repeat._topBufferHeight = repeat._topBufferHeight - (repeat.itemHeight);
      }
    } else if (this._isIndexAfterViewSlot(repeat, viewSlot, collectionIndex)) {
      repeat._bottomBufferHeight = repeat._bottomBufferHeight - (repeat.itemHeight);
    }

    if (viewOrPromise instanceof Promise) {
      viewOrPromise.then(() => {
        repeat.viewSlot.insert(viewAddIndex, view);
        repeat._adjustBufferHeights();
      });
      return undefined;
    } else if (view) {
      repeat.viewSlot.insert(viewAddIndex, view);
    }

    repeat._adjustBufferHeights();
  }

  _isIndexBeforeViewSlot(repeat: VirtualRepeat, viewSlot: ViewSlot, index: number): number {
    let viewIndex = this._getViewIndex(repeat, viewSlot, index);
    return viewIndex < 0;
  }

  _isIndexAfterViewSlot(repeat: VirtualRepeat, viewSlot: ViewSlot, index: number): number {
    let viewIndex = this._getViewIndex(repeat, viewSlot, index);
    return viewIndex > repeat._viewsLength - 1;
  }

  _getViewIndex(repeat: VirtualRepeat, viewSlot: ViewSlot, index: number): number {
    if (viewSlot.children.length === 0) {
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
        if (viewSlot.children.length === 0 || !this._isIndexBeforeViewSlot(repeat, viewSlot, addIndex) && !this._isIndexAfterViewSlot(repeat, viewSlot, addIndex)) {
          let overrideContext = createFullOverrideContext(repeat, array[addIndex], addIndex, arrayLength);
          let view = repeat.viewFactory.create();
          view.bind(overrideContext.bindingContext, overrideContext);
          repeat.viewSlot.insert(addIndex, view);
          if (!repeat._hasCalculatedSizes) {
            repeat._calcInitialHeights(1);
          } else if (repeat.viewSlot.children.length > repeat._viewsLength) {
            repeat.viewSlot.removeAt(repeat.viewSlot.children.length - 1, true, true);
            repeat._bottomBufferHeight = repeat._bottomBufferHeight + repeat.itemHeight;
          }
        } else if (this._isIndexBeforeViewSlot(repeat, viewSlot, addIndex)) {
          repeat._topBufferHeight = repeat._topBufferHeight + repeat.itemHeight;
        } else if (this._isIndexAfterViewSlot(repeat, viewSlot, addIndex)) {
          repeat._bottomBufferHeight = repeat._bottomBufferHeight + repeat.itemHeight;
          repeat.isLastIndex = false;
          if (repeat._lastRebind > repeat.elementsInView) {
            repeat._lastRebind--;
          }
        }
      }
    }
    repeat._adjustBufferHeights();
  }
}
