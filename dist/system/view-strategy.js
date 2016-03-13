System.register(['./utilities'], function (_export) {
  'use strict';

  var insertBeforeNode, ViewStrategyLocator, TableStrategy, DefaultStrategy;

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

  return {
    setters: [function (_utilities) {
      insertBeforeNode = _utilities.insertBeforeNode;
    }],
    execute: function () {
      ViewStrategyLocator = (function () {
        function ViewStrategyLocator() {
          _classCallCheck(this, ViewStrategyLocator);
        }

        ViewStrategyLocator.prototype.getStrategy = function getStrategy(element) {
          if (element.parentNode.localName === 'tbody') {
            return new TableStrategy();
          } else {
            return new DefaultStrategy();
          }
        };

        return ViewStrategyLocator;
      })();

      _export('ViewStrategyLocator', ViewStrategyLocator);

      TableStrategy = (function () {
        function TableStrategy() {
          _classCallCheck(this, TableStrategy);
        }

        TableStrategy.prototype.getScrollList = function getScrollList(element) {
          return element.parentNode;
        };

        TableStrategy.prototype.getScrollContainer = function getScrollContainer(element) {
          return this.getScrollList(element).parentElement.parentElement;
        };

        TableStrategy.prototype.moveViewFirst = function moveViewFirst(view, scrollElement) {
          insertBeforeNode(view, scrollElement, scrollElement.childNodes[2]);
        };

        TableStrategy.prototype.moveViewLast = function moveViewLast(view, scrollElement, childrenLength) {
          insertBeforeNode(view, scrollElement, scrollElement.children[childrenLength + 1]);
        };

        TableStrategy.prototype.createTopBufferElement = function createTopBufferElement(scrollList, element) {
          var tr = document.createElement('tr');
          var buffer = document.createElement('td');
          buffer.setAttribute("style", "height: 0px");
          tr.appendChild(buffer);
          scrollList.insertBefore(tr, element);
          return buffer;
        };

        TableStrategy.prototype.createBottomBufferElement = function createBottomBufferElement(scrollList, element) {
          var tr = document.createElement('tr');
          var buffer = document.createElement('td');
          buffer.setAttribute("style", "height: 0px");
          tr.appendChild(buffer);
          element.parentNode.insertBefore(tr, element.nextSibling);
          return buffer;
        };

        TableStrategy.prototype.removeBufferElements = function removeBufferElements(scrollList, topBuffer, bottomBuffer) {
          scrollList.removeChild(topBuffer.parentElement);
          scrollList.removeChild(bottomBuffer.parentElement);
        };

        return TableStrategy;
      })();

      _export('TableStrategy', TableStrategy);

      DefaultStrategy = (function () {
        function DefaultStrategy() {
          _classCallCheck(this, DefaultStrategy);
        }

        DefaultStrategy.prototype.getScrollList = function getScrollList(element) {
          return element.parentNode;
        };

        DefaultStrategy.prototype.getScrollContainer = function getScrollContainer(element) {
          return this.getScrollList(element).parentElement;
        };

        DefaultStrategy.prototype.moveViewFirst = function moveViewFirst(view, scrollElement) {
          insertBeforeNode(view, scrollElement, scrollElement.childNodes[2]);
        };

        DefaultStrategy.prototype.moveViewLast = function moveViewLast(view, scrollElement, childrenLength) {
          insertBeforeNode(view, scrollElement, scrollElement.children[childrenLength + 1]);
        };

        DefaultStrategy.prototype.createTopBufferElement = function createTopBufferElement(scrollList, element) {
          var elementName = scrollList.localName === 'ul' ? 'li' : 'div';
          var buffer = document.createElement(elementName);
          buffer.setAttribute("style", "height: 0px");
          scrollList.insertBefore(buffer, element);
          return buffer;
        };

        DefaultStrategy.prototype.createBottomBufferElement = function createBottomBufferElement(scrollList, element) {
          var elementName = scrollList.localName === 'ul' ? 'li' : 'div';
          var buffer = document.createElement(elementName);
          buffer.setAttribute("style", "height: 0px");
          element.parentNode.insertBefore(buffer, element.nextSibling);
          return buffer;
        };

        DefaultStrategy.prototype.removeBufferElements = function removeBufferElements(scrollList, topBuffer, bottomBuffer) {
          scrollList.removeChild(topBuffer);
          scrollList.removeChild(bottomBuffer);
        };

        return DefaultStrategy;
      })();

      _export('DefaultStrategy', DefaultStrategy);
    }
  };
});