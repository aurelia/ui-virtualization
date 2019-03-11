import { RouterConfiguration, Router } from "aurelia-router";
import { PLATFORM } from "aurelia-pal";

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
    ]).mapUnknownRoutes({
      redirect: '',
      name: 'contrived.main'
    } as any);
    this.router = router;
  }
}
