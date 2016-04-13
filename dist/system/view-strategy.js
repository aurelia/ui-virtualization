'use strict';

System.register(['aurelia-pal', './utilities'], function (_export, _context) {
  var DOM, insertBeforeNode, ViewStrategyLocator, TableStrategy, DefaultViewStrategy;

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  return {
    setters: [function (_aureliaPal) {
      DOM = _aureliaPal.DOM;
    }, function (_utilities) {
      insertBeforeNode = _utilities.insertBeforeNode;
    }],
    execute: function () {
      _export('ViewStrategyLocator', ViewStrategyLocator = function () {
        function ViewStrategyLocator() {
          _classCallCheck(this, ViewStrategyLocator);
        }

        ViewStrategyLocator.prototype.getStrategy = function getStrategy(element) {
          if (element.parentNode && element.parentNode.localName === 'tbody') {
            return new TableStrategy();
          }
          return new DefaultViewStrategy();
        };

        return ViewStrategyLocator;
      }());

      _export('ViewStrategyLocator', ViewStrategyLocator);

      _export('TableStrategy', TableStrategy = function () {
        function TableStrategy() {
          _classCallCheck(this, TableStrategy);
        }

        TableStrategy.prototype.getScrollContainer = function getScrollContainer(element) {
          return element.parentNode;
        };

        TableStrategy.prototype.moveViewFirst = function moveViewFirst(view, topBuffer) {
          insertBeforeNode(view, DOM.nextElementSibling(topBuffer.parentNode).previousSibling);
        };

        TableStrategy.prototype.moveViewLast = function moveViewLast(view, bottomBuffer) {
          insertBeforeNode(view, bottomBuffer.parentNode);
        };

        TableStrategy.prototype.createTopBufferElement = function createTopBufferElement(element) {
          var tr = DOM.createElement('tr');
          var buffer = DOM.createElement('td');
          buffer.setAttribute('style', 'height: 0px');
          tr.appendChild(buffer);
          element.parentNode.insertBefore(tr, element);
          return buffer;
        };

        TableStrategy.prototype.createBottomBufferElement = function createBottomBufferElement(element) {
          var tr = DOM.createElement('tr');
          var buffer = DOM.createElement('td');
          buffer.setAttribute('style', 'height: 0px');
          tr.appendChild(buffer);
          element.parentNode.insertBefore(tr, element.nextSibling);
          return buffer;
        };

        TableStrategy.prototype.removeBufferElements = function removeBufferElements(element, topBuffer, bottomBuffer) {
          element.parentNode.removeChild(topBuffer.parentNode);
          element.parentNode.removeChild(bottomBuffer.parentNode);
        };

        return TableStrategy;
      }());

      _export('TableStrategy', TableStrategy);

      _export('DefaultViewStrategy', DefaultViewStrategy = function () {
        function DefaultViewStrategy() {
          _classCallCheck(this, DefaultViewStrategy);
        }

        DefaultViewStrategy.prototype.getScrollContainer = function getScrollContainer(element) {
          return element.parentNode;
        };

        DefaultViewStrategy.prototype.moveViewFirst = function moveViewFirst(view, topBuffer) {
          insertBeforeNode(view, DOM.nextElementSibling(topBuffer).previousSibling);
        };

        DefaultViewStrategy.prototype.moveViewLast = function moveViewLast(view, bottomBuffer) {
          var previousSibling = bottomBuffer.previousSibling;
          var referenceNode = previousSibling.nodeType === 8 && previousSibling.data === 'anchor' ? previousSibling : bottomBuffer;
          insertBeforeNode(view, referenceNode);
        };

        DefaultViewStrategy.prototype.createTopBufferElement = function createTopBufferElement(element) {
          var elementName = element.parentNode.localName === 'ul' ? 'li' : 'div';
          var buffer = DOM.createElement(elementName);
          buffer.setAttribute('style', 'height: 0px');
          element.parentNode.insertBefore(buffer, element);
          return buffer;
        };

        DefaultViewStrategy.prototype.createBottomBufferElement = function createBottomBufferElement(element) {
          var elementName = element.parentNode.localName === 'ul' ? 'li' : 'div';
          var buffer = DOM.createElement(elementName);
          buffer.setAttribute('style', 'height: 0px');
          element.parentNode.insertBefore(buffer, element.nextSibling);
          return buffer;
        };

        DefaultViewStrategy.prototype.removeBufferElements = function removeBufferElements(element, topBuffer, bottomBuffer) {
          element.parentNode.removeChild(topBuffer);
          element.parentNode.removeChild(bottomBuffer);
        };

        return DefaultViewStrategy;
      }());

      _export('DefaultViewStrategy', DefaultViewStrategy);
    }
  };
});