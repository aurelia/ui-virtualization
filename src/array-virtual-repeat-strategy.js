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
    this._inPlaceProcessItems(repeat, items);
  }

  _standardProcessInstanceChanged(repeat, items) {
    for(var i = 1, ii = repeat._viewsLength; i < ii; ++i){
      let overrideContext = createFullOverrideContext(repeat, items[i], i, ii);
      let view = repeat.viewFactory.create();
      view.bind(overrideContext.bindingContext, overrideContext);
      repeat.viewSlot.add(view);
    }
  }

  _inPlaceProcessItems(repeat, items) {
    let itemsLength = items.length;
    let viewsLength = repeat.viewSlot.children.length;
    let first = repeat._first;
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
    for (let i = viewsLength; i < repeat._viewsLength; i++) {
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
    this._updateViews(repeat, repeat.items, splices);
  }

  _standardProcessInstanceMutated(repeat, array, splices) {
    let removeDelta = 0;
    let viewSlot = repeat.viewSlot;
    let rmPromises = [];

    for (let i = 0, ii = splices.length; i < ii; ++i) {
      let splice = splices[i];
      let removed = splice.removed;
      let viewIndex = this._getViewIndex(repeat, viewSlot, splice.index);
      if (viewIndex >= 0) {
        for (let j = 0, jj = removed.length; j < jj; ++j) {
          let viewOrPromise = viewSlot.removeAt(viewIndex + removeDelta + rmPromises.length, true);

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
        this._handleAddedSplices(repeat, array, splices);
        this._updateViews(repeat, array, splices);
      });
    } else {
      this._handleAddedSplices(repeat, array, splices);
      this._updateViews(repeat, array, splices);
    }
  }

  _updateViews(repeat, items, splices) {
    let totalAdded = 0;
    let totalRemoved = 0;
    repeat.items = items;

    for(let i = 0, ii = splices.length; i < ii; ++i){
      let splice = splices[0];
      totalAdded += splice.addedCount;
      totalRemoved += splice.removed.length;
    }

    let index = repeat._getIndexOfFirstView() - totalRemoved;

    if(index < 0) {
      index = 0;
    }

    let  viewSlot = repeat.viewSlot;

    for(let i = 0, ii = viewSlot.children.length; i < ii; ++i){
      let view = viewSlot.children[i];
      let nextIndex = index + i;
      let itemsLength = items.length;
      if((nextIndex) <= itemsLength - 1) {
        view.bindingContext[repeat.local] = items[nextIndex];
        updateOverrideContext(view.overrideContext, nextIndex, itemsLength);
      }
    }

    let bufferDelta = repeat.itemHeight * totalAdded + repeat.itemHeight * -totalRemoved;

    if(repeat._bottomBufferHeight + bufferDelta < 0) {
      repeat._topBufferHeight = repeat._topBufferHeight + bufferDelta;
    } else {
      repeat._bottomBufferHeight = repeat._bottomBufferHeight + bufferDelta;
    }

    if(repeat._bottomBufferHeight > 0) {
      repeat.isLastIndex = false;
    }

    repeat._adjustBufferHeights();
  }

  _handleAddedSplices(repeat, array, splices) {
    let spliceIndexLow;
    let arrayLength = array.length;
    for (let i = 0, ii = splices.length; i < ii; ++i) {
      let splice = splices[i];
      let addIndex = splice.index;
      let end = splice.index + splice.addedCount;

      if (typeof spliceIndexLow === 'undefined' || spliceIndexLow === null || spliceIndexLow > splice.index) {
        spliceIndexLow = addIndex;
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

  _isIndexInDom(viewSlot, index) {
    if(viewSlot.children.length === 0) {
      return false;
    }

    let indexLow = viewSlot.children[0].overrideContext.$index;
    let indexHi = viewSlot.children[viewSlot.children.length - 1].overrideContext.$index;

    return index >= indexLow && index <= indexHi;
  }

  _getViewIndex(repeat, viewSlot, index) {
    if(viewSlot.children.length === 0) {
      return -1;
    }
    let indexLow = viewSlot.children[0].overrideContext.$index;
    let viewIndex = index - indexLow;
    if(viewIndex > repeat._viewsLength - 1) {
      viewIndex = -1;
    }
    return viewIndex;
  }
}
