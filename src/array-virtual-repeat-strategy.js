import {ArrayRepeatStrategy, createFullOverrideContext} from 'aurelia-templating-resources';
import {updateVirtualOverrideContexts, rebindAndMoveView, getElementDistanceToBottomViewPort} from './utilities';

/**
* A strategy for repeating a template over an array.
*/
export class ArrayVirtualRepeatStrategy extends ArrayRepeatStrategy {
  // create first item to calculate the heights
  createFirstItem(repeat: VirtualRepeat): void {
    let overrideContext = createFullOverrideContext(repeat, repeat.items[0], 0, 1);
    repeat.addView(overrideContext.bindingContext, overrideContext);
  }
  /**
  * Handle the repeat's collection instance changing.
  * @param repeat The repeater instance.
  * @param items The new array instance.
  */
  instanceChanged(repeat: VirtualRepeat, items: Array<any>): void {
    this._inPlaceProcessItems(repeat, items);
  }

  _standardProcessInstanceChanged(repeat: VirtualRepeat, items: Array<any>): void {
    for (let i = 1, ii = repeat._viewsLength; i < ii; ++i) {
      let overrideContext = createFullOverrideContext(repeat, items[i], i, ii);
      repeat.addView(overrideContext.bindingContext, overrideContext);
    }
  }

  _inPlaceProcessItems(repeat: VirtualRepeat, items: Array<any>): void {
    let itemsLength = items.length;
    let viewsLength = repeat.viewCount();
    let first = repeat._getIndexOfFirstView();
    // remove unneeded views.
    while (viewsLength > itemsLength) {
      viewsLength--;
      repeat.removeView(viewsLength, true);
    }
    // avoid repeated evaluating the property-getter for the "local" property.
    let local = repeat.local;
    // re-evaluate bindings on existing views.
    for (let i = 0; i < viewsLength; i++) {
      let view = repeat.view(i);
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
      repeat.updateBindings(view);
    }
    // add new views
    let minLength = Math.min(repeat._viewsLength, items.length);
    for (let i = viewsLength; i < minLength; i++) {
      let overrideContext = createFullOverrideContext(repeat, items[i], i, itemsLength);
      repeat.addView(overrideContext.bindingContext, overrideContext);
    }
  }

  /**
  * Handle the repeat's collection instance mutating.
  * @param repeat The repeat instance.
  * @param array The modified array.
  * @param splices Records of array changes.
  */
  instanceMutated(repeat: VirtualRepeat, array: Array<any>, splices: any): void {
    this._standardProcessInstanceMutated(repeat, array, splices);
  }

  _standardProcessInstanceMutated(repeat: VirtualRepeat, array: Array<any>, splices: any): void {
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

  _runSplices(repeat: VirtualRepeat, array: Array<any>, splices: any): any {
    let removeDelta = 0;
    let rmPromises = [];

    // do all splices replace existing entries?
    let allSplicesAreInplace = true;
    for (let i = 0; i < splices.length; i++) {
      let splice = splices[i];
      if (splice.removed.length !== splice.addedCount) {
        allSplicesAreInplace = false;
        break;
      }
    }

    // if so, optimise by just replacing affected visible views
    if (allSplicesAreInplace) {
      for (let i = 0; i < splices.length; i++) {
        let splice = splices[i];
        for (let collectionIndex = splice.index; collectionIndex < splice.index + splice.addedCount; collectionIndex++) {
          if (!this._isIndexBeforeViewSlot(repeat, repeat.viewSlot, collectionIndex) && !this._isIndexAfterViewSlot(repeat, repeat.viewSlot, collectionIndex) ) {
            let viewIndex = this._getViewIndex(repeat, repeat.viewSlot, collectionIndex);
            let overrideContext = createFullOverrideContext(repeat, array[collectionIndex], collectionIndex, array.length);
            repeat.removeView(viewIndex, true, true);
            repeat.insertView(viewIndex, overrideContext.bindingContext, overrideContext);
          }
        }
      }
    } else {
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

    return undefined;
  }

  _removeViewAt(repeat: VirtualRepeat, collectionIndex: number, returnToCache: boolean, j: number, removedLength: number): any {
    let viewOrPromise;
    let view;
    let viewSlot = repeat.viewSlot;
    let viewCount = repeat.viewCount();
    let viewAddIndex;
    let removeMoreThanInDom = removedLength > viewCount;
    if (repeat._viewsLength <= j) {
      repeat._bottomBufferHeight = repeat._bottomBufferHeight - (repeat.itemHeight);
      repeat._adjustBufferHeights();
      return;
    }

    // index in view slot?
    if (!this._isIndexBeforeViewSlot(repeat, viewSlot, collectionIndex) && !this._isIndexAfterViewSlot(repeat, viewSlot, collectionIndex)) {
      let viewIndex = this._getViewIndex(repeat, viewSlot, collectionIndex);
      viewOrPromise = repeat.removeView(viewIndex, returnToCache);
      if (repeat.items.length > viewCount) {
        // TODO: do not trigger view lifecycle here
        let collectionAddIndex;
        if (repeat._bottomBufferHeight > repeat.itemHeight) {
          viewAddIndex = viewCount;
          if (!removeMoreThanInDom) {
            let lastViewItem = repeat._getLastViewItem();
            collectionAddIndex = repeat.items.indexOf(lastViewItem) + 1;
          } else {
            collectionAddIndex = j;
          }
          repeat._bottomBufferHeight = repeat._bottomBufferHeight - (repeat.itemHeight);
        } else if (repeat._topBufferHeight > 0) {
          viewAddIndex = 0;
          collectionAddIndex = repeat._getIndexOfFirstView() - 1;
          repeat._topBufferHeight = repeat._topBufferHeight - (repeat.itemHeight);
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
        repeat._bottomBufferHeight = repeat._bottomBufferHeight - (repeat.itemHeight);
        rebindAndMoveView(repeat, repeat.view(0), repeat.view(0).overrideContext.$index, true);
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
    if (repeat.viewCount() === 0) {
      return -1;
    }

    let topBufferItems = repeat._topBufferHeight / repeat.itemHeight;
    return index - topBufferItems;
  }

  _handleAddedSplices(repeat: VirtualRepeat, array: Array<any>, splices: any): void {
    let arrayLength = array.length;
    let viewSlot = repeat.viewSlot;
    for (let i = 0, ii = splices.length; i < ii; ++i) {
      let splice = splices[i];
      let addIndex = splice.index;
      let end = splice.index + splice.addedCount;
      for (; addIndex < end; ++addIndex) {
        let hasDistanceToBottomViewPort = getElementDistanceToBottomViewPort(repeat.templateStrategy.getLastElement(repeat.bottomBuffer)) > 0;
        if (repeat.viewCount() === 0 || (!this._isIndexBeforeViewSlot(repeat, viewSlot, addIndex) && !this._isIndexAfterViewSlot(repeat, viewSlot, addIndex)) || hasDistanceToBottomViewPort)  {
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
}
