define(['exports', './utilities'], function (exports, _utilities) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.DefaultStrategy = exports.TableStrategy = exports.ViewStrategyLocator = undefined;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  var ViewStrategyLocator = exports.ViewStrategyLocator = function () {
    function ViewStrategyLocator() {
      _classCallCheck(this, ViewStrategyLocator);
    }

    ViewStrategyLocator.prototype.getStrategy = function getStrategy(element) {
      if (element.parentNode.localName === 'tbody') {
        return new TableStrategy();
      }
      return new DefaultStrategy();
    };

    return ViewStrategyLocator;
  }();

  var TableStrategy = exports.TableStrategy = function () {
    function TableStrategy() {
      _classCallCheck(this, TableStrategy);
    }

    TableStrategy.prototype.getScrollContainer = function getScrollContainer(element) {
      return element.parentNode;
    };

    TableStrategy.prototype.moveViewFirst = function moveViewFirst(view, topBuffer) {
      (0, _utilities.insertBeforeNode)(view, topBuffer.parentElement.nextElementSibling.previousSibling);
    };

    TableStrategy.prototype.moveViewLast = function moveViewLast(view, bottomBuffer) {
      (0, _utilities.insertBeforeNode)(view, bottomBuffer.parentElement);
    };

    TableStrategy.prototype.createTopBufferElement = function createTopBufferElement(element) {
      var tr = document.createElement('tr');
      var buffer = document.createElement('td');
      buffer.setAttribute('style', 'height: 0px');
      tr.appendChild(buffer);
      element.parentElement.insertBefore(tr, element);
      return buffer;
    };

    TableStrategy.prototype.createBottomBufferElement = function createBottomBufferElement(element) {
      var tr = document.createElement('tr');
      var buffer = document.createElement('td');
      buffer.setAttribute('style', 'height: 0px');
      tr.appendChild(buffer);
      element.parentNode.insertBefore(tr, element.nextSibling);
      return buffer;
    };

    TableStrategy.prototype.removeBufferElements = function removeBufferElements(scrollList, topBuffer, bottomBuffer) {
      scrollList.removeChild(topBuffer.parentElement);
      scrollList.removeChild(bottomBuffer.parentElement);
    };

    return TableStrategy;
  }();

  var DefaultStrategy = exports.DefaultStrategy = function () {
    function DefaultStrategy() {
      _classCallCheck(this, DefaultStrategy);
    }

    DefaultStrategy.prototype.getScrollContainer = function getScrollContainer(element) {
      return element.parentNode;
    };

    DefaultStrategy.prototype.moveViewFirst = function moveViewFirst(view, topBuffer) {
      (0, _utilities.insertBeforeNode)(view, topBuffer.nextElementSibling.previousSibling);
    };

    DefaultStrategy.prototype.moveViewLast = function moveViewLast(view, bottomBuffer) {
      (0, _utilities.insertBeforeNode)(view, bottomBuffer);
    };

    DefaultStrategy.prototype.createTopBufferElement = function createTopBufferElement(element) {
      var elementName = element.parentElement.localName === 'ul' ? 'li' : 'div';
      var buffer = document.createElement(elementName);
      buffer.setAttribute('style', 'height: 0px');
      element.parentElement.insertBefore(buffer, element);
      return buffer;
    };

    DefaultStrategy.prototype.createBottomBufferElement = function createBottomBufferElement(element) {
      var elementName = element.parentElement.localName === 'ul' ? 'li' : 'div';
      var buffer = document.createElement(elementName);
      buffer.setAttribute('style', 'height: 0px');
      element.parentNode.insertBefore(buffer, element.nextSibling);
      return buffer;
    };

    DefaultStrategy.prototype.removeBufferElements = function removeBufferElements(element, topBuffer, bottomBuffer) {
      element.removeChild(topBuffer);
      element.removeChild(bottomBuffer);
    };

    return DefaultStrategy;
  }();
});