import { observable } from 'aurelia-framework';
import { IDemoItem } from 'interfaces';
import * as faker from 'faker';

export class PhoneList {

  objectArray: IDemoItem[] = [];
  objectArray2 = [];
  objectArray3: IDemoItem[] = [];
  numberOfItems = 1000;
  isSelected = false;
  isVisible = true;
  selectedMarkup = 'div';

  @observable()
  value: string = '';

  toggle() {
    this.isVisible = !this.isVisible;
  }

  click() {
    console.log('click');
  }

  setIsSelected() {
    this.isSelected = true;
  }

  createItem(): IDemoItem {
    let name = faker.name.findName();
    return {
      firstLetter: name.charAt(0),
      name: name,
      color: faker.internet.color(),
      phone: faker.phone.phoneNumber(),
      country: faker.address.country()
    };
  }

  activate() {
    for (let i = 0; i < this.numberOfItems; ++i) {
      // this.objectArray.push(this.createItem(i));
      this.objectArray2.push(this.createItem());
      this.objectArray3.push(this.createItem());
    }
    this.objectArray = this.objectArray3.slice(0);
  }

  swap(): void {
    [this.objectArray3, this.objectArray2] = [this.objectArray2, this.objectArray3];
  }

  addItems(count: number): void {
    console.log(`adding ${count} items...`);
    for (let i = 0; i < count; ++i) {
      this.objectArray3.push(this.createItem());
    }
    console.log(`finsihed adding ${count} items`);
    this.numberOfItems = this.objectArray3.length;
  }

  addItem2() {
    let item = this.createItem();
    this.objectArray3.splice(1, 0, item);
  }

  addItemFirst(count = 10) {
    for (let i = 0; i < count; ++i) {
      this.objectArray3.unshift(this.createItem());
    }
  }

  removeItems(count: number) {
    this.objectArray3.splice(0, count);
  }

  unshift5() {
    this.objectArray3.unshift(this.createItem(), this.createItem(), this.createItem(), this.createItem(), this.createItem());
  }

  addItemLast() {
    this.objectArray3.push(this.createItem());
  }

  removeLast() {
    this.objectArray3.pop();
  }

  search () {
    let results = [];
    let value = this.value.toLowerCase();

    for (let i = 0; i < this.objectArray.length; i++) {
      let item = this.objectArray[i];

      if (item.name.toLowerCase().includes(value)) {
        results.push(item);
      }
    }

    this.objectArray3.splice.apply(this.objectArray3, [0, this.objectArray3.length].concat(results));
  }

  valueChanged() {
    console.log('%cSearch triggered', 'color:red');
    this.search();
  }
}
