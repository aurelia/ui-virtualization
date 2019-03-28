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
      },
      {
        route: 'scroller-table-multiple-repeats',
        moduleId: PLATFORM.moduleName('./scroller-table-multiple-repeats/sub-app'),
        nav: true,
        title: 'Scroller + Table + Position Relative + Multiple Repeats'
      },
      {
        route: 'scroller-not-first-parent-div',
        moduleId: PLATFORM.moduleName('./scroller-not-first-parent-div/sub-app'),
        nav: true,
        title: 'Scroller (not first parent) + Div'
      }
    ]).mapUnknownRoutes({
      redirect: '',
      name: 'non-issues.main'
    } as any);
    this.router = router;
  }

  onWheel(e: WheelEvent) {
    if (!e.shiftKey && e.deltaY) {
      (e.currentTarget as HTMLElement).scrollLeft += e.deltaY;
      return false;
    }
    return true;
  }
}
