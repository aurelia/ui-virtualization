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
        nav: 1,
        title: 'Contacts'
      },
      {
        route: 'issue-138',
        moduleId: PLATFORM.moduleName('./issue-138/sub-app'),
        nav: 2,
        title: 'Issue 138'
      },
      {
        route: 'issue-129',
        moduleId: PLATFORM.moduleName('./issue-129/sub-app'),
        nav: 3,
        title: 'Issue 129'
      },
      {
        route: 'issue-102',
        moduleId: PLATFORM.moduleName('./issue-102/sub-app'),
        nav: 4,
        title: 'Issue 102'
      },
      {
        route: 'issue-97',
        moduleId: PLATFORM.moduleName('./issue-97/phone-list'),
        nav: 5,
        title: 'Issue 97'
      },
      {
        route: 'issue-97-fixed',
        moduleId: PLATFORM.moduleName('./issue-97-fixed/phone-list'),
        nav: 6,
        title: 'Issue 97 Fixed'
      }
    ]);

    this.router = router;
    window['app'] = this;
  }

  window = window;
}
