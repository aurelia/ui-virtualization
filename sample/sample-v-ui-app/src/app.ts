import { Router, RouterConfiguration } from 'aurelia-router';
import { PLATFORM } from 'aurelia-framework';

export class App {
  router: Router;
  virtualRepeat: any;
  configureRouter(config: RouterConfiguration, router: Router) {
    config.title = 'Aurelia - Virtual Repeat';
    config.map([
      {
        route: ['', 'phone-list'],
        moduleId: PLATFORM.moduleName('./phone-list'),
        nav: true,
        title: 'Contacts'
      },
      {
        route: 'issue-138',
        moduleId: PLATFORM.moduleName('./issue-138/sub-app'),
        nav: true,
        title: 'Issue 138'
      }
    ]);

    this.router = router;
    window['app'] = this;
  }

  bind() {
    this.check();
  }

  check() {
    setInterval(() => {
      this.virtualRepeat = window['virtualRepeat'];
    }, 1500);
  }
}
