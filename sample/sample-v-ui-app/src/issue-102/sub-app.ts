interface IScrollContext {
  isAtTop: boolean;
  isAtBottom: boolean;
  topIndex: number;
}

export interface Person {
  id: number;
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
let id = 1;
const getId = () => id++;
export class App {
  private people: Person[];

  constructor() {
    this.people = [
      { id: getId(), fname: fNames[0], lname: lNames[0] },
      { id: getId(), fname: fNames[1], lname: lNames[1] },
      { id: getId(), fname: fNames[2], lname: lNames[2] }
    ];
    this.push30(undefined, 0);
  }

  public push30(scrollContext?: IScrollContext, count = 30) {
    console.log('Issue-102 getting more...');
    // if (scrollContext) {
    //   console.log('Issue-129 getting more:', JSON.stringify(scrollContext, undefined, 2));
    // }
    if (!scrollContext || scrollContext.isAtBottom) {
      for (let i = 0; i < count; i++) {
        this.people.push({
          id: getId(),
          fname: fNames[Math.floor(Math.random() * fNames.length)],
          lname: lNames[Math.floor(Math.random() * lNames.length)]
        });
      }
    }
    console.log('Population size:', this.people.length);
  }
}
