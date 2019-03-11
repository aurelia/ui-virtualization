declare const faker: any;

export class PhoneList {

  objectArray = [];
  objectArray2 = [];
  objectArray3 = [];
  numberOfItems = 1000;
  isSelected = false;
  isVisible = true;
  selectedMarkup = 'div';
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
    // for (let i = 0; i < this.numberOfItems; ++i) {
    //   // this.objectArray.push(this.createItem(i));
    //   this.objectArray2.push(this.createItem());
    // }
    // this.objectArray3 = this.objectArray2.slice(0);
  }

  swap() {
    [this.objectArray3, this.objectArray2] = [this.objectArray2, this.objectArray3];
  }

  addItems(count) {
    console.log(`adding ${count} items...`);
    for (let i = 0; i < count; ++i) {
      this.objectArray3.push(this.createItem(i));
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

  removeItems(count) {
    this.objectArray3.splice(0, count);
  }

  unshift5() {
    this.objectArray3.unshift(this.createItem(), this.createItem(), this.createItem(), this.createItem(), this.createItem());
  }

  addItemLast(count = 10) {
    while (count-- > 0) {
      this.objectArray3.push(this.createItem());
    }
  }

  removeLast() {
    this.objectArray3.pop();
  }

  search () {
    let results = [];

    for (let i = 0; i < this.objectArray2.length; i++) {
      let item = this.objectArray2[i];

      if (item.name.toLowerCase().startsWith(this.value.toLowerCase())) {
        results.push(item);
      }
    }

    this.objectArray3.splice(0, this.objectArray3.length, ...results);
  }
}
