import {ArrayRepeatStrategy} from 'aurelia-templating-resources/array-repeat-strategy';
import {createFullOverrideContext, updateOverrideContext, refreshBinding} from 'aurelia-templating-resources/repeat-utilities';
import {updateOverrideContexts, rebindAndMoveView} from './utilities';

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
    this._standardProcessInstanceMutated(repeat, array, splices);
  }

  _standardProcessInstanceMutated(repeat, array, splices) {
    let removeDelta = 0;
    let viewSlot = repeat.viewSlot;
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
      Promise.all(rmPromises).then(() => {
        this._handleAddedSplices(repeat, array, splices); 
        updateOverrideContexts(repeat, 0);    
      });
    } else {
      this._handleAddedSplices(repeat, array, splices);
      updateOverrideContexts(repeat, 0);
    }
  }
  
  _removeViewAt(repeat, collectionIndex, returnToCache){
    let viewOrPromise;
    let view;
    let viewSlot = repeat.viewSlot;
    let viewIndex = this._getViewIndex(repeat, viewSlot, collectionIndex);     
    
    if(viewIndex >= 0 && viewIndex <= viewSlot.children.length -1){
      viewOrPromise = viewSlot.removeAt(viewIndex, returnToCache);
      if(repeat.items >= viewSlot.children && repeat._bottomBufferHeight > repeat.itemHeight) {
        // TODO: do not trigger view lifecycle here        
        let index = repeat._getIndexOfLastView() + 1;
        let overrideContext = createFullOverrideContext(repeat, repeat.items[index], index, repeat.items.length);
        view = repeat.viewFactory.create();
        view.bind(overrideContext.bindingContext, overrideContext);    
        repeat._bottomBufferHeight = repeat._bottomBufferHeight - (repeat.itemHeight);                 
      } else {
        return viewOrPromise;
      }     
    } else if (viewIndex < 0) {
      // this is to correctly update override context      
      if(repeat._bottomBufferHeight > 0) {
        repeat._bottomBufferHeight = repeat._bottomBufferHeight - (repeat.itemHeight);
        rebindAndMoveView(repeat, viewSlot.children[0], viewSlot.children[0].overrideContext.$index, true);       
      } else { 
        repeat._topBufferHeight = repeat._topBufferHeight - (repeat.itemHeight);
      }      
    }
    
    if (viewOrPromise instanceof Promise) {
      viewOrPromise.then(() => {
        repeat.viewSlot.add(view);
        this._adjustBufferHeight(repeat); 
      });           
      return;      
    } else if(view) {         
      repeat.viewSlot.add(view);         
    } 
    
    this._adjustBufferHeight(repeat);       
  }
  
  _adjustBufferHeight(repeat) {
    /*if(repeat._bottomBufferHeight > 0) {      
      repeat._bottomBufferHeight = repeat._bottomBufferHeight - repeat.itemHeight;
    } else {
      repeat._topBufferHeight = repeat._topBufferHeight - repeat.itemHeight;
    }  */
    
    repeat._adjustBufferHeights(); 
  }
    
  _getViewIndex(repeat, viewSlot, index) {
    if(viewSlot.children.length === 0) {
      return -1;
    }
    let indexLow = viewSlot.children[0].overrideContext.$index;
    let viewIndex = index - indexLow;
    if(viewIndex > repeat._viewsLength - 1 || viewIndex < 0) {
      viewIndex = -1;
    }
    return viewIndex;
  }
  
  _isIndexInDom(viewSlot, index) {
    if(viewSlot.children.length === 0) {
      return false;
    }
    let indexLow = viewSlot.children[0].overrideContext.$index;
    let indexHi = viewSlot.children[viewSlot.children.length - 1].overrideContext.$index;
    return index >= indexLow && index <= indexHi;
  }  

  _handleAddedSplices(repeat, array, splices) {   
    let arrayLength = array.length;
    for (let i = 0, ii = splices.length; i < ii; ++i) {
      let splice = splices[i];
      let addIndex = splice.index;
      let end = splice.index + splice.addedCount;

      for (; addIndex < end; ++addIndex) {
        let overrideContext = createFullOverrideContext(repeat, array[addIndex], addIndex, arrayLength);
        let view = repeat.viewFactory.create();
        view.bind(overrideContext.bindingContext, overrideContext);
        repeat.viewSlot.insert(addIndex, view);
      }
    }
  } 
}
