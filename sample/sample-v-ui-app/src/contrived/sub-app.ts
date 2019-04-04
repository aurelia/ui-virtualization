import { RouterConfiguration, Router } from 'aurelia-router';
import { PLATFORM } from 'aurelia-pal';

export class ContrivedExamplesApp {

  router: Router = null;

  configureRouter(config: RouterConfiguration, router: Router) {
    config.map([
      {
        name: 'contrived.main',
        route: ['', 'empty-init'],
        moduleId: PLATFORM.moduleName('./empty-init/empty-init'),
        nav: true,
        title: 'Empty init collection'
      },
      {
        name: 'contrived.main2',
        route: 'empty-init-clone-value-converter',
        moduleId: PLATFORM.moduleName('./empty-init-clone-array/empty-init'),
        nav: true,
        title: 'Empty init collection + clone array value converter'
      },
      {
        route: 'multiple-lists-document',
        moduleId: PLATFORM.moduleName('./multiple-repeat-document/sub-app'),
        nav: true,
        title: 'Multiple lists on document'
      }
    ]).mapUnknownRoutes({
      redirect: '',
      name: 'contrived.main'
    } as any);
    this.router = router;
  }
}
