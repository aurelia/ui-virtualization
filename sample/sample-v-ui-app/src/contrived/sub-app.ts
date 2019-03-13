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
        title: 'Empty init collection + Infinite get-more'
      },
      {
        name: 'contrived.main2',
        route: 'empty-init-clone-value-converter',
        moduleId: PLATFORM.moduleName('./empty-init-clone-array/empty-init'),
        nav: true,
        title: 'Empty init collection + clone array value converter'
      }
    ]).mapUnknownRoutes({
      redirect: '',
      name: 'contrived.main'
    } as any);
    this.router = router;
  }
}
