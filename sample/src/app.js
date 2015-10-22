import 'bootstrap';
import 'bootstrap/css/bootstrap.css!';

export class App {
  configureRouter(config, router){
    config.title = 'Aurelia - Virtual Repeat';
    config.map([
      { route: ['', 'phone-list'], moduleId: './phone-list', nav: false, title: 'Contacts' }
    ]);

    this.router = router;
  }
}
