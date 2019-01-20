import { RouterConfiguration, Router } from 'aurelia-router';
import { PLATFORM } from 'aurelia-framework';

export class App {

  router: Router;

  configureRouter(config: RouterConfiguration, router: Router) {
    config.title = 'UI-Virtualization',
      config.map([
        {
          route: ['', 'list'],
          name: 'main.list',
          moduleId: PLATFORM.moduleName('./routes/list-demo'),
          nav: 1,
          title: 'Virtual List'
        },
        {
          route: 'multiple',
          name: 'main.multiple',
          moduleId: PLATFORM.moduleName('./routes/multiple-lists-demo'),
          nav: 2,
          title: 'Multiple Lists'
        },
        {
          route: 'container',
          name: 'main.container',
          moduleId: PLATFORM.moduleName('./routes/container-demo'),
          nav: 3,
          title: 'Container'
        }
      ]),
      this.router = router;
  }
}
