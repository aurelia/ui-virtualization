import { customAttribute, inject, bindable } from "aurelia-framework";

@inject(Element)
@customAttribute('scrollbar')
export class Scrollbar {

  value: 'vertical' | 'horizontal' | 'y' | 'x';

  constructor(private element: Element) {
    element.classList.add('sb');
    this.onWheel = this.onWheel.bind(this);
  }

  bind() {
    const element = this.element;
    const direction = this.value;
    const classList = element.classList;
    if (direction === 'horizontal' || direction === 'x') {
      classList.add('sb-x', 'text-nowrap');
      element.addEventListener('wheel', this.onWheel);
    } else {
      classList.add('sb-y');
    }
  }

  unbind() {
    this.element.removeEventListener('wheel', this.onWheel);
  }

  onWheel(e: WheelEvent) {
    if (!e.shiftKey && e.deltaY) {
      (e.currentTarget as HTMLElement).scrollLeft += e.deltaY;
      return false;
    }
    return true;
  }
}