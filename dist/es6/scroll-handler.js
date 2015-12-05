import {transient} from 'aurelia-framework';

@transient()
export class ScrollHandler{
  constructor(){
    this.timeConstant = 325;
    this.firefoxMultitude = 30;
    this.mouseMultitude = 1;
    this.keyStep = 120;
    this.pageStep = this.keyStep * 100;
    this.isFirefox = navigator.userAgent.indexOf('Firefox') > -1;
    this.hasKeyDown = 'onkeydown' in document;
    this.hasWheelEvent = 'onwheel' in document;
    this.hasMouseWheelEvent = 'onmousewheel' in document;

    this.wheelListener = e => this.wheel(e);
    this.mouseWheelListener = e => this.mouseWheel(e);
    this.touchStartListener = e => this.touchStart(e);
    this.touchMoveListener = e => this.touchMove(e);
    this.touchEndListener = e => this.touchEnd(e);
    this.keyDownListener = e => this.keyDown(e);
  }

  initialize(view, listener){
    this.listener = listener;
    this.view = view;

    if(this.hasWheelEvent){
      view.addEventListener("wheel", this.wheelListener);
    }

    if(this.hasMouseWheelEvent){
      view.addEventListener("mousewheel", this.mouseWheelListener);
    }

    if (typeof window.ontouchstart !== 'undefined') {
      view.addEventListener('touchstart', this.touchStartListener);
      view.addEventListener('touchmove', this.touchMoveListener);
      view.addEventListener('touchend', this.touchEndListener);
    }

    if(this.hasKeyDown){
      view.addEventListener("keydown", this.keyDownListener, false);
    }

    this.offset = 0;
    this.pressed = false;
  }

  dispose(){
    if (this.view) {
      this.view.removeEventListener("wheel", this.wheelListener);
      this.view.removeEventListener("mousewheel", this.mouseWheelListener);
      this.view.removeEventListener("touchstart", this.touchStartListener);
      this.view.removeEventListener("touchmove", this.touchMoveListener);
      this.view.removeEventListener("touchend", this.touchEndListener);
      this.view.removeEventListener("keydown", this.keyDownListener);
    }
  }

  ypos(event){
    if (event.targetTouches && (event.targetTouches.length >= 1)) {
      return event.targetTouches[0].clientY;
    }

    return event.clientY;
  }

  autoScroll() {
    var elapsed, delta;
    if (this.amplitude) {
      elapsed = Date.now() - this.timestamp;
      delta = this.amplitude * Math.exp(-elapsed / this.timeConstant);
      if (delta > 0.5 || delta < -0.5) {
        this.offset = this.listener(delta);
        requestAnimationFrame(() => this.autoScroll());
      }
    }
  }

  track() {
    var now, elapsed, delta, v;

    now = Date.now();
    elapsed = now - this.timestamp;
    this.timestamp = now;
    delta = this.offset - this.frame;
    this.frame = this.offset;

    v = 1000 * delta / (1 + elapsed);
    this.velocity = 0.3 * v + 0.2 * this.velocity;
  }

  touchMove(event) {
    var y, delta;
    if (this.pressed) {
      y = this.ypos(event);
      delta = this.reference - y;
      if (delta > 2 || delta < -2) {
        this.reference = y;
        this.offset = this.listener(-delta);
      }
    }
    event.preventDefault();
    event.stopPropagation();
    return false;
  }

  touchStart(event) {
    this.pressed = true;
    this.reference = this.ypos(event);

    this.velocity = this.amplitude = 0;
    this.frame = this.offset;
    this.timestamp = Date.now();
    clearInterval(this.ticker);
    this.ticker = setInterval(() => this.track(), 10);

    event.preventDefault();
    event.stopPropagation();
    return false;
  }

  touchEnd(event) {
    this.pressed = false;

    clearInterval(this.ticker);
    if (this.velocity > 10 || this.velocity < -10) {
      this.amplitude = 0.2 * this.velocity;
      this.target = Math.round(this.offset + this.amplitude);
      this.timestamp = Date.now();
      requestAnimationFrame(() => this.autoScroll());
    }

    event.preventDefault();
    event.stopPropagation();
    return false;
  }

  mouseWheel(event) {
    var delta = (event.wheelDeltaY) ? event.wheelDeltaY : event.wheelDelta;

    this.offset = this.listener(delta);
  }

  wheel(event) {
    var delta = event.wheelDeltaY || event.deltaY;

    if(this.isFirefox && event.deltaMode == 1) {
      delta *= this.firefoxMultitude;
      delta = -delta;
    }

    delta *= this.mouseMultitude;

    this.offset = this.listener(delta, true);
  }

  keyDown(event) {
    var delta = 0;
    switch(event.keyCode) {
      case 36: // Home key
        delta = Number.POSITIVE_INFINITY;
        break;
      case 35: // End key
        delta = Number.NEGATIVE_INFINITY;
        break;
      case 33: // Page up
        delta = this.pageStep;
        break;
      case 34: // Page down
        delta = -this.pageStep;
        break;
      case 38: // Up arrow
        delta = this.keyStep;
        break;
      case 40: // Down arrow
        delta = -this.keyStep;
        break;
    }

    this.offset = this.listener(delta);
  }
}
