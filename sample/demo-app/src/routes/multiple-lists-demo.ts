import * as faker from 'faker';
import { IDemoItem } from './interfaces';

export class MultipleListsDemoRoute {

  objectArray: IDemoItem[];
  numberOfItems: number;
  isSelected: boolean;

  readonly parentElement: Element;

  constructor() {
    this.objectArray = [];
    this.numberOfItems = 1e3;
    this.isSelected = false;
  }

  createItem(): IDemoItem {
    let b = faker.name.findName();
    return {
      firstLetter: b.charAt(0),
      name: b,
      color: faker.internet.color(),
      phone: faker.phone.phoneNumber(),
      country: faker.address.country()
    };
  }

  activate() {
    for (let b = 0; b < this.numberOfItems; ++b) {
      this.objectArray.push(this.createItem());
    }
  }

  addItems(count: number) {
    for (let i = 0; count > i; ++i) {
      this.objectArray.push(this.createItem());
    }
  }

  addItemFirst() {
    this.objectArray.unshift(this.createItem());
  }

  removeItems(count: number) {
    this.objectArray.splice(0, count);
  }

  addItemLast() {
    this.objectArray.push(this.createItem());
  }

  removeLast() {
    this.objectArray.pop();
  }

  get itemsCount(): number {
    return this.objectArray.length;
  }

  get childrenCount(): number {
    return this.parentElement ? this.parentElement.children.length : 0;
  }

  click(item: IDemoItem) {
    console.log('clicked on', item);
  }
}
