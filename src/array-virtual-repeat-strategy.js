import {ArrayRepeatStrategy} from 'aurelia-templating-resources/array-repeat-strategy';
import {createFullOverrideContext, updateOverrideContexts, updateOverrideContext, refreshBinding} from 'aurelia-templating-resources/repeat-utilities';

/**
* A strategy for repeating a template over an array.
*/
export class ArrayVirtualRepeatStrategy extends ArrayRepeatStrategy {
  // create first item to calculate the heights
  createFirstItem(repeat) {
    var overrideContext = createFullOverrideContext(repeat, repeat.items[0], 0, 1);
    var view = repeat.viewFactory.create();
    view.bind(overrideContext.bindingContext, overrideContext);
    repeat.viewSlot.add(view);
  }
  /**
  * Handle the repeat's collection instance changing.
  * @param repeat The repeater instance.
  * @param items The new array instance.
  */
  instanceChanged(repeat, items) {
    if (repeat.viewsRequireLifecycle) {
      let removePromise = repeat.viewSlot.removeAll(true);
      if (removePromise instanceof Promise) {
        removePromise.then(() => this._standardProcessInstanceChanged(repeat, items));
        return;
      }
      this._standardProcessInstanceChanged(repeat, items);
      return;
    }
    this._inPlaceProcessItems(repeat, items);
  }

  _standardProcessInstanceChanged(repeat, items) {
    for(var i = 1, ii = repeat.numberOfDomElements; i < ii; ++i){
      let overrideContext = createFullOverrideContext(repeat, items[i], i, ii);
      let view = repeat.viewFactory.create();
      view.bind(overrideContext.bindingContext, overrideContext);
      repeat.viewSlot.add(view);
    }
  }

  _inPlaceProcessItems(repeat, items) {
    let itemsLength = items.length;
    let viewsLength = repeat.viewSlot.children.length;
    let first = repeat.first;
    // remove unneeded views.
    while (viewsLength > repeat.numberOfDomElements) {
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
      if (view.bindingContext[local] === items[i + first]
        && view.overrideContext.$middle === middle
        && view.overrideContext.$last === last) {
        // no changes. continue...
        continue;
      }
      // update the binding context and refresh the bindings.
      view.bindingContext[local] = items[i + first];
      view.overrideContext.$middle = middle;
      view.overrideContext.$last = last;
      let j = view.bindings.length;
      while (j--) {
        refreshBinding(view.bindings[j]);
      }
      j = view.controllers.length;
      while (j--) {
        let k = view.controllers[j].boundProperties.length;
        while (k--) {
          let binding = view.controllers[j].boundProperties[k].binding;
          refreshBinding(binding);
        }
      }
    }
    // add new views
    for (let i = viewsLength; i < repeat.numberOfDomElements; i++) {
      let overrideContext = createFullOverrideContext(repeat, items[i], i, itemsLength);
      let view = repeat.viewFactory.create();
      view.bind(overrideContext.bindingContext, overrideContext);
      repeat.viewSlot.add(view);
    }

    repeat._updateSizes();
  }

  /**
  * Handle the repeat's collection instance mutating.
  * @param repeat The repeat instance.
  * @param array The modified array.
  * @param splices Records of array changes.
  */
  instanceMutated(repeat, array, splices) {
    if (repeat.viewsRequireLifecycle) {
      this._standardProcessInstanceMutated(repeat, array, splices);
      return;
    }
    this._updateViews(repeat, repeat.items, splices);
  }

  _standardProcessInstanceMutated(repeat, array, splices) {
    let removeDelta = 0;
    let viewSlot = repeat.viewSlot;
    let rmPromises = [];

    for (let i = 0, ii = splices.length; i < ii; ++i) {
      let splice = splices[i];
      let removed = splice.removed;

      if (this._isIndexInViewSlot(viewSlot, splice.index)) {
        for (let j = 0, jj = removed.length; j < jj; ++j) {
          let viewOrPromise = viewSlot.removeAt(splice.index + removeDelta + rmPromises.length, true);

          // TODO Create view without trigger view lifecycle - or better solution
          let length = viewSlot.children.length;
          let overrideContext = createFullOverrideContext(repeat, repeat.items[length], length, repeat.items.length);
          let view = repeat.viewFactory.create();
          view.bind(overrideContext.bindingContext, overrideContext);
          repeat.viewSlot.isAttached = false;
          repeat.viewSlot.add(view);
          repeat.viewSlot.isAttached = true;

          if (viewOrPromise instanceof Promise) {
            rmPromises.push(viewOrPromise);
          }
        }
        removeDelta -= splice.addedCount;
       }
    }

    if (rmPromises.length > 0) {
      Promise.all(rmPromises).then(() => {
        this._handleAddedSplices(array, splices);
        repeat._updateViews(repeat, array, splices);
        repeat._updateSizes();
      });
    } else {
      this._handleAddedSplices(array, splices);
      this._updateViews(repeat, array, splices);
      repeat._updateSizes();
    }
  }

  _updateViews(repeat, items, splices) {
    var numberOfDomElements = repeat.numberOfDomElements,
      viewSlot = repeat.viewSlot,
      first = repeat.first,
      totalAdded = 0,
      view, i, ii, j, marginTop, addIndex, splice, end, atBottom;
    repeat.items = items;

    for(i = 0, ii = viewSlot.children.length; i < ii; ++i){
      view = viewSlot.children[i];
      view.bindingContext[repeat.local] = items[repeat.first + i];
      updateOverrideContext(view.overrideContext, repeat.first + i, items.length);
    }

    for(i = 0, ii = splices.length; i < ii; ++i){
      splice = splices[0];
      addIndex = splices[i].index;
      end = splice.index + splice.addedCount;
      totalAdded += splice.addedCount;

      for (; addIndex < end; ++addIndex) {
        if(addIndex < first + numberOfDomElements && !atBottom){
          marginTop = repeat.itemHeight * first + "px";
          repeat.virtualScrollInner.style.marginTop = marginTop;
        }
      }
    }

    if(items.length < numberOfDomElements){
      var limit = numberOfDomElements - (numberOfDomElements - items.length) - 1;
      for(j = 0; j < numberOfDomElements; ++j){
        repeat.virtualScrollInner.children[j].style.display = j >= limit ? 'none' : 'block';
      }
    }

    repeat._calcScrollViewHeight();
    repeat._calcIndicatorHeight();
    repeat.scrollIndicator();
  }

  _handleAddedSplices(repeat, array, splices) {
    let spliceIndex;
    let spliceIndexLow;
    let arrayLength = array.length;
    for (let i = 0, ii = splices.length; i < ii; ++i) {
      let splice = splices[i];
      let addIndex = spliceIndex = splice.index;
      let end = splice.index + splice.addedCount;

      if (typeof spliceIndexLow === 'undefined' || spliceIndexLow === null || spliceIndexLow > splice.index) {
        spliceIndexLow = spliceIndex;
      }

      for (; addIndex < end; ++addIndex) {
        let overrideContext = createFullOverrideContext(repeat, array[addIndex], addIndex, arrayLength);
        let view = repeat.viewFactory.create();
        view.bind(overrideContext.bindingContext, overrideContext);
        repeat.viewSlot.insert(addIndex, view);
      }
    }

    return spliceIndexLow;
  }

  _isIndexInViewSlot(viewSlot, index) {
    if(viewSlot.children.length === 0) {
      return false;
    }

    let indexLow = viewSlot.children[0].overrideContext.$index;
    let indexHi = viewSlot.children[viewSlot.children.length - 1].overrideContext.$index;

    return index >= indexLow && index <= indexHi;
  }
}
