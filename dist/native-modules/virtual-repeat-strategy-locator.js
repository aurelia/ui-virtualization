

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

import { RepeatStrategyLocator } from 'aurelia-templating-resources';
import { ArrayVirtualRepeatStrategy } from './array-virtual-repeat-strategy';

export var VirtualRepeatStrategyLocator = function (_RepeatStrategyLocato) {
  _inherits(VirtualRepeatStrategyLocator, _RepeatStrategyLocato);

  function VirtualRepeatStrategyLocator() {
    

    var _this = _possibleConstructorReturn(this, _RepeatStrategyLocato.call(this));

    _this.matchers = [];
    _this.strategies = [];

    _this.addStrategy(function (items) {
      return items instanceof Array;
    }, new ArrayVirtualRepeatStrategy());
    return _this;
  }

  return VirtualRepeatStrategyLocator;
}(RepeatStrategyLocator);