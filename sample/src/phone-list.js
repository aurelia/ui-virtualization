export class PhoneList {

  constructor() {
    this.objectArray = [];
    this.numberOfItems = 20;
    this.isSelected = false;
  }

  setIsSelected(){
    this.isSelected = true;
  }

  createItem(){
    var name = faker.name.findName();
    return {
      firstLetter: name.charAt(0),
      name: name,
      color: faker.internet.color(),
      //image: faker.image.avatar(),
      //email: faker.internet.email(),
      phone: faker.phone.phoneNumber(),
      country: faker.address.country()
    };
  }

  activate(){
    var name;
    for (var i = 0; i < this.numberOfItems; ++i) {
      name = faker.name.findName();
      this.objectArray.push(this.createItem());
    }
  }

  addItems(count){
    for (var i = 0; i < count; ++i) {
      this.objectArray.push(this.createItem());
    }

    this.numberOfItems = this.objectArray.length;
  }

  addItem2(){
    var item = this.createItem();
    this.objectArray.splice(1, 0, item);
  }

  addItem(){
    this.objectArray.push(this.createItem());
  }

  addItemFirst(){
    this.objectArray.unshift(this.createItem());
  }

  removeItems(count){
    this.objectArray.splice(0, count);
  }

  unshift5(){
    this.objectArray.unshift(this.createItem(),this.createItem(),this.createItem(),this.createItem(),this.createItem());
  }
}
