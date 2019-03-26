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
  'Ford', 'Arthur', 'Trillian', 'Sneezy', 'Sleepy', 'Dopey', 'Doc', 'Happy', 'Bashful', 'Grumpy', 'Mufasa', 'Jørgen', 'Simba', 'Nala', 'Kiara', 'Kovu', 'Timon', 'Pumbaa', 'Rafiki', 'Shenzi'
];
const lNames = [
  // tslint:disable-next-line:max-line-length
  'Prefect', 'Dent', 'Astra', 'Adams', 'Baker', 'Clark', 'Davis', 'Evans', 'Frank', 'Ghosh', 'Hills', 'Irwin', 'Jones', 'Klein', 'Lopez', 'Mason', 'Nalty', 'Ochoa', 'Patel', 'Quinn', 'Reily', 'Smith', 'Trott', 'Usman', 'Valdo', 'White', 'Xiang', 'Yakub', 'Zafar'
];
export class PromiseGetMoreApp {
  private people: Person[];

  constructor() {
    this.people = [
      { fname: fNames[0], lname: lNames[0] },
      { fname: fNames[1], lname: lNames[1] },
      { fname: fNames[2], lname: lNames[2] }
    ];
    this.push30(undefined, 0);
  }

  public async push30(scrollContext?: IScrollContext, count = 30) {
    if (this.people.length < 200 && (!scrollContext || scrollContext.isAtBottom)) {
      for (let i = 0; i < count; i++) {
        this.people.push({
          fname: fNames[Math.floor(Math.random() * fNames.length)],
          lname: lNames[Math.floor(Math.random() * lNames.length)]
        });
      }
    }
    console.log('Population size:', this.people.length);
  }
}
