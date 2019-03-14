declare const faker: any;

export class PhoneList {

  objectArray = [];
  objectArray2 = [];
  numberOfItems = 1000;
  isSelected = false;
  isVisible = true;
  selectedMarkup = 'div';
  viewStrategy: any;

  setViewStrategy(strategy) {
    this.viewStrategy = strategy;
  }

  toggle() {
    this.isVisible = !this.isVisible;
  }

  click() {
    console.log('click');
  }

  setIsSelected() {
    this.isSelected = true;
  }

  createItem(index?: number) {
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
    let name;
    for (let i = 0; i < this.numberOfItems; ++i) {
      name = faker.name.findName();
      this.objectArray.push(this.createItem(i));
    }

    for (let i = 0; i < this.numberOfItems; ++i) {
      name = faker.name.findName();
      this.objectArray2.push(this.createItem());
    }
  }

  swap() {
    this.objectArray = this.objectArray2;
  }

  addItems(count) {
    console.log(`adding ${count} items...`);
    for (let i = 0; i < count; ++i) {
      this.objectArray.push(this.createItem(i));
    }
    console.log(`finsihed adding ${count} items`);
    this.numberOfItems = this.objectArray.length;
  }

  addItem2() {
    let item = this.createItem();
    this.objectArray.splice(1, 0, item);
  }

  addItemFirst(count = 10) {
    for (let i = 0; i < count; ++i) {
      this.objectArray.unshift(this.createItem());
    }
  }

  removeItems(count) {
    this.objectArray.splice(0, count);
  }

  unshift5() {
    this.objectArray.unshift(this.createItem(), this.createItem(), this.createItem(), this.createItem(), this.createItem());
  }

  addItemLast(count = 10) {
    while (count-- > 0) {
      this.objectArray.push(this.createItem());
    }
  }

  removeLast() {
    this.objectArray.pop();
  }
}
