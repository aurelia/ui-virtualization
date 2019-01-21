import { ICollectionObserverSplice, mergeSplice } from 'aurelia-binding';
import { ViewSlot } from 'aurelia-templating';
import { ArrayRepeatStrategy, createFullOverrideContext } from 'aurelia-templating-resources';
import { IView, IVirtualRepeatStrategy } from './interfaces';
import { $min, $round, getElementDistanceToBottomViewPort, rebindAndMoveView, updateVirtualOverrideContexts } from './utilities';
import { VirtualRepeat } from './virtual-repeat';

/**
* A strategy for repeating a template over an array.
*/
export class ArrayVirtualRepeatStrategy extends ArrayRepeatStrategy implements IVirtualRepeatStrategy {
  // create first item to calculate the heights
  createFirstItem(repeat: VirtualRepeat): void {
    let overrideContext = createFullOverrideContext(repeat, repeat.items[0], 0, 1);
    repeat.addView(overrideContext.bindingContext, overrideContext);
  }
  /**
   * @override
  * Handle the repeat's collection instance changing.
  * @param repeat The repeater instance.
  * @param items The new array instance.
  */
  instanceChanged(repeat: VirtualRepeat, items: Array<any>, ...rest: any[]): void {
    this._inPlaceProcessItems(repeat, items, rest[0]);
  }

  /**
   * @override
  * Handle the repeat's collection instance mutating.
  * @param repeat The repeat instance.
  * @param array The modified array.
  * @param splices Records of array changes.
  */
  instanceMutated(repeat: VirtualRepeat, array: Array<any>, splices: ICollectionObserverSplice[]): void {
    this._standardProcessInstanceMutated(repeat, array, splices);
  }

  /**@internal */
  _standardProcessInstanceChanged(repeat: VirtualRepeat, items: Array<any>): void {
    for (let i = 1, ii = repeat._requiredViewsCount; i < ii; ++i) {
      let overrideContext = createFullOverrideContext(repeat, items[i], i, ii);
      repeat.addView(overrideContext.bindingContext, overrideContext);
    }
  }

  /**@internal */
  _inPlaceProcessItems(repeat: VirtualRepeat, items: Array<any>, first: number): void {
    let itemsLength = items.length;
    let viewsLength = repeat.viewCount();
    /*
      Get index of first view is looking at the view which is from the ViewSlot
      The view slot has not yet been updated with the new list
      New first has to be the calculated "first" in our view slot, so the first one that's going to be rendered
        To figure out that one, we're going to have to know where we are in our scrolling so we can know how far down we've gone to show the first view
        That "first" is calculated and passed into here
    */
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
      view.overrideContext.$index = i + first;
      repeat.updateBindings(view);
    }
    // add new views
    let minLength = $min(repeat._requiredViewsCount, itemsLength);
    for (let i = viewsLength; i < minLength; i++) {
      let overrideContext = createFullOverrideContext(repeat, items[i], i, itemsLength);
      repeat.addView(overrideContext.bindingContext, overrideContext);
    }
  }

  /**@internal */
  _standardProcessInstanceMutated(repeat: VirtualRepeat, array: any[], splices: any): void {
    if (repeat.__queuedSplices) {
      for (let i = 0, ii = splices.length; i < ii; ++i) {
        let {index, removed, addedCount} = splices[i];
        mergeSplice(repeat.__queuedSplices, index, removed, addedCount);
      }
      repeat.__array = array.slice(0);
      return;
    }

    // After a mutation, if there is no items left in the array,
    // it's safe to remove all current view, reset all of repeat calculation
    // and return immediately since there is nothing needed to be calculated
    if (array.length === 0) {
      delete repeat.__queuedSplices;
      delete repeat.__array;
      this._removeAllViews(repeat);
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

  /**@internal */
  _runSplices(repeat: VirtualRepeat, array: any[], splices: ICollectionObserverSplice[]): any {
    let removeDelta = 0;
    let rmPromises = [];

    // do all splices replace existing entries?
    // this is determine by checking if all splices are balanced between addedCount and removed.length
    let allSplicesAreInplace = true;
    for (let i = 0; i < splices.length; i++) {
      let splice = splices[i];
      let removedCount = splice.removed.length;
      if (removedCount !== splice.addedCount) {
        allSplicesAreInplace = false;
        break;
      }
    }

    // if so, optimise by just replacing affected visible views
    if (allSplicesAreInplace) {
      for (let i = 0; i < splices.length; i++) {
        let splice = splices[i];
        for (let collectionIndex = splice.index; collectionIndex < splice.index + splice.addedCount; collectionIndex++) {
          if (this._isIndexVisible(repeat, repeat.viewSlot, collectionIndex)) {
            let viewIndex = this._getViewIndex(repeat, repeat.viewSlot, collectionIndex);
            let overrideContext = createFullOverrideContext(repeat, array[collectionIndex], collectionIndex, array.length);
            repeat.removeView(viewIndex, true, true);
            repeat.insertView(viewIndex, overrideContext.bindingContext, overrideContext);
          }
        }
      }
      return;
    }

    for (let i = 0, k = 0, ii = splices.length; i < ii; ++i) {
      let splice = splices[i];
      let removed = splice.removed;
      let removedLength = removed.length;

      for (let j = 0, jj = removedLength; j < jj; ++j, ++k) {
        let viewOrPromise = this._removeViewAt(
          repeat,
          splice.index + removeDelta + rmPromises.length,
          true,
          k
        );
        if (viewOrPromise instanceof Promise) {
          rmPromises.push(viewOrPromise);
        }
      }
      removeDelta -= splice.addedCount;
    }

    if (rmPromises.length > 0) {
      return Promise.all(rmPromises).then(() => {
        this._fillUpViewSlot(repeat, array, splices);
        this._handleAddedSplices(repeat, array, splices);
        updateVirtualOverrideContexts(repeat, 0);
      });
    }
    this._fillUpViewSlot(repeat, array, splices);
    this._handleAddedSplices(repeat, array, splices);
    updateVirtualOverrideContexts(repeat, 0);
  }

  /**@internal */
  _fillUpViewSlot(repeat: VirtualRepeat, array: any[], splices: ICollectionObserverSplice[]) {
    if (repeat._requiredViewsCount < repeat.viewCount()) {
      return;
    }

    // replace removed views by adding new views at the bottom
    let currDelta = 0;
    let addDelta = 0;
    for (let i = 0, ii = splices.length; i < ii; i++) {
      let splice = splices[i];
      let collectionIndex = splice.index + currDelta + splice.addedCount;
      currDelta = Math.max(0, splice.addedCount - splice.removed.length);
      addDelta += splice.addedCount;
      let end = array.length;
      let nextSplice = splices[i + 1];
      if (nextSplice) {
        end = nextSplice.index;
      }
      for (; collectionIndex < end; collectionIndex++) {
        let viewCount = repeat.viewCount();
        let viewIndex = viewCount === 0 ? 0 : this._getViewIndex(repeat, repeat.viewSlot, collectionIndex) - addDelta;
        if (viewIndex >= repeat._requiredViewsCount) {
          return;
        }
        if (viewIndex >= viewCount) {
          let data = repeat.items[collectionIndex];
          let view: IView;
          if (data) {
            let overrideContext = createFullOverrideContext(repeat, data, collectionIndex, array.length);
            view = repeat.viewFactory.create() as IView;
            view.bind(overrideContext.bindingContext, overrideContext);
          }
          if (view) {
            repeat.viewSlot.insert(viewIndex, view);
          } else {
            return;
          }
        }
      }
    }
  }

  /**@internal */
  _removeViewAt(repeat: VirtualRepeat, collectionIndex: number, returnToCache: boolean, j: number): any {
    let viewOrPromise: IView | Promise<IView>;
    let viewSlot = repeat.viewSlot;
    let viewCount = repeat.viewCount();

    let currentTopBufferHeight = repeat._topBufferHeight;
    let currentBottomBufferHeight = repeat._bottomBufferHeight;
    let itemHeight = repeat.itemHeight;

    // index in view slot?
    if (this._isIndexVisible(repeat, viewSlot, collectionIndex)) {
      let viewIndex = this._getViewIndex(repeat, viewSlot, collectionIndex);
      if (viewIndex < viewCount) {
        viewOrPromise = repeat.removeView(viewIndex, returnToCache);
      }
      if (currentBottomBufferHeight > 0) {
        repeat._bottomBufferHeight = currentBottomBufferHeight - (itemHeight);
      }
    } else {
      if (this._isIndexBeforeViewSlot(repeat, viewSlot, collectionIndex)) {
        if (currentTopBufferHeight > 0) {
          repeat._topBufferHeight = currentTopBufferHeight - (itemHeight);
        } else if (currentBottomBufferHeight > 0) {
          repeat._bottomBufferHeight = currentBottomBufferHeight - (itemHeight);
          if (viewCount > 0) {
            let firstView = repeat._getFirstView();
            rebindAndMoveView(repeat, firstView, firstView.overrideContext.$index, true);
          }
        }
      } else if (this._isIndexAfterViewSlot(repeat, viewSlot, collectionIndex)) {
        repeat._bottomBufferHeight = currentBottomBufferHeight - (itemHeight);
      }
    }

    if (viewOrPromise instanceof Promise) {
      return viewOrPromise.then(() => {
        repeat._adjustBufferHeights();
      });
    }
    repeat._adjustBufferHeights();
    return viewOrPromise;
  }

  /**
   * Short circut removing all current view of a repeat, with proper buffer updates
   * @internal
   */
  _removeAllViews(repeat: VirtualRepeat): void | Promise<void> {
    let slot = repeat.viewSlot;
    let hasPromise = false;
    let removeResults: (IView | Promise<IView>)[] = [];
    for (let i = 0, ii = slot.children.length; ii > i; ++i) {
      let viewOrPromise = slot.removeAt(0, true, false) as IView | Promise<IView>;
      if (viewOrPromise instanceof Promise) {
        hasPromise = true;
      }
      removeResults.push(viewOrPromise);
    }
    if (hasPromise) {
      return Promise
        .all(removeResults)
        .then(() => {
          repeat._resetCalculation();
        });
    }
    repeat._resetCalculation();
  }

  /**
   * Determine if a collection index falls into visible range of the scrolling viewport
   * `true` = visible
   * `false` = not visible
   * @internal
   */
  _isIndexVisible(repeat: VirtualRepeat, viewSlot: ViewSlot, collectionIndex: number): boolean {
    let viewIndex = this._getViewIndex(repeat, viewSlot, collectionIndex);
    return viewIndex > -1 && viewIndex < repeat._requiredViewsCount - 1;
  }

  /**@internal */
  _isIndexBeforeViewSlot(repeat: VirtualRepeat, viewSlot: ViewSlot, collectionIndex: number): boolean {
    let viewIndex = this._getViewIndex(repeat, viewSlot, collectionIndex);
    return viewIndex < 0;
  }

  /**@internal */
  _isIndexAfterViewSlot(repeat: VirtualRepeat, viewSlot: ViewSlot, collectionIndex: number): boolean {
    let viewIndex = this._getViewIndex(repeat, viewSlot, collectionIndex);
    return viewIndex > repeat._requiredViewsCount - 1;
  }

  /**
   * @internal
   * Calculate real index of a given index, based on existing buffer height and item height
   */
  _getViewIndex(repeat: VirtualRepeat, viewSlot: ViewSlot, index: number): number {
    if (repeat.viewCount() === 0) {
      return -1;
    }

    let topBufferItems = repeat.itemHeight === 0 ? 0 : $round(repeat._topBufferHeight / repeat.itemHeight);
    return index - topBufferItems;
    // return index - topBufferItems > -1 ? topBufferItems : 0;
    // return index - repeat._first;
  }

  /**@internal */
  _handleAddedSplices(repeat: VirtualRepeat, array: Array<any>, splices: ICollectionObserverSplice[]): void {
    let arrayLength = array.length;
    let viewSlot = repeat.viewSlot;
    for (let i = 0, ii = splices.length; i < ii; ++i) {
      let splice = splices[i];
      let addIndex = splice.index;
      let end = splice.index + splice.addedCount;
      for (; addIndex < end; ++addIndex) {
        let hasDistanceToBottomViewPort = getElementDistanceToBottomViewPort(repeat.templateStrategy.getLastElement(repeat.bottomBuffer)) > 0;
        if (repeat.viewCount() === 0
          || this._isIndexVisible(repeat, viewSlot, addIndex)
          || hasDistanceToBottomViewPort
        )  {
          let overrideContext = createFullOverrideContext(repeat, array[addIndex], addIndex, arrayLength);
          repeat.insertView(addIndex, overrideContext.bindingContext, overrideContext);
          if (!repeat._hasCalculatedSizes) {
            repeat._calcInitialHeights(1);
          } else if (repeat.viewCount() > repeat._requiredViewsCount) {
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
