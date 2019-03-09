import './setup';
import { eachCartesianJoin } from "./lib";
import { getDistanceToParent } from "../src/utilities-dom";
import { PLATFORM } from 'aurelia-pal';
import { h } from './utilities';

fdescribe('utiltites - DOM', () => {
  
  const testCases: ITestCase[] = [
    {
      title: 'container without scrolling + buffer + child',
      template: `<div id="parent">
        <div id="topBuffer" style="height: 500px;"></div>
        <div id="child"></div>
      </div>`,
      spaceAssertions: [
        ['#child', '#parent', 500],
        ['#topBuffer', '#parent', 0]
      ],
      assert: (ct) => {
        const parent = ct.querySelector('#parent') as HTMLElement;
        const topBuffer = ct.querySelector('#topBuffer') as HTMLElement;
        const child = ct.querySelector('#child') as HTMLElement;
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
      spaceAssertions: [
        ['#child', '#parent', 500],
      ],
      assert: ct => {
        const parent = ct.querySelector('#parent') as HTMLElement;
        const topBuffer = ct.querySelector('#topBuffer') as HTMLElement;
        const child = ct.querySelector('#child') as HTMLElement;
        topBuffer.style.height = '1px';
        expect(getDistanceToParent(child, parent)).toEqual(1);
        ct.style.marginTop = '-50px';
        expect(getDistanceToParent(child, parent)).toEqual(1);
        topBuffer.insertAdjacentHTML('afterend', '<div style="height: 500px"></div>');
        expect(getDistanceToParent(child, parent)).toEqual(501);
      }
    },
    {
      title: 'parent[relative + scrolling] + buffer + child',
      template:
      `<div id="parent" style="position: relative; height: 200px; overflow-y: auto">
        <div style="height: 300px"></div>
        <div id="topBuffer" style="height: 400px"></div>
        <div id="child"></div>
      </div>`,
      spaceAssertions: [
        ['#child', '#parent', 700],
        ['#topBuffer', '#parent', 300]
      ]
    },
    {
      title: 'scroller > table > row',
      template: `<div id="parent" style="height: 300px; overflow-y: auto">
        <div style="height: 400px"></div>
        <table style="border-spacing: 0">
          <tr id="topBuffer" style="height: 600px"></tr>
          <tbody>
            <tr id="child"></tr>
          </tbody>
        </table>
      </div>`,
      spaceAssertions: [
        ['#child', '#parent', 1000],
        ['#topBuffer', '#parent', 400]
      ],
      assert: ct => {
        ct.scrollTop = 600;
        assertDistance(ct, '#child', '#parent', 1000);
        assertDistance(ct, '#topBuffer', '#parent', 400);
      }
    },
    {
      title: 'scroller > div[relative] > div > table > row',
      template: `<div id="parent" style="height: 300px; overflow-y: auto">
        <div style="height: 400px"></div>
        <div style="position: relative; height: 400px;">
          <div>
            <table style="border-spacing: 0">
              <tr id="topBuffer" style="height: 600px"></tr>
              <tbody>
                <tr id="child"></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>`,
      spaceAssertions: [
        ['#child', '#parent', 1000],
        ['#topBuffer', '#parent', 400]
      ],
      assert: ct => {
        ct.scrollTop = 800;
        assertDistance(ct, '#child', '#parent', 1000);
        assertDistance(ct, '#topBuffer', '#parent', 400);
      }
    },
    {
      title: 'scroller > #shadow-root > div',
      template: <div id="parent" style={{ height: 200, overflowY: 'auto' }}>
        <shadow-root>
          <div id="topBuffer" style={{ height: 500 }}></div>
          <div id="child"></div>
        </shadow-root>
      </div>,
      assert: ct => {
        const parent = ct.querySelector<HTMLElement>('#parent');
        expect(parent.shadowRoot).not.toEqual(null, '#parent > #shadow-root');
        const topBuffer = parent.shadowRoot.querySelector<HTMLElement>('#topBuffer');
        const child = parent.shadowRoot.querySelector<HTMLElement>('#child');
        assertDistance(ct, child, parent, 500);
        assertDistance(ct, topBuffer, parent, 0);
        expect(parent.scrollHeight).toEqual(500, '#parent.scrollHeight 1');
        topBuffer.style.height = '400px';
        assertDistance(ct, child, parent, 400);
        assertDistance(ct, topBuffer, parent, 0);
        expect(parent.scrollHeight).toEqual(400, '#parent.scrollHeight 2');
        parent.scrollTop = 200;
        assertDistance(ct, child, parent, 400);
        assertDistance(ct, topBuffer, parent, 0);
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
        assertDistance(ct, child, table, 500);
        assertDistance(ct, topBuffer, table, 0);
        assertDistance(ct, cell, table, 500);

        assertDistance(ct, child, parent, 500);
        assertDistance(ct, topBuffer, parent, 0);
        assertDistance(ct, cell, parent, 500);

        parent.insertAdjacentHTML('afterbegin', '<div style="height: 400px"></div>');
        assertDistance(ct, child, table, 500);
        assertDistance(ct, topBuffer, table, 0);
        assertDistance(ct, cell, table, 500);

        assertDistance(ct, child, parent, 500 + 400);
        assertDistance(ct, topBuffer, parent, 0 + 400);
        assertDistance(ct, cell, parent, 500 + 400);
      }
    }
  ];

  interface ITestCase {
    title: string;
    template: string | HTMLElement | HTMLElement[];
    spaceAssertions?: Array<[/*child selector*/string, /*parent selector*/string, /*supposed distance*/number]>
    assert?: (ct: HTMLDivElement) => void;
  }

  eachCartesianJoin(
    [testCases],
    ({ title, template, spaceAssertions = [], assert = PLATFORM.noop }) => {
      it(title, () => {
        const container = document.createElement('div');
        if (typeof template === 'string') {
          container.innerHTML = template;
        } else if (Array.isArray(template)) {
          template.forEach(t => container.appendChild(t));
        } else {
          container.appendChild(template);
        }
        document.body.appendChild(container);
        try {
          for (const [childSelector, parentSelector, distance] of spaceAssertions) {
            assertDistance(container, childSelector, parentSelector, distance);
          }
          assert(container);
        } finally {
          document.body.removeChild(container);
        }
      });
    }
  );

  const assertDistance = (ct: HTMLElement, child: string | HTMLElement, parent: string | HTMLElement, distance: number) => {
    expect(getDistanceToParent(
      typeof child === 'string' ? ct.querySelector(child) : child,
      typeof parent === 'string' ? ct.querySelector(parent) : parent,
    )).toEqual(distance, `${typeof child === 'string' ? child : child.tagName} <--${distance}px--> ${typeof parent === 'string' ? parent : parent.tagName}`);
  }
});
