import { DOM, bindable, processContent, BehaviorInstruction, BindingEngine, Container } from 'aurelia-framework';
import { Person } from './Person';

@processContent(PeopleList.processColumns)
export class PeopleList {
  @bindable public people: Person[] = [];
  @bindable public nextChunkLoader: (bindingContext?: any) => Promise<any> = async () => {/**/};

  public static processColumns(_compiler, _resources, node: HTMLElement, instruction: BehaviorInstruction): boolean {
    const headerTemplate = DOM.createTemplateElement();
    headerTemplate.setAttribute('replace-part', 'headers');

    const rowTemplate = DOM.createTemplateElement();
    rowTemplate.setAttribute('replace-part', 'row');

    const columns = Array.from(node.querySelectorAll('list-column'));
    const headers: string[] = [];

    PeopleList.addDataCellTemplates(columns, headers, rowTemplate, node);
    PeopleList.addListHeaders(headers, columns, headerTemplate, instruction);

    node.appendChild(headerTemplate);
    node.appendChild(rowTemplate);

    return true;
  }

  private static addListHeaders(headers: string[], columns: Element[], headerTemplate: HTMLTemplateElement, instruction: BehaviorInstruction) {
    // add headers if header is available for all columns
    if (headers.length > 0 && headers.length === columns.length) {
      for (const header of headers) {
        const columnHeader = document.createElement('th');
        columnHeader.setAttribute('scope', 'col');
        columnHeader.innerText = header;
        headerTemplate.content.appendChild(columnHeader);
      }
      const bindingEngine: BindingEngine = Container.instance.get(BindingEngine);
      instruction.attributes = { ...instruction.attributes, 'show-header': bindingEngine.createBindingExpression('showHeader', 'true') };
    }
  }

  private static addDataCellTemplates(columns: Element[], headers: string[], rowTemplate: HTMLTemplateElement, node: HTMLElement) {
    for (const column of columns) {
      const header = column.getAttribute('header');
      const contentPath = column.getAttribute('contentPath');
      if (header) {
        headers.push(header);
      }
      const dataCell = document.createElement('td');
      const cellElements = (column.childNodes.length > 0)
        ? Array.from(column.childNodes)
        : [document.createTextNode(contentPath ? `\${item.${contentPath}}` : '')];
      cellElements.forEach(cell => dataCell.appendChild(cell));
      rowTemplate.content.appendChild(dataCell);
      node.removeChild(column);
    }
  }
}
