import { BehaviorInstruction } from 'aurelia-framework';

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

export class App {

  static $resource = {
    processContent: (_, __, ___, behaviorInstruction: BehaviorInstruction) => {
      behaviorInstruction.inheritBindingContext = false;
      return true;
    }
  };

  private people: Person[];

  constructor() {
    this.people = [
      { fname: fNames[0], lname: lNames[0] },
      { fname: fNames[1], lname: lNames[1] },
      { fname: fNames[2], lname: lNames[2] }
    ];
    this.push30(undefined, 5);
    window['subapp'] = this;
  }

  public push30(scrollContext?: IScrollContext, count = 30) {
    console.log('Issue-129 getting more...');
    // if (scrollContext) {
    //   console.log('Issue-129 getting more:', JSON.stringify(scrollContext, undefined, 2));
    // }
    if (!scrollContext || scrollContext.isAtBottom) {
      for (let i = 0; i < count; i++) {
        this.people.push({
          fname: fNames[Math.floor(Math.random() * fNames.length)],
          lname: lNames[Math.floor(Math.random() * lNames.length)]
        });
      }
    }
    else if (scrollContext && scrollContext.isAtTop) {
      for (let i = 0; i < count; i++) {
        this.people.unshift({
          fname: fNames[Math.floor(Math.random() * fNames.length)],
          lname: lNames[Math.floor(Math.random() * lNames.length)]
        });
      }
    }
    console.log('Population size:', this.people.length);
  }
}
