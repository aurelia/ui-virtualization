import { RouterConfiguration, Router } from "aurelia-router";
import { PLATFORM } from "aurelia-pal";

export class PromiseGetMoreApp {

  router: Router;

  configureRouter(config: RouterConfiguration, router: Router) {
    config.map([
      {
        name: 'non-issues.main',
        route: ['', 'get-more-promise'],
        moduleId: PLATFORM.moduleName('./get-more-promise/sub-app'),
        nav: true,
        title: 'Get More + Promise'
      },
      {
        route: 'scroller-table-position-relative',
        moduleId: PLATFORM.moduleName('./scroller-relative-table/sub-app'),
        nav: true,
        title: 'Scroller + Table + Position Relative'
      },
      {
        route: 'scroller-div-position-relative',
        moduleId: PLATFORM.moduleName('./scroller-relative-div/sub-app'),
        nav: true,
        title: 'Scroller + Div + Position Relative'
      }
    ]).mapUnknownRoutes({
      redirect: '',
      name: 'non-issues.main'
    } as any);
    this.router = router;
  }
}
