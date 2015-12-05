define(['exports', 'aurelia-framework'], function (exports, _aureliaFramework) {
  'use strict';

  exports.__esModule = true;

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

  var ScrollHandler = (function () {
    function ScrollHandler() {
      var _this = this;

      _classCallCheck(this, _ScrollHandler);

      this.timeConstant = 325;
      this.firefoxMultitude = 30;
      this.mouseMultitude = 1;
      this.keyStep = 120;
      this.pageStep = this.keyStep * 100;
      this.isFirefox = navigator.userAgent.indexOf('Firefox') > -1;
      this.hasKeyDown = 'onkeydown' in document;
      this.hasWheelEvent = 'onwheel' in document;
      this.hasMouseWheelEvent = 'onmousewheel' in document;

      this.wheelListener = function (e) {
        return _this.wheel(e);
      };
      this.mouseWheelListener = function (e) {
        return _this.mouseWheel(e);
      };
      this.touchStartListener = function (e) {
        return _this.touchStart(e);
      };
      this.touchMoveListener = function (e) {
        return _this.touchMove(e);
      };
      this.touchEndListener = function (e) {
        return _this.touchEnd(e);
      };
      this.keyDownListener = function (e) {
        return _this.keyDown(e);
      };
    }

    ScrollHandler.prototype.initialize = function initialize(view, listener) {
      this.listener = listener;
      this.view = view;

      if (this.hasWheelEvent) {
        view.addEventListener("wheel", this.wheelListener);
      }

      if (this.hasMouseWheelEvent) {
        view.addEventListener("mousewheel", this.mouseWheelListener);
      }

      if (typeof window.ontouchstart !== 'undefined') {
        view.addEventListener('touchstart', this.touchStartListener);
        view.addEventListener('touchmove', this.touchMoveListener);
        view.addEventListener('touchend', this.touchEndListener);
      }

      if (this.hasKeyDown) {
        view.addEventListener("keydown", this.keyDownListener, false);
      }

      this.offset = 0;
      this.pressed = false;
    };

    ScrollHandler.prototype.dispose = function dispose() {
      if (this.view) {
        this.view.removeEventListener("wheel", this.wheelListener);
        this.view.removeEventListener("mousewheel", this.mouseWheelListener);
        this.view.removeEventListener("touchstart", this.touchStartListener);
        this.view.removeEventListener("touchmove", this.touchMoveListener);
        this.view.removeEventListener("touchend", this.touchEndListener);
        this.view.removeEventListener("keydown", this.keyDownListener);
      }
    };

    ScrollHandler.prototype.ypos = function ypos(event) {
      if (event.targetTouches && event.targetTouches.length >= 1) {
        return event.targetTouches[0].clientY;
      }

      return event.clientY;
    };

    ScrollHandler.prototype.autoScroll = function autoScroll() {
      var _this2 = this;

      var elapsed, delta;
      if (this.amplitude) {
        elapsed = Date.now() - this.timestamp;
        delta = this.amplitude * Math.exp(-elapsed / this.timeConstant);
        if (delta > 0.5 || delta < -0.5) {
          this.offset = this.listener(delta);
          requestAnimationFrame(function () {
            return _this2.autoScroll();
          });
        }
      }
    };

    ScrollHandler.prototype.track = function track() {
      var now, elapsed, delta, v;

      now = Date.now();
      elapsed = now - this.timestamp;
      this.timestamp = now;
      delta = this.offset - this.frame;
      this.frame = this.offset;

      v = 1000 * delta / (1 + elapsed);
      this.velocity = 0.3 * v + 0.2 * this.velocity;
    };

    ScrollHandler.prototype.touchMove = function touchMove(event) {
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
    };

    ScrollHandler.prototype.touchStart = function touchStart(event) {
      var _this3 = this;

      this.pressed = true;
      this.reference = this.ypos(event);

      this.velocity = this.amplitude = 0;
      this.frame = this.offset;
      this.timestamp = Date.now();
      clearInterval(this.ticker);
      this.ticker = setInterval(function () {
        return _this3.track();
      }, 10);

      event.preventDefault();
      event.stopPropagation();
      return false;
    };

    ScrollHandler.prototype.touchEnd = function touchEnd(event) {
      var _this4 = this;

      this.pressed = false;

      clearInterval(this.ticker);
      if (this.velocity > 10 || this.velocity < -10) {
        this.amplitude = 0.2 * this.velocity;
        this.target = Math.round(this.offset + this.amplitude);
        this.timestamp = Date.now();
        requestAnimationFrame(function () {
          return _this4.autoScroll();
        });
      }

      event.preventDefault();
      event.stopPropagation();
      return false;
    };

    ScrollHandler.prototype.mouseWheel = function mouseWheel(event) {
      var delta = event.wheelDeltaY ? event.wheelDeltaY : event.wheelDelta;

      this.offset = this.listener(delta);
    };

    ScrollHandler.prototype.wheel = function wheel(event) {
      var delta = event.wheelDeltaY || event.deltaY;

      if (this.isFirefox && event.deltaMode == 1) {
        delta *= this.firefoxMultitude;
        delta = -delta;
      }

      delta *= this.mouseMultitude;

      this.offset = this.listener(delta, true);
    };

    ScrollHandler.prototype.keyDown = function keyDown(event) {
      var delta = 0;
      switch (event.keyCode) {
        case 36:
          delta = Number.POSITIVE_INFINITY;
          break;
        case 35:
          delta = Number.NEGATIVE_INFINITY;
          break;
        case 33:
          delta = this.pageStep;
          break;
        case 34:
          delta = -this.pageStep;
          break;
        case 38:
          delta = this.keyStep;
          break;
        case 40:
          delta = -this.keyStep;
          break;
      }

      this.offset = this.listener(delta);
    };

    var _ScrollHandler = ScrollHandler;
    ScrollHandler = _aureliaFramework.transient()(ScrollHandler) || ScrollHandler;
    return ScrollHandler;
  })();

  exports.ScrollHandler = ScrollHandler;
});