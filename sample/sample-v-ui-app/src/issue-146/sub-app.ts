import { Users } from './data';

export class App {
  public users: any[] = [...Users];
  private order: number = 1;

  constructor() {
    window['subApp'] = this;
  }

  public sortById() {
    this.order = this.order === 1
      ? -1
      : 1;

    const sorted = [...Users].sort((a, b) => {
      if (a.id < b.id) {
        return -1 * this.order;
      }

      if (a.id > b.id) {
        return 1 * this.order;
      }

      return 0;
    });

    this.users = sorted;
  }

  public sortByLastName() {
    this.order = this.order === 1
      ? -1
      : 1;

    const sorted = [...Users].sort((a, b) => {
      if (a.lastName < b.lastName) {
        return -1 * this.order;
      }

      if (a.lastName > b.lastName) {
        return 1 * this.order;
      }

      return 0;
    });

    this.users = sorted;
  }

  public reduceTo(amount: number): void {
    this.users = Users.slice(0, amount);
  }
}
