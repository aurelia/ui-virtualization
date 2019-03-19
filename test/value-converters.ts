export class IdentityValueConverter {
  static $resource = {
    type: 'valueConverter',
    name: 'identity'
  };
  toView(val: any[]) {
    return val;
  }
}

export class CloneArrayValueConverter {
  static $resource = {
    type: 'valueConverter',
    name: 'cloneArray'
  };
  toView(val: any[]) {
    return Array.isArray(val) ? val.slice() : val;
  }
}
