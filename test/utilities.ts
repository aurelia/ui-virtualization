import { VirtualRepeat } from '../src/virtual-repeat';
import { ITestAppInterface } from './interfaces';

export type AsyncQueue = (func: (...args: any[]) => any) => void;

export function createAssertionQueue(): AsyncQueue {
  let queue: Array<() => any> = [];
  let next = () => {
    if (queue.length) {
      setTimeout(() => {
        if (queue.length > 0) {
          let func = queue.shift();
          func();
          next();
        }
      }, 16);
    }
  };

  return (func: () => any) => {
    if (queue.push(func) === 1) {
      next();
    }
  };
}

/**
 *
 * @param extraHeight height of static content that contributes to overall heigh. Happen in case of table
 */
export function validateState(virtualRepeat: VirtualRepeat, viewModel: ITestAppInterface<any>, itemHeight: number, extraHeight?: number) {
  let views = virtualRepeat.viewSlot.children;
  let expectedHeight = viewModel.items.length * itemHeight;
  let topBufferHeight = virtualRepeat.topBufferEl.getBoundingClientRect().height;
  let bottomBufferHeight = virtualRepeat.bottomBufferEl.getBoundingClientRect().height;
  let renderedItemsHeight = views.length * itemHeight;
  expect(topBufferHeight + renderedItemsHeight + bottomBufferHeight).toBe(
    expectedHeight,
    `Top buffer (${topBufferHeight}) + items height (${renderedItemsHeight}) + bottom buffer (${bottomBufferHeight}) should have been correct`
  );

  if (viewModel.items.length > views.length) {
    expect(topBufferHeight + bottomBufferHeight).toBeGreaterThan(0);
  }

  // validate contextual data
  for (let i = 0; i < views.length; i++) {
    const view = views[i];
    const itemIndex = viewModel.items.indexOf(view.bindingContext.item);
    expect(views[i].bindingContext.item).toBe(viewModel.items[i], `view[${i}].bindingContext.item === items[${i}]`);
    let overrideContext = views[i].overrideContext;
    expect(overrideContext.parentOverrideContext.bindingContext).toBe(viewModel);
    expect(overrideContext.bindingContext).toBe(views[i].bindingContext);
    let first = i === 0;
    let last = i === viewModel.items.length - 1;
    let even = i % 2 === 0;
    expect(overrideContext.$index).toBe(i, `[item:${itemIndex} -- view:${i}]overrideContext.$index`);
    expect(overrideContext.$first).toBe(first, `[item:${itemIndex} -- view:${i}]overrideContext.$first`);
    expect(overrideContext.$last).toBe(last, `[item:${itemIndex} -- view:${i}]overrideContext.$last`);
    expect(overrideContext.$middle).toBe(!first && !last, `[item:${itemIndex} -- view:${i}]overrideContext.$middle`);
    expect(overrideContext.$odd).toBe(!even, `[item:${itemIndex} -- view:${i}]overrideContext.$odd`);
    expect(overrideContext.$even).toBe(even, `[item:${itemIndex} -- view:${i}]overrideContext.$even`);
  }
}

/**
 * Validate states of views of a virtual repeat, based on viewModel and number of items of it, together with height of each item
 */
export function validateScrolledState(virtualRepeat: VirtualRepeat, viewModel: ITestAppInterface<any>, itemHeight: number, extraTitle?: string) {
  let views = virtualRepeat.viewSlot.children;
  let expectedHeight = viewModel.items.length * itemHeight;
  let topBufferHeight = virtualRepeat.topBufferEl.getBoundingClientRect().height;
  let bottomBufferHeight = virtualRepeat.bottomBufferEl.getBoundingClientRect().height;
  let renderedItemsHeight = views.length * itemHeight;
  expect(topBufferHeight + renderedItemsHeight + bottomBufferHeight).toBe(
    expectedHeight,
    `${extraTitle
        ? `${extraTitle} + `
        : ''
    }Top buffer (${topBufferHeight}) + items height (${renderedItemsHeight}) + bottom buffer (${bottomBufferHeight}) should have been correct`
  );

  if (viewModel.items.length > views.length) {
    expect(topBufferHeight + bottomBufferHeight).toBeGreaterThan(0);
  }

  if (!Array.isArray(viewModel.items) || viewModel.items.length < 0) {
    expect(virtualRepeat._first).toBe(0, `${extraTitle}repeat._first === 0 <when 0 | null | undefined>`);
    expect(virtualRepeat.viewCount()).toBe(0, `${extraTitle}items.length === 0 | null | undefined`);
    return;
  }

  // validate contextual data
  let startingLoc = viewModel.items && viewModel.items.length > 0
    ? viewModel.items.indexOf(views[0].bindingContext.item)
    : 0;
  // let i = 0;
  // let ii = Math.min(viewModel.items.length - startingLoc, views.length);
  for (let i = startingLoc; i < views.length; i++) {
    // thanks to @reinholdk for the following line
    // it correctly handles view index & itemIndex for assertion
    let itemIndex = startingLoc + i;
    expect(views[i].bindingContext.item).toBe(viewModel.items[itemIndex], `view[${i}].bindingContext.item === items[${itemIndex}]`);
    // expect(views[i].bindingContext.item).toBe(viewModel.items[i], `view(${i}).bindingContext.item`);
    let overrideContext = views[i].overrideContext;
    expect(overrideContext.parentOverrideContext.bindingContext).toBe(viewModel, 'parentOverrideContext.bindingContext === viewModel');
    expect(overrideContext.bindingContext).toBe(views[i].bindingContext, `overrideContext sync`);
    // let first = i === 0;
    // let last = i === viewModel.items.length - 1;
    // let even = i % 2 === 0;
    // expect(overrideContext.$index).toBe(i);
    let first = itemIndex === 0;
    let last = itemIndex === viewModel.items.length - 1;
    let even = itemIndex % 2 === 0;
    expect(overrideContext.$index).toBe(itemIndex, `[item:${itemIndex} -- view:${i}]overrideContext.$index`);
    expect(overrideContext.$first).toBe(first, `[item:${itemIndex} -- view:${i}]overrideContext.$first`);
    expect(overrideContext.$last).toBe(last, `[item:${itemIndex} -- view:${i}]overrideContext.$last`);
    expect(overrideContext.$middle).toBe(!first && !last, `[item:${itemIndex} -- view:${i}]overrideContext.$middle`);
    expect(overrideContext.$odd).toBe(!even, `[item:${itemIndex} -- view:${i}]overrideContext.$odd`);
    expect(overrideContext.$even).toBe(even, `[item:${itemIndex} -- view:${i}]overrideContext.$even`);
  }
}

/**
 * Manually dispatch a scroll event and validate scrolled state of virtual repeat
 *
 * Programatically set `scrollTop` of element specified with `elementSelector` query string
 * (or `#scrollContainer` by default) to be equal with its `scrollHeight`
 */
export function validateScroll(virtualRepeat: VirtualRepeat, viewModel: any, itemHeight: number, element: Element, done: Function): void {
  let event = new Event('scroll');
  element.scrollTop = element.scrollHeight;
  element.dispatchEvent(event);
  window.setTimeout(() => {
    window.requestAnimationFrame(() => {
      validateScrolledState(virtualRepeat, viewModel, itemHeight);
      done();
    });
  });
}

export function scrollRepeat(virtualRepeat: VirtualRepeat, dest: 'start' | 'end' | number): void {
  const scroller = virtualRepeat.getScroller();
  scroller.scrollTop = dest === 'start'
    ? 0
    : dest === 'end'
      ? scroller.scrollHeight
      : dest;
}

/**
 * Scroll a virtual repeat scroller element to top
 */
export async function scrollToStart(virtualRepeat: VirtualRepeat, insuranceTime = 5): Promise<void> {
  virtualRepeat.getScroller().scrollTop = 0;
  await ensureScrolled(insuranceTime);
}

/**
 * Scroll a virtual repeat scroller element to bottom
 */
export async function scrollToEnd(virtualRepeat: VirtualRepeat, insuranceTime = 5): Promise<void> {
  let element = virtualRepeat._fixedHeightContainer ? virtualRepeat.scrollerEl : (document.scrollingElement || document.documentElement);
  element.scrollTop = element.scrollHeight;
  createScrollEvent(element);
  await ensureScrolled(insuranceTime);
}

export async function scrollToIndex(virtualRepeat: VirtualRepeat, itemIndex: number): Promise<void> {
  let element = virtualRepeat._fixedHeightContainer ? virtualRepeat.scrollerEl : (document.scrollingElement || document.documentElement);
  element.scrollTop = virtualRepeat.itemHeight * (itemIndex + 1);
  createScrollEvent(element);
  await ensureScrolled();
}

/**
 * Wait for a small time for repeat to finish processing.
 *
 * Default to 10
 */
export async function ensureScrolled(time: number = 10): Promise<void> {
  await waitForNextFrame();
  await waitForTimeout(time);
}


export function waitForTimeout(time = 1): Promise<void> {
  return new Promise(r => setTimeout(r, time));
}

export function waitForNextFrame(): Promise<void> {
  return new Promise(r => requestAnimationFrame(() => r()));
}

export async function waitForFrames(count = 1): Promise<void> {
  while (count --) {
    await waitForNextFrame();
  }
}

export function createScrollEvent(target: EventTarget): void {
  target.dispatchEvent(new Event('scroll'));
}

const kebabCaseLookup: Record<string, string> = {};
const kebabCase =  (input: string): string => {
  // benchmark: http://jsben.ch/v7K9T
  let value = kebabCaseLookup[input];
  if (value !== undefined) {
    return value;
  }
  value = '';
  let first = true;
  let char: string, lower: string;
  for (let i = 0, ii = input.length; i < ii; ++i) {
    char = input.charAt(i);
    lower = char.toLowerCase();
    value = value + (first ? lower : (char !== lower ? `-${lower}` : lower));
    first = false;
  }
  return kebabCaseLookup[input] = value;
};

const eventCmds = { delegate: 1, capture: 1, call: 1 };

/**
 * jsx with aurelia binding command friendly version of h
 */
export const h = (name: string, attrs: Record<string, string> | null, ...children: (Node | string | (Node | string)[])[]) => {
  const el = name === 'shadow-root'
    ? document.createDocumentFragment()
    : document.createElement(name === 'let$' ? 'let' : name);

  if (attrs !== null) {
    let value: string | string[] | object;
    let len: number;
    for (const attr in attrs) {
      value = attrs[attr];
      // if attr is class or its alias
      // split up by splace and add to element via classList API
      if (attr === 'class' || attr === 'className' || attr === 'cls') {
        value = value === undefined || value === null
          ? []
          : Array.isArray(value)
            ? value
            : ('' + value).split(' ');
        (el as Element).classList.add(...value as string[]);
      }
      else if (attr === 'style') {
        if (typeof value === 'object') {
          Object.keys(value).forEach(styleKey => {
            const styleValue = value[styleKey];
            (el as HTMLElement).style[styleKey] = typeof styleValue === 'number' ? styleValue + 'px' : styleValue;
          });
        } else if (typeof value === 'string') {
          (el as HTMLElement).style.cssText = value;
        } else {
          throw new Error('Invalid style value. Expected string/object, received: ' + typeof value);
        }
      }
      // for attributes with matching properties, simply assign
      // other if special attribute like data, or ones start with _
      // assign as well
      else if (attr in el || attr === 'data' || attr[0] === '_') {
        el[attr] = value;
      }
      // if it's an asElement attribute, camel case it
      else if (attr === 'asElement') {
        (el as Element).setAttribute('as-element', value);
      }
      // ortherwise do fallback check
      else {
        // is it an event handler?
        if (attr[0] === 'o' && attr[1] === 'n' && !attr.endsWith('$')) {
          const decoded = kebabCase(attr.slice(2));
          const parts = decoded.split('-');
          if (parts.length > 1) {
            const lastPart = parts[parts.length - 1];
            const cmd = eventCmds[lastPart] ? lastPart : 'trigger';
            (el as Element).setAttribute(`${parts.slice(0, -1).join('-')}.${cmd}`, value);
          } else {
            (el as Element).setAttribute(`${parts[0]}.trigger`, value);
          }
        } else {
          const len = attr.length;
          const parts = attr.split('$');
          if (parts.length === 1) {
            (el as Element).setAttribute(kebabCase(attr), value);
          } else {
            if (parts[parts.length - 1] === '') {
              parts[parts.length - 1] = 'bind';
            }
            (el as Element).setAttribute(parts.map(kebabCase).join('.'), value);
          }
        }
      }
    }
  }
  const appender = (el instanceof HTMLTemplateElement) ? el.content : el;
  for (const child of children) {
    if (child === null || child === undefined) {
      continue;
    }
    if (Array.isArray(child)) {
      for (const child_child of child) {
        if (child_child instanceof Node) {
          if (isFragment(child_child) && !isFragment(appender)) {
            if (!appender.shadowRoot) {
              appender.attachShadow({ mode: 'open' });
            }
            appender.shadowRoot.appendChild(child_child);
          } else {
            appender.appendChild(child_child);
          }
        } else {
          appender.appendChild(document.createTextNode('' + child_child));
        }
      }
    } else {
      if (child instanceof Node) {
        if (isFragment(child) && !isFragment(appender)) {
          if (!appender.shadowRoot) {
            appender.attachShadow({ mode: 'open' });
          }
          appender.shadowRoot.appendChild(child);
        } else {
          appender.appendChild(child);
        }
      } else {
        appender.appendChild(document.createTextNode('' + child));
      }
    }
  }
  return el;
};

const isFragment = (node: Node): node is DocumentFragment => node.nodeType === Node.DOCUMENT_FRAGMENT_NODE;

/**
 * Based on repet comment anchor/top/bot buffer elements
 * count the number of active elements (or views) a repeat has
 */
export const getRepeatActiveViewCount = (repeat: VirtualRepeat): number => {
  let count = 0;
  let curr = repeat.templateStrategy.getFirstElement(repeat.topBufferEl, repeat.bottomBufferEl);
  while (curr !== null) {
    count++;
    curr = curr.nextElementSibling;
    if (curr === repeat.bottomBufferEl) {
      break;
    }
  }
  return count;
};
