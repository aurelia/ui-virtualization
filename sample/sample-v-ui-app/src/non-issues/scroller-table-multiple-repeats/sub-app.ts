interface IScrollContext {
  isAtTop: boolean;
  isAtBottom: boolean;
  topIndex: number;
}

export interface Person {
  fname: string;
  lname: string;
}

const fNames = [
  // tslint:disable-next-line:max-line-length
  'Ford', 'Arthur', 'Trillian', 'Sneezy', 'Sleepy', 'Dopey', 'Doc', 'Happy', 'Bashful', 'Grumpy', 'Mufasa', 'Sarabi', 'Simba', 'Nala', 'Kiara', 'Kovu', 'Timon', 'Pumbaa', 'Rafiki', 'Shenzi'
];
const lNames = [
  // tslint:disable-next-line:max-line-length
  'Prefect', 'Dent', 'Astra', 'Adams', 'Baker', 'Clark', 'Davis', 'Evans', 'Frank', 'Ghosh', 'Hills', 'Irwin', 'Jones', 'Klein', 'Lopez', 'Mason', 'Nalty', 'Ochoa', 'Patel', 'Quinn', 'Reily', 'Smith', 'Trott', 'Usman', 'Valdo', 'White', 'Xiang', 'Yakub', 'Zafar'
];
export class PromiseGetMoreApp {
  public people1: Person[];
  public people2: Person[];

  constructor() {
    this.people1 = [];
    this.people2 = [];
    
    this.push(this.people1, 100);
    this.push(this.people2, 200);
  }

  public async push(group: Person[], count = 30) {
    for (let i = 0; i < count; i++) {
      group.push({
        fname: fNames[Math.floor(Math.random() * fNames.length)],
        lname: lNames[Math.floor(Math.random() * lNames.length)]
      });
    }
  }
}
