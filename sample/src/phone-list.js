export class PhoneList {

  constructor() {
    this.objectArray = [];
    this.objectArray2 = [];
    this.numberOfItems = 100;
    this.isSelected = false;
    this.isVisible = true;
    this.viewStrategy = 'div';
  }

  setViewStrategy(strategy){
    this.viewStrategy = strategy;
  }

  toggle() {
    this.isVisible = !this.isVisible;
  }

  click(){
    console.log('click');
  }

  setIsSelected(){
    this.isSelected = true;
  }

  createItem(index){
    var name = faker.name.findName();
    return {
      firstLetter: name.charAt(0),
      name: index + ' ' + name,
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
      this.objectArray.push(this.createItem(i));
    }

    for (var i = 0; i < this.numberOfItems; ++i) {
      name = faker.name.findName();
      this.objectArray2.push(this.createItem());
    }
  }

  swap(){
    this.objectArray = this.objectArray2;
  }

  addItems(count){
    for (var i = 0; i < count; ++i) {
      this.objectArray.push(this.createItem(i));
      console.log(i);
    }

    this.numberOfItems = this.objectArray.length;
  }

  addItem2(){
    var item = this.createItem();
    this.objectArray.splice(1, 0, item);
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

  addItemLast(){
    this.objectArray.push(this.createItem());
  }

  removeLast() {
    this.objectArray.pop();
  }
}
