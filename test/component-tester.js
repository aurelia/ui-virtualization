import {bootstrap} from 'aurelia-bootstrapper';

export const StageComponent = {
  withResources(resources): ComponentTester {
    return new ComponentTester().withResources(resources);
  }
};

export class ComponentTester {
  _html: string;
  _resources: string | string[] = [];
  _bindingContext: any;
  _configure = aurelia => aurelia.use.standardConfiguration();
  cleanUp;
  element;
  sut;
  viewModel;
  aurelia;

  bootstrap(configure: (aurelia: Aurelia) => void) {
    this._configure = configure;
  }

  withResources(resources): ComponentTester {
    this._resources = resources;
    return this;
  }

  inView(html): ComponentTester {
    this._html = html;
    return this;
  }

  boundTo(bindingContext): ComponentTester {
    this._bindingContext = bindingContext;
    return this;
  }

  create(): Promise<void> {
    return bootstrap(aurelia => {
      return Promise.resolve(this._configure(aurelia)).then(() => {
        aurelia.use.globalResources(this._resources);

        return aurelia.start().then(a => {
          let host = document.createElement('div');
          host.innerHTML = this._html;
          document.body.appendChild(host);
          let x = aurelia.enhance(this._bindingContext, host);
          this.sut = aurelia.root.controllers[0].viewModel;
          this.viewModel = aurelia.root.bindingContext;
          this.element = host.firstElementChild;
          this.cleanUp = () => host.parentNode.removeChild(host);
        });
      });
    });
  }
}