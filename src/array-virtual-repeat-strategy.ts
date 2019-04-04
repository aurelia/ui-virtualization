import { ICollectionObserverSplice, mergeSplice } from 'aurelia-binding';
import { ViewSlot } from 'aurelia-templating';
import { ArrayRepeatStrategy, createFullOverrideContext } from 'aurelia-templating-resources';
import { IView, IVirtualRepeatStrategy, VirtualizationCalculation, IScrollerInfo } from './interfaces';
import {
  Math$abs,
  Math$floor,
  Math$max,
  Math$min,
  updateAllViews
} from './utilities';
import { VirtualRepeat } from './virtual-repeat';
import { getDistanceToParent, hasOverflowScroll, calcScrollHeight, calcOuterHeight } from './utilities-dom';
import { htmlElement } from './constants';

/**
 * A strategy for repeating a template over an array.
 */
export class ArrayVirtualRepeatStrategy extends ArrayRepeatStrategy implements IVirtualRepeatStrategy {

  createFirstItem(repeat: VirtualRepeat): IView {
    const overrideContext = createFullOverrideContext(repeat, repeat.items[0], 0, 1);
    return repeat.addView(overrideContext.bindingContext, overrideContext);
  }

  initCalculation(repeat: VirtualRepeat, items: any[]): VirtualizationCalculation {
    const itemCount = items.length;
    // when there is no item, bails immediately
    // and return false to notify calculation finished unsuccessfully
    if (!(itemCount > 0)) {
      return VirtualizationCalculation.reset;
    }
    // before invoking instance changed, there needs to be basic calculation on how
    // the required vairables such as item height and elements required
    const containerEl = repeat.getScroller();
    const existingViewCount = repeat.viewCount();
    if (itemCount > 0 && existingViewCount === 0) {
      this.createFirstItem(repeat);
    }
    const isFixedHeightContainer = repeat._fixedHeightContainer = hasOverflowScroll(containerEl);
    const firstView = repeat._firstView();
    const itemHeight = calcOuterHeight(firstView.firstChild as Element);
    // when item height is 0, bails immediately
    // and return false to notify calculation has finished unsuccessfully
    // it cannot be processed further when item is 0
    if (itemHeight === 0) {
      return VirtualizationCalculation.none;
    }
    repeat.itemHeight = itemHeight;
    const scroll_el_height = isFixedHeightContainer
      ? calcScrollHeight(containerEl)
      : innerHeight;
    // console.log({ scroll_el_height })
    const elementsInView = repeat.elementsInView = Math$floor(scroll_el_height / itemHeight) + 1;
    const viewsCount = repeat._viewsLength = elementsInView * 2;
    return VirtualizationCalculation.has_sizing | VirtualizationCalculation.observe_scroller;
  }

  onAttached(repeat: VirtualRepeat): void {
    if (repeat.items.length < repeat.elementsInView) {
      repeat._getMore2(0, /*is near top?*/true, this.isNearBottom(repeat, repeat._lastViewIndex()), /*force?*/true);
    }
  }

  getViewRange(repeat: VirtualRepeat, scrollerInfo: IScrollerInfo): [number, number] {
    const topBufferEl = repeat.topBufferEl;
    const scrollerEl = repeat.scrollerEl;
    const itemHeight = repeat.itemHeight;
    let realScrollTop = 0;
    const isFixedHeightContainer = scrollerInfo.scroller !== htmlElement;
    if (isFixedHeightContainer) {
      // If offset parent of top buffer is the scroll container
      //    its actual offsetTop is just the offset top itself
      // If not, then the offset top is calculated based on the parent offsetTop as well
      const topBufferDistance = getDistanceToParent(topBufferEl, scrollerEl);
      const scrollerScrollTop = scrollerInfo.scrollTop;
      realScrollTop = Math$max(0, scrollerScrollTop - Math$abs(topBufferDistance));
    } else {
      realScrollTop = pageYOffset - repeat.distanceToTop;
    }

    const realViewCount = repeat._viewsLength;

    // Calculate the index of first view
    // Using Math floor to ensure it has correct space for both small and large calculation
    let firstVisibleIndex = Math$max(0, itemHeight > 0 ? Math$floor(realScrollTop / itemHeight) : 0);
    const lastVisibleIndex = Math.min(
      repeat.items.length - 1,
      firstVisibleIndex + (realViewCount - /*number of view count includes the first view, so minus 1*/1));
    firstVisibleIndex = Math.max(
      0,
      Math.min(
        firstVisibleIndex,
        lastVisibleIndex - (realViewCount - /*number of view count includes the first view, so minus 1*/1)
      )
    );
    return [firstVisibleIndex, lastVisibleIndex];
  }

  updateBuffers(repeat: VirtualRepeat, firstIndex: number): void {
    const itemHeight = repeat.itemHeight;
    const itemCount = repeat.items.length;
    repeat._topBufferHeight = firstIndex * itemHeight;
    repeat._bottomBufferHeight = (itemCount - firstIndex - repeat.viewCount()) * itemHeight;
    repeat._updateBufferElements(/*skip update?*/true);
  }

  isNearTop(repeat: VirtualRepeat, firstIndex: number): boolean {
    const itemCount = repeat.items.length;
    return itemCount > 0
      ? firstIndex <= repeat.edgeDistance
      : false;
  }

  isNearBottom(repeat: VirtualRepeat, lastIndex: number): boolean {
    const itemCount = repeat.items.length;
    return lastIndex === -1
      ? true
      : itemCount > 0
        ? lastIndex >= (itemCount - repeat.edgeDistance)
        : false;
  }

  /**
   * @override
   * Handle the repeat's collection instance changing.
   * @param repeat The repeater instance.
   * @param items The new array instance.
   * @param firstIndex The index of first active view. First is a required argument, only ? for valid poly
   */
  instanceChanged(repeat: VirtualRepeat, items: any[], first?: number): void {
    if (this._inPlaceProcessItems(repeat, items, first)) {
      this._remeasure(repeat, repeat.itemHeight, repeat._viewsLength, items.length, repeat._first);
    }
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

  /**
   * Process items thay are currently mapped to a view in bound DOM tree
   *
   * @returns `false` to signal there should be no remeasurement
   * @internal
   */
  _inPlaceProcessItems(repeat: VirtualRepeat, items: any[], firstIndex: number): boolean {
    const currItemCount = items.length;
    if (currItemCount === 0) {
      repeat.removeAllViews(/*return to cache?*/true, /*skip animation?*/false);
      repeat._resetCalculation();
      repeat.__queuedSplices = repeat.__array = undefined;
      return false;
    }
    /*
      Get index of first view is looking at the view which is from the ViewSlot
      The view slot has not yet been updated with the new list
      New first has to be the calculated "first" in our view slot, so the first one that's going to be rendered
        To figure out that one, we're going to have to know where we are in our scrolling so we can know how far down we've gone to show the first view
        That "first" is calculated and passed into here
    */

    // if the number of items shrinks to less than number of active views
    // remove all unneeded views
    let realViewsCount = repeat.viewCount();
    while (realViewsCount > currItemCount) {
      realViewsCount--;
      repeat.removeView(realViewsCount, /*return to cache?*/true, /*skip animation?*/false);
    }
    // there is situation when container height shrinks
    // the real views count will be greater than new maximum required view count
    // remove all unnecessary view
    while (realViewsCount > repeat._viewsLength) {
      realViewsCount--;
      repeat.removeView(realViewsCount, /*return to cache?*/true, /*skip animation?*/false);
    }
    realViewsCount = Math$min(realViewsCount, repeat._viewsLength);

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
        && overrideContext.$index === currIndex
        && overrideContext.$middle === middle
        && overrideContext.$last === last
      ) {
        // no changes. continue...
        continue;
      }
      // update the binding context and refresh the bindings.
      bindingContext[local] = items[currIndex];
      overrideContext.$first = currIndex === 0;
      overrideContext.$middle = middle;
      overrideContext.$last = last;
      overrideContext.$index = currIndex;
      const odd = currIndex % 2 === 1;
      overrideContext.$odd = odd;
      overrideContext.$even = !odd;
      repeat.updateBindings(view);
    }
    // add new views
    const minLength = Math$min(repeat._viewsLength, currItemCount);
    for (let i = realViewsCount; i < minLength; i++) {
      const overrideContext = createFullOverrideContext(repeat, items[i], i, currItemCount);
      repeat.addView(overrideContext.bindingContext, overrideContext);
    }
    return true;
  }

  /**@internal */
  _standardProcessInstanceMutated(repeat: VirtualRepeat, array: Array<any>, splices: ICollectionObserverSplice[]): void {
    if (repeat.__queuedSplices) {
      for (let i = 0, ii = splices.length; i < ii; ++i) {
        const { index, removed, addedCount } = splices[i];
        mergeSplice(repeat.__queuedSplices, index, removed, addedCount);
      }
      repeat.__array = array.slice(0);
      return;
    }
    if (array.length === 0) {
      repeat.removeAllViews(/*return to cache?*/true, /*skip animation?*/false);
      repeat._resetCalculation();
      repeat.__queuedSplices = repeat.__array = undefined;
      return;
    }

    const maybePromise = this._runSplices(repeat, array.slice(0), splices);
    if (maybePromise instanceof Promise) {
      const queuedSplices = repeat.__queuedSplices = [];

      const runQueuedSplices = () => {
        if (! queuedSplices.length) {
          repeat.__queuedSplices = repeat.__array = undefined;
          return;
        }

        const nextPromise = this._runSplices(repeat, repeat.__array, queuedSplices) || Promise.resolve();
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
    const firstIndex = repeat._first;
    // total remove count and total added count are used to determine original size of collection
    // before mutation happens, also can be used to determine some optmizable cases of mutation
    // such as case where all mutations happen after last visible view index
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
    // if all splices removal are followed by same amount of add,
    // optimise by just replacing affected visible views
    if (allSplicesAreInplace) {
      const lastIndex = repeat._lastViewIndex();
      const repeatViewSlot = repeat.viewSlot;
      for (i = 0; spliceCount > i; i++) {
        splice = splices[i];
        for (let collectionIndex = splice.index; collectionIndex < splice.index + splice.addedCount; collectionIndex++) {
          // if (!this._isIndexBeforeViewSlot(repeat, repeatViewSlot, collectionIndex)
          //   && !this._isIndexAfterViewSlot(repeat, repeatViewSlot, collectionIndex)
          // ) {
          //   const viewIndex = this._getViewIndex(repeat, repeatViewSlot, collectionIndex);
          if (collectionIndex >= firstIndex && collectionIndex <= lastIndex) {
            const viewIndex = collectionIndex - firstIndex;
            const overrideContext = createFullOverrideContext(repeat, newArray[collectionIndex], collectionIndex, newArraySize);
            repeat.removeView(viewIndex, /*return to cache?*/true, /*skip animation?*/true);
            repeat.insertView(viewIndex, overrideContext.bindingContext, overrideContext);
          }
        }
      }
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
    const lastViewIndex = repeat._lastViewIndex();
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
      // when max views count required is 0, it's a sign of previous state of this mutation
      // was either reseted, or in unstable state. Should recalculate min & max numbers of views required
      // before processing further
      if (viewsRequiredCount === 0) {
        const scrollerInfo = repeat.getScrollerInfo();
        const minViewsRequired = Math$floor(scrollerInfo.height / itemHeight) + 1;
        // reassign to min views required
        repeat.elementsInView = minViewsRequired;
        // reassign to max views required
        viewsRequiredCount = repeat._viewsLength = minViewsRequired * 2;
      }

      for (i = 0; spliceCount > i; ++i) {
        const { addedCount, removed: { length: removedCount }, index: spliceIndex } = splices[i];
        const removeDelta = removedCount - addedCount;
        if (firstIndexAfterMutation > spliceIndex) {
          firstIndexAfterMutation = Math$max(0, firstIndexAfterMutation - removeDelta);
        }
      }
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

      // first update will be to mimic the behavior of a normal repeat mutation
      // where real views are inserted, removed
      // whenever there is a mutation, scroller variables will be updated
      // can only start to correct views behavior after scroller has stabilized
      repeat._isScrolling = false;
      repeat._scrollingDown = repeat._scrollingUp = false;
      repeat._first = firstIndexAfterMutation;
      repeat._previousFirst = firstIndex;
      repeat._lastRebind = firstIndexAfterMutation + newViewCount;
      repeat._topBufferHeight = newTopBufferItemCount * itemHeight;
      repeat._bottomBufferHeight = newBotBufferItemCount * itemHeight;
      repeat._updateBufferElements(/*skip update?*/true);
    }

    // step 1 of mutation handling could shift the scroller scroll position
    // around and stabilize somewhere that is not original scroll position based on splices
    // need to recalcuate first index based on scroll position, as this is the simplest form
    // of syncing with browser implementation
    this._remeasure(repeat, itemHeight, newViewCount, newArraySize, firstIndexAfterMutation);
  }

  remeasure(repeat: VirtualRepeat): void {
    this._remeasure(repeat, repeat.itemHeight, repeat.viewCount(), repeat.items.length, repeat._firstViewIndex());
  }

  /**
   * Unlike normal repeat, virtualization repeat employs "padding" elements. Those elements
   * often are just blank block with proper height/width to adjust the height/width/scroll feeling
   * of virtualized repeat.
   *
   * Because of this, either mutation or change of the collection of repeat will potentially require
   * readjustment (or measurement) of those blank block, based on scroll position
   *
   * This is 2 phases scroll handle
   *
   * @internal
   */
  _remeasure(repeat: VirtualRepeat, itemHeight: number, newViewCount: number, newArraySize: number, firstIndex: number): void {
    const scrollerInfo = repeat.getScrollerInfo();
    const topBufferDistance = getDistanceToParent(repeat.topBufferEl, scrollerInfo.scroller);
    const realScrolltop = Math$max(0, scrollerInfo.scrollTop === 0
      ? 0
      : (scrollerInfo.scrollTop - topBufferDistance));
    let first_index_after_scroll_adjustment = realScrolltop === 0
      ? 0
      : Math$floor(realScrolltop / itemHeight);
    // if first index after scroll adjustment doesn't fit with number of possible view
    // it means the scroller has been too far down to the bottom and nolonger suitable to start from this index
    // rollback until all views fit into new collection, or until has enough collection item to render
    if (first_index_after_scroll_adjustment + newViewCount >= newArraySize) {
      first_index_after_scroll_adjustment = Math$max(0, newArraySize - newViewCount);
    }
    const top_buffer_item_count_after_scroll_adjustment = first_index_after_scroll_adjustment;
    const bot_buffer_item_count_after_scroll_adjustment = Math$max(0, newArraySize - top_buffer_item_count_after_scroll_adjustment - newViewCount);
    repeat._first
      = repeat._lastRebind = first_index_after_scroll_adjustment;
    repeat._previousFirst = firstIndex;
    repeat._isAtTop = first_index_after_scroll_adjustment === 0;
    repeat._isLastIndex = bot_buffer_item_count_after_scroll_adjustment === 0;
    repeat._topBufferHeight = top_buffer_item_count_after_scroll_adjustment * itemHeight;
    repeat._bottomBufferHeight = bot_buffer_item_count_after_scroll_adjustment * itemHeight;
    repeat._handlingMutations = false;
    // prevent scroller update
    repeat.revertScrollCheckGuard();
    repeat._updateBufferElements();
    updateAllViews(repeat, 0);
  }

  /**@internal */
  _isIndexBeforeViewSlot(repeat: VirtualRepeat, viewSlot: ViewSlot, index: number): boolean {
    const viewIndex = this._getViewIndex(repeat, viewSlot, index);
    return viewIndex < 0;
  }

  /**@internal */
  _isIndexAfterViewSlot(repeat: VirtualRepeat, viewSlot: ViewSlot, index: number): boolean {
    const viewIndex = this._getViewIndex(repeat, viewSlot, index);
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

    const topBufferItems = repeat._topBufferHeight / repeat.itemHeight;
    return Math$floor(index - topBufferItems);
  }
}
