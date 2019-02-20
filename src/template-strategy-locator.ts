import { Container } from 'aurelia-dependency-injection';
import { ITemplateStrategy } from './interfaces';
import { DefaultTemplateStrategy } from './template-strategy-default';
import { TableBodyStrategy, TableRowStrategy } from './template-strategy-table';
import { ListTemplateStrategy } from './template-strategy-list';

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
    let parent = element.parentNode as Element;
    let container = this.container;
    // Todo: should this ever happen?
    if (parent === null) {
      return container.get(DefaultTemplateStrategy);
    }
    let parentTagName = parent.tagName;
    // placed on tr, as it is automatically wrapped in a TBODY
    // if not wrapped, then it is already inside a thead or tfoot
    if (parentTagName === 'TBODY' || parentTagName === 'THEAD' || parentTagName === 'TFOOT') {
      return container.get(TableRowStrategy);
    }
    // place on a tbody/thead/tfoot
    if (parentTagName === 'TABLE') {
      return container.get(TableBodyStrategy);
    }
    if (parentTagName === 'OL' || parentTagName === 'UL') {
      return container.get(ListTemplateStrategy);
    }
    return container.get(DefaultTemplateStrategy);
  }
}
