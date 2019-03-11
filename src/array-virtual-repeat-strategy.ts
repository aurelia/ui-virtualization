import { ICollectionObserverSplice, mergeSplice } from 'aurelia-binding';
import { ViewSlot } from 'aurelia-templating';
import { ArrayRepeatStrategy, createFullOverrideContext } from 'aurelia-templating-resources';
import { IView, IVirtualRepeatStrategy } from './interfaces';
import { getElementDistanceToBottomViewPort, Math$abs, Math$floor, Math$max, Math$min, rebindAndMoveView, updateVirtualOverrideContexts, updateVirtualRepeatContexts } from './utilities';
import { VirtualRepeat } from './virtual-repeat';
import { getDistanceToParent } from './utilities-dom';

/**
* A strategy for repeating a template over an array.
*/
export class ArrayVirtualRepeatStrategy extends ArrayRepeatStrategy implements IVirtualRepeatStrategy {

  createFirstItem(repeat: VirtualRepeat): void {
    let overrideContext = createFullOverrideContext(repeat, repeat.items[0], 0, 1);
    repeat.addView(overrideContext.bindingContext, overrideContext);
  }

  /**
   * @override
   * Handle the repeat's collection instance changing.
   * @param repeat The repeater instance.
   * @param items The new array instance.
   * @param firstIndex The index of first active view. First is a required argument, only ? for valid poly
   */
  instanceChanged(repeat: VirtualRepeat, items: any[], first?: number): void {
    this._inPlaceProcessItems(repeat, items, first);
  }

  /**
   * @override
   * Handle the repeat's collection instance mutating.
   * @param repeat The repeat instance.
   * @param array The modified array.
   * @param splices Records of array changes.
   */
  instanceMutated(repeat: VirtualRepeat, array: any[], splices: ICollectionObserverSplice[]): void {
    this._standardProcessInstanceMutated(repeat, array, splices);
  }

  /**@internal */
  _standardProcessInstanceChanged(repeat: VirtualRepeat, items: any[]): void {
    for (let i = 1, ii = repeat._viewsLength; i < ii; ++i) {
      let overrideContext = createFullOverrideContext(repeat, items[i], i, ii);
      repeat.addView(overrideContext.bindingContext, overrideContext);
    }
  }

  /**
   * Process items thay are currently mapped to a view in bound DOM tree
   * @internal
   */
  _inPlaceProcessItems(repeat: VirtualRepeat, items: any[], firstIndex: number): void {
    const currItemCount = items.length;
    if (currItemCount === 0) {
      repeat.removeAllViews(/*return to cache?*/true, /*skip animation?*/false);
      repeat._resetCalculation();
      delete repeat.__queuedSplices;
      delete repeat.__array;
      return;
    }
    /*
      Get index of first view is looking at the view which is from the ViewSlot
      The view slot has not yet been updated with the new list
      New first has to be the calculated "first" in our view slot, so the first one that's going to be rendered
        To figure out that one, we're going to have to know where we are in our scrolling so we can know how far down we've gone to show the first view
        That "first" is calculated and passed into here
    */
    // remove unneeded views.
    let realViewsCount = repeat.viewCount();
    while (realViewsCount > currItemCount) {
      realViewsCount--;
      repeat.removeView(realViewsCount, /*return to cache?*/true, /*skip animation?*/false);
    }
    const local = repeat.local;
    const lastIndex = currItemCount - 1;
    if (firstIndex + realViewsCount > lastIndex) {
      // first = currItemCount - realViewsCount instead of: first = currItemCount - 1 - realViewsCount;
      //    this is because during view update
      //    view(i) starts at 0 and ends at less than last
      firstIndex = Math$max(0, currItemCount - realViewsCount);
    }

    repeat._first = firstIndex;
    // re-evaluate bindings on existing views.
    for (let i = 0; i < realViewsCount; i++) {
      const currIndex = i + firstIndex;
      const view = repeat.view(i);
      const last = currIndex === currItemCount - 1;
      const middle = currIndex !== 0 && !last;
      const bindingContext = view.bindingContext;
      const overrideContext = view.overrideContext;
      // any changes to the binding context?
      if (bindingContext[local] === items[currIndex]
        && overrideContext.$middle === middle
        && overrideContext.$last === last
      ) {
        // no changes. continue...
        continue;
      }
      // update the binding context and refresh the bindings.
      bindingContext[local] = items[currIndex];
      overrideContext.$middle = middle;
      overrideContext.$last = last;
      overrideContext.$index = currIndex;
      repeat.updateBindings(view);
    }
    // add new views
    const minLength = Math$min(repeat._viewsLength, currItemCount);
    for (let i = realViewsCount; i < minLength; i++) {
      const overrideContext = createFullOverrideContext(repeat, items[i], i, currItemCount);
      repeat.addView(overrideContext.bindingContext, overrideContext);
    }    
  }

  /**@internal */
  _standardProcessInstanceMutated(repeat: VirtualRepeat, array: Array<any>, splices: ICollectionObserverSplice[]): void {
    if (repeat.__queuedSplices) {
      for (let i = 0, ii = splices.length; i < ii; ++i) {
        let {index, removed, addedCount} = splices[i];
        mergeSplice(repeat.__queuedSplices, index, removed, addedCount);
      }
      repeat.__array = array.slice(0);
      return;
    }
    if (array.length === 0) {
      repeat.removeAllViews(/*return to cache?*/true, /*skip animation?*/false);
      repeat._resetCalculation();
      delete repeat.__queuedSplices;
      delete repeat.__array;
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

  /**
   * Run splices with strategy:
   * - Remove first
   *  - Each removal cause decrease in buffer heights, or a real view removal, based on index
   * - Add after
   *  - Each add cause increase in buffer heights, or a real view insertion, based on index
   * @internal
   */
  _runSplices(repeat: VirtualRepeat, newArray: any[], splices: ICollectionObserverSplice[]): any {
    // console.log('+begin: %crunSplices', 'color: orangered');
    const firstIndex = repeat._first;
    // console.log(firstIndex, JSON.stringify(splices.map(s => [s.removed.length, s.addedCount, s.index])));
    let totalRemovedCount = 0;
    let totalAddedCount = 0;
    let splice: ICollectionObserverSplice;

    let i = 0;
    const spliceCount = splices.length;
    const newArraySize = newArray.length;

    // do all splices replace existing entries?
    // this means every removal of collection item is followed by an added with the same count
    let allSplicesAreInplace = true;
    for (i = 0; spliceCount > i; i++) {
      splice = splices[i];
      const removedCount = splice.removed.length;
      const addedCount = splice.addedCount;
      totalRemovedCount += removedCount;
      totalAddedCount += addedCount;
      if (removedCount !== addedCount) {
        allSplicesAreInplace = false;
      }
    }

    // Optimizable case 1:
    // if so, optimise by just replacing affected visible views
    if (allSplicesAreInplace) {
      const repeatViewSlot = repeat.viewSlot;
      for (i = 0; spliceCount > i; i++) {
        splice = splices[i];
        for (let collectionIndex = splice.index; collectionIndex < splice.index + splice.addedCount; collectionIndex++) {
          if (!this._isIndexBeforeViewSlot(repeat, repeatViewSlot, collectionIndex)
            && !this._isIndexAfterViewSlot(repeat, repeatViewSlot, collectionIndex)
          ) {
            let viewIndex = this._getViewIndex(repeat, repeatViewSlot, collectionIndex);
            let overrideContext = createFullOverrideContext(repeat, newArray[collectionIndex], collectionIndex, newArraySize);
            repeat.removeView(viewIndex, /*return to cache?*/true, /*skip animation?*/true);
            repeat.insertView(viewIndex, overrideContext.bindingContext, overrideContext);
          }
        }
      }
      // console.log('-end: %crunSplice', 'color: orangered');
      return;
    }


    let firstIndexAfterMutation = firstIndex;
    const itemHeight = repeat.itemHeight;
    const originalSize = newArraySize + totalRemovedCount - totalAddedCount;
    const currViewCount = repeat.viewCount();

    let newViewCount = currViewCount;

    // bailable case 1:
    // if previous collection size is 0 and item height has not been calculated
    // there is no base to calculate mutation
    // treat it like an instance changed and bail
    if (originalSize === 0 && itemHeight === 0) {
      repeat._resetCalculation();
      repeat.itemsChanged();
      return;
    }

    // Optimizable case 2:
    // all splices happens after last index of the repeat, and the repeat has already filled up the viewport
    // in this case, no visible view is needed to be updated/moved/removed.
    // only need to update bottom buffer
    const lastViewIndex = repeat._getIndexOfLastView();
    const all_splices_are_after_view_port = currViewCount > repeat.elementsInView && splices.every(s => s.index > lastViewIndex);
    if (all_splices_are_after_view_port) {
      repeat._bottomBufferHeight = Math$max(0, newArraySize - firstIndex - currViewCount) * itemHeight;
      repeat._updateBufferElements(true);
    }
    // mutation happens somewhere in middle of the visible viewport
    // or before the viewport. In any case, it will shift first index around
    // which requires recalculation of everything
    else {

      let viewsRequiredCount = repeat._viewsLength;
      if (viewsRequiredCount === 0) {
        const scrollerInfo = repeat.getScrollerInfo();
        const minViewsRequired = Math$floor(scrollerInfo.height / itemHeight) + 1;
        repeat.elementsInView = minViewsRequired;
        viewsRequiredCount = repeat._viewsLength = minViewsRequired * 2;
      }

      for (i = 0; spliceCount > i; ++i) {
        const { addedCount, removed: { length: removedCount }, index: spliceIndex } = splices[i];
        const removeDelta = removedCount - addedCount;
        if (firstIndexAfterMutation > spliceIndex) {
          firstIndexAfterMutation = Math$max(0, firstIndexAfterMutation - removeDelta);
        }
      }
      console.log({firstIndexAfterMutation});
      newViewCount = 0;
      // if array size is less than or equal to number of elements in View
      // the nadjust first index to 0
      // and set view count to new array size as there are not enough item to fill more than required
      if (newArraySize <= repeat.elementsInView) {
        firstIndexAfterMutation = 0;
        newViewCount = newArraySize;
      }
      // if number of views required to fill viewport is less than the size of array
      else {
        // else if array size is
        //    - greater than min number of views required to fill viewport
        //    - and less than or equal to no of views required to have smooth scrolling
        // Set viewcount to new array size
        // but do not change first index, since it could be at bottom half of the repeat "actual" views
        if (newArraySize <= viewsRequiredCount) {
          newViewCount = newArraySize;
          firstIndexAfterMutation = 0;
        }
        // else, the array size is big enough to cover the min views required, and the buffer for smooth scrolling
        // then set view count to mins views + buffer number
        // don't change first index
        else {
          newViewCount = viewsRequiredCount;
        }
      }
      const newTopBufferItemCount = newArraySize >= firstIndexAfterMutation
        ? firstIndexAfterMutation
        : 0;
      const viewCountDelta = newViewCount - currViewCount;
      // needs to adjust bound view count based on newViewCount
      // if newViewCount > currViewCount: add until meet new number
      if (viewCountDelta > 0) {
        for (i = 0; viewCountDelta > i; ++i) {
          const collectionIndex = firstIndexAfterMutation + currViewCount + i;
          const overrideContext = createFullOverrideContext(repeat, newArray[collectionIndex], collectionIndex, newArray.length);
          repeat.addView(overrideContext.bindingContext, overrideContext);
        }
      } else {
        const ii = Math$abs(viewCountDelta);
        for (i = 0; ii > i; ++i) {
          repeat.removeView(newViewCount, /*return to cache?*/true, /*skip animation?*/false);
        }
      }
      const newBotBufferItemCount = Math$max(0, newArraySize - newTopBufferItemCount - newViewCount);
      console.log({ currViewCount, newViewCount, viewsRequiredCount, viewCountDelta, newBotBufferItemCount})

      // first update will be to mimic the behavior of a normal repeat mutation
      // where real views are inserted, removed
      // whenever there is a mutation, scroller variables will be updated
      // can only start to correct views behavior after scroller has stabilized
      repeat._isScrolling = false;
      repeat._scrollingDown = repeat._scrollingUp = false;
      repeat._first = firstIndexAfterMutation;
      repeat._previousFirst = firstIndex
      repeat._lastRebind = firstIndexAfterMutation + newViewCount;
      repeat._topBufferHeight = newTopBufferItemCount * itemHeight;
      repeat._bottomBufferHeight = newBotBufferItemCount * itemHeight;
      repeat._updateBufferElements(/*skip update?*/true);
    }
    // console.log({ firstIndexAfterMutation, newTopBufferItemCount, newBotBufferItemCount});
    console.log({
      first: repeat._first,
      prevFirst: repeat._previousFirst,
      last: repeat._lastRebind,
      top: repeat._topBufferHeight,
      bot: repeat._bottomBufferHeight
    });

    const scrollerInfo = repeat.getScrollerInfo();
    const topBufferDistance = getDistanceToParent(repeat.topBufferEl, scrollerInfo.scroller);
    const realScrolltop = Math$max(
      0,
      scrollerInfo.scrollTop === 0
      ? 0
      : (scrollerInfo.scrollTop - topBufferDistance)
    );
    console.log({
      top: scrollerInfo.scrollTop,
      height: scrollerInfo.scrollHeight
    }, repeat.topBufferEl.style.height, repeat.bottomBufferEl.style.height, repeat._bottomBufferHeight);
      
    let first_index_after_scroll_adjustment = realScrolltop === 0 ? 0 : Math$floor(realScrolltop / itemHeight);
    // if first index after scroll adjustment doesn't fit with number of possible view
    // it means the scroller has been too far down to the bottom and nolonger suitable to start from this index
    // rollback until all views fit into new collection, or until has enough collection item to render
    if (first_index_after_scroll_adjustment + newViewCount >= newArraySize) {
      first_index_after_scroll_adjustment = Math$max(0, newArraySize - newViewCount);
    }
    const top_buffer_item_count_after_scroll_adjustment = first_index_after_scroll_adjustment;
    const bot_buffer_item_count_after_scroll_adjustment = Math$max(
      0,
      newArraySize - top_buffer_item_count_after_scroll_adjustment - newViewCount
    );

    repeat._first
      = repeat._lastRebind = first_index_after_scroll_adjustment;

    repeat._previousFirst = firstIndexAfterMutation;

    repeat.isLastIndex = bot_buffer_item_count_after_scroll_adjustment === 0;
    repeat._topBufferHeight = top_buffer_item_count_after_scroll_adjustment * itemHeight;
    repeat._bottomBufferHeight = bot_buffer_item_count_after_scroll_adjustment * itemHeight;
    // console.log({
    //   realScrolltop,
    //   viewsRequiredCount,
    //   newViewCount,
    //   firstIndexAfterMutation,
    //   newBotBufferItemCount,
    //   firstIndexAfterMutationScrollAdjustment: first_index_after_scroll_adjustment,
    //   newTopBufferItemCountAfterScrollAdjustment: top_buffer_item_count_after_scroll_adjustment,
    //   newBotBufferItemCountAfterScrollAdjustment: bot_buffer_item_count_after_scroll_adjustment
    // })
    // console.log({
    //   botBufferHeight: bot_buffer_item_count_after_scroll_adjustment * itemHeight,
    //   isAtBottom: bot_buffer_item_count_after_scroll_adjustment * itemHeight === 0
    // });
    console.log({
      first: repeat._first,
      prevFirst: repeat._previousFirst,
      last: repeat._lastRebind,
      top: repeat._topBufferHeight,
      bot: repeat._bottomBufferHeight
    });
    repeat._handlingMutations = false;
    // prevent scroller update 
    repeat.revertScrollCheckGuard();
    repeat._updateBufferElements();
    updateVirtualRepeatContexts(repeat, 0);
    // requestAnimationFrame(() => repeat._handleScroll());
    // repeat._handleScroll();
    // console.log('-end: %crunSplices', 'color: orangered');
    // repeat._onScroll();

    
    // for (i = 0; spliceCount > i; ++i) {
    //   const splice = splices[i];
    //   const removedSize = splice.removed.length;
    //   for (let j = 0; removedSize > j; ++j) {
    //     const viewOrPromise = this._removeViewAt(repeat, splice.index + removeDelta + rmPromises.length, true, j, removedSize);
    //     if (viewOrPromise instanceof Promise) {
    //       rmPromises.push(viewOrPromise);
    //     }
    //   }
    //   removeDelta -= splice.addedCount;
    // }

    // if (rmPromises.length > 0) {
    //   return Promise.all(rmPromises).then(() => {
    //     this._handleAddedSplices(repeat, newArray, splices);
    //     updateVirtualOverrideContexts(repeat, 0);
    //   });
    // }
    // this._handleAddedSplices(repeat, newArray, splices);
    // updateVirtualOverrideContexts(repeat, 0);
    // console.log('end: running splice');
  }

  /**@internal */
  _removeViewAt(repeat: VirtualRepeat, collectionIndex: number, returnToCache: boolean, removeIndex: number, removedLength: number): void | Promise<void> {
    let viewOrPromise: IView | Promise<IView>;
    let view: IView;
    let viewSlot = repeat.viewSlot;
    let viewCount = repeat.viewCount();
    let viewAddIndex: number;
    let removeMoreThanInDom = removedLength > viewCount;
    if (repeat._viewsLength <= removeIndex) {
      repeat._bottomBufferHeight = repeat._bottomBufferHeight - (repeat.itemHeight);
      repeat._updateBufferElements();
      return;
    }

    // index in view slot?
    if (!this._isIndexBeforeViewSlot(repeat, viewSlot, collectionIndex) && !this._isIndexAfterViewSlot(repeat, viewSlot, collectionIndex)) {
      let viewIndex = this._getViewIndex(repeat, viewSlot, collectionIndex);
      viewOrPromise = repeat.removeView(viewIndex, returnToCache, /*skip animation?*/false);
      if (repeat.items.length > viewCount) {
        // TODO: do not trigger view lifecycle here
        let collectionAddIndex: number;
        if (repeat._bottomBufferHeight > repeat.itemHeight) {
          viewAddIndex = viewCount;
          if (!removeMoreThanInDom) {
            let lastViewItem = repeat._getLastViewItem();
            collectionAddIndex = repeat.items.indexOf(lastViewItem) + 1;
          } else {
            collectionAddIndex = removeIndex;
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
          view = repeat.viewFactory.create() as IView;
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
        repeat._updateBufferElements();
      });
    } else if (view) {
      repeat.viewSlot.insert(viewAddIndex, view);
    }
    repeat._updateBufferElements();
  }

  /**@internal */
  _isIndexBeforeViewSlot(repeat: VirtualRepeat, viewSlot: ViewSlot, index: number): boolean {
    let viewIndex = this._getViewIndex(repeat, viewSlot, index);
    return viewIndex < 0;
  }

  /**@internal */
  _isIndexAfterViewSlot(repeat: VirtualRepeat, viewSlot: ViewSlot, index: number): boolean {
    let viewIndex = this._getViewIndex(repeat, viewSlot, index);
    return viewIndex > repeat._viewsLength - 1;
  }

  /**
   * @internal
   * Calculate real index of a given index, based on existing buffer height and item height
   */
  _getViewIndex(repeat: VirtualRepeat, viewSlot: ViewSlot, index: number): number {
    if (repeat.viewCount() === 0) {
      return -1;
    }

    let topBufferItems = repeat._topBufferHeight / repeat.itemHeight;
    return Math$floor(index - topBufferItems);
  }

  /**@internal */
  _handleAddedSplices(repeat: VirtualRepeat, array: Array<any>, splices: ICollectionObserverSplice[]): void {
    const arraySize = array.length;
    const viewSlot = repeat.viewSlot;
    const spliceCount = splices.length;
    for (let i = 0; spliceCount > i; ++i) {
      let splice = splices[i];
      let addIndex = splice.index;
      let end = splice.index + splice.addedCount;
      for (; end > addIndex; ++addIndex) {
        const hasDistanceToBottomViewPort = getElementDistanceToBottomViewPort(repeat.templateStrategy.getLastElement(repeat.topBufferEl, repeat.bottomBufferEl)) > 0;
        if (repeat.viewCount() === 0
          || (!this._isIndexBeforeViewSlot(repeat, viewSlot, addIndex)
            && !this._isIndexAfterViewSlot(repeat, viewSlot, addIndex)
          )
          || hasDistanceToBottomViewPort
        )  {
          let overrideContext = createFullOverrideContext(repeat, array[addIndex], addIndex, arraySize);
          repeat.insertView(addIndex, overrideContext.bindingContext, overrideContext);
          if (!repeat._hasCalculatedSizes) {
            repeat._calcInitialHeights(1);
          } else if (repeat.viewCount() > repeat._viewsLength) {
            if (hasDistanceToBottomViewPort) {
              repeat.removeView(0, /*return to cache?*/true, /*skip animation?*/true);
              repeat._topBufferHeight = repeat._topBufferHeight + repeat.itemHeight;
              repeat._updateBufferElements();
            } else {
              repeat.removeView(repeat.viewCount() - 1, /*return to cache?*/true, /*skip animation?*/true);
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
    repeat._updateBufferElements();
  }
}
