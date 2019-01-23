import { Container } from 'aurelia-dependency-injection';
import { ITemplateStrategy } from './interfaces';
import { DefaultTemplateStrategy } from './template-strategy-default';
import { TableBodyStrategy, TableRowStrategy } from './template-strategy-table';

export class TemplateStrategyLocator {

  /**@internal */
  static inject = [Container];

  /**@internal */
  container: Container;

  constructor(container: Container) {
    this.container = container;
  }

  /**
   * Selects the template strategy based on element hosting `virtual-repeat` custom attribute
   */
  getStrategy(element: Element): ITemplateStrategy {
    const parent = element.parentNode as Element;
    // Todo: should this ever happen?
    if (parent === null) {
      return this.container.get(DefaultTemplateStrategy);
    }
    const parentTagName = parent.tagName;
    // placed on tr, as it is automatically wrapped in a TBODY
    // if not wrapped, then it is already inside a thead or tfoot
    if (parentTagName === 'TBODY' || parentTagName === 'THEAD' || parentTagName === 'TFOOT') {
      return this.container.get(TableRowStrategy);
    }
    // place on a tbody/thead/tfoot
    if (parentTagName === 'TABLE') {
      return this.container.get(TableBodyStrategy);
    }
    // if (element.parentNode && (element.parentNode as Element).tagName === 'TBODY') {
    //   return this.container.get(TableStrategy);
    // }
    return this.container.get(DefaultTemplateStrategy);
  }
}
