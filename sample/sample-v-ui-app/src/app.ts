import { Router, RouterConfiguration } from 'aurelia-router';
import { PLATFORM, View } from 'aurelia-framework';

export class App {
  router: Router;
  virtualRepeat: any;
  configureRouter(config: RouterConfiguration, router: Router) {
    config.title = 'Virtual Repeat';
    config.map([
      {
        route: ['', 'phone-list'],
        moduleId: PLATFORM.moduleName('./phone-list'),
        nav: true,
        title: 'Contacts'
      },
      {
        route: 'issue-21-69',
        moduleId: PLATFORM.moduleName('./issue-21-69/sub-app'),
        nav: true,
        title: 'Issue 21 + 69'
      },
      {
        route: 'issue-138',
        moduleId: PLATFORM.moduleName('./issue-138/sub-app'),
        nav: true,
        title: 'Issue 138'
      },
      {
        route: 'issue-129',
        moduleId: PLATFORM.moduleName('./issue-129/sub-app'),
        nav: true,
        title: 'Issue 129'
      },
      {
        route: 'issue-102',
        moduleId: PLATFORM.moduleName('./issue-102/sub-app'),
        nav: true,
        title: 'Issue 102'
      },
      {
        route: 'issue-97',
        moduleId: PLATFORM.moduleName('./issue-97/phone-list'),
        nav: true,
        title: 'Issue 97'
      },
      {
        route: 'issue-146',
        moduleId: PLATFORM.moduleName('./issue-146/sub-app', 'issue-146_bundle'),
        nav: true,
        title: 'Issue 146'
      },
      {
        route: 'issue-114',
        moduleId: PLATFORM.moduleName('./issue-114/contact-list'),
        nav: true,
        title: 'Issue 114'
      },
      // {
      //   route: 'issue-117',
      //   moduleId: PLATFORM.moduleName('./issue-117/sub-app'),
      //   nav: true,
      //   title: 'Issue 117'
      // },
      {
        route: 'non-issues',
        moduleId: PLATFORM.moduleName('./non-issues/sub-app'),
        nav: true,
        title: 'Non-Issues'
      },
      {
        route: 'contrived-examples',
        moduleId: PLATFORM.moduleName('./contrived/sub-app'),
        nav: true,
        title: 'Contrived Examples'
      }
    ]);

    this.router = router;
    window['app'] = this;
  }

  created(_: any, view: View) {
    window['view'] = view;
  }

  window = window;
}
