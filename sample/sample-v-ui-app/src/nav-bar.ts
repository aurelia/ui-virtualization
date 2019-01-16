import {bindable, containerless} from 'aurelia-framework';

@containerless()
export class NavBar {
  @bindable()
  router = null;
}
