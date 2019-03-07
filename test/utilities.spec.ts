import './setup';
import { eachCartesianJoin } from "./lib";
import { getDistanceToParent } from "../src/utilities-dom";

fdescribe('utiltites - DOM', () => {
  
  const testCases: ITestCase[] = [
    {
      title: 'basic scenario with no scrolling and child',
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
