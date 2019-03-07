import './setup';
import { eachCartesianJoin } from "./lib";
import { getDistanceToParent } from "../src/utilities-dom";

describe('utiltites - DOM', () => {
  
  const testCases: ITestCase[] = [
    {
      title: 'container without scrolling + buffer + child',
      template: `<div id="parent">
        <div id="topBuffer" style="height: 500px;"></div>
        <div id="child"></div>
      </div>`,
      assert: (ct) => {
        const parent = ct.querySelector('#parent') as HTMLElement;
        const topBuffer = ct.querySelector('#topBuffer') as HTMLElement;
        const child = ct.querySelector('#child') as HTMLElement;
        expect(getDistanceToParent(child, parent)).toEqual(500);
        topBuffer.style.height = '1px';
        expect(getDistanceToParent(child, parent)).toEqual(1);
        ct.style.marginTop = '-50px';
        expect(getDistanceToParent(child, parent)).toEqual(1);
      }
    },
    {
      title: 'container with scrolling + buffer + child',
      template: `
      <div id="parent" style="height: 400px; overflow: auto">
        <div id="topBuffer" style="height: 500px;"></div>
        <div id="child"></div>
      </div>`,
      assert: ct => {
        const parent = ct.querySelector('#parent') as HTMLElement;
        const topBuffer = ct.querySelector('#topBuffer') as HTMLElement;
        const child = ct.querySelector('#child') as HTMLElement;
        expect(getDistanceToParent(child, parent)).toEqual(500);
        topBuffer.style.height = '1px';
        expect(getDistanceToParent(child, parent)).toEqual(1);
        ct.style.marginTop = '-50px';
        expect(getDistanceToParent(child, parent)).toEqual(1);
        topBuffer.insertAdjacentHTML('afterend', '<div style="height: 500px"></div>');
        expect(getDistanceToParent(child, parent)).toEqual(501);
      }
    },
    {
      title: [
        'container',
        '\t-- table [border-spacing:0]',
        '\t-- --> buffer',
        '\t-- --> row',
      ].join('\n'),
      template: `<div id="parent">
        <table id="table" style="border-spacing: 0">
          <tr id="topBuffer" style="height: 500px;"></tr>
          <tr id="child"><td id="cell">First cell</td></tr>
        </table>
      </div>`,
      assert: ct => {
        const parent = ct.querySelector('#parent') as HTMLElement;
        const topBuffer = ct.querySelector('#topBuffer') as HTMLElement;
        const table = ct.querySelector('#table') as HTMLElement;
        const child = ct.querySelector('#child') as HTMLElement;
        const cell = ct.querySelector('#cell') as HTMLElement;
        expect(getDistanceToParent(child, table)).toEqual(500);
        expect(getDistanceToParent(topBuffer, table)).toEqual(0);
        expect(getDistanceToParent(cell, table)).toEqual(500);
        
        expect(getDistanceToParent(child, parent)).toEqual(500);
        expect(getDistanceToParent(topBuffer, parent)).toEqual(0);
        expect(getDistanceToParent(cell, parent)).toEqual(500);

        parent.insertAdjacentHTML('afterbegin', '<div style="height: 400px"></div>');
        expect(getDistanceToParent(child, table)).toEqual(500);
        expect(getDistanceToParent(topBuffer, table)).toEqual(0);
        expect(getDistanceToParent(cell, table)).toEqual(500);
        
        expect(getDistanceToParent(child, parent)).toEqual(500 + 400);
        expect(getDistanceToParent(topBuffer, parent)).toEqual(0 + 400);
        expect(getDistanceToParent(cell, parent)).toEqual(500 + 400);
      }
    }
  ];

  interface ITestCase {
    title: string;
    template: string | HTMLElement | HTMLElement[];
    assert: (ct: HTMLDivElement) => void;
  }

  eachCartesianJoin(
    [testCases],
    ({ title, template, assert }) => {
      it(title, () => {
        const container = document.createElement('div');
        if (typeof template === 'string') {
          container.innerHTML = template;
        } else if (Array.isArray(template)) {
          template.forEach(t => container.appendChild(t));
        } else {
          container.appendChild(template.cloneNode(true));
        }
        document.body.appendChild(container);
        assert(container);
        document.body.removeChild(container);
      });
    }
  );
});
