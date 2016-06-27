'use strict';

System.register(['aurelia-pal', 'aurelia-templating', './utilities'], function (_export, _context) {
  "use strict";

  var DOM, View, insertBeforeNode, TemplateStrategyLocator, TableStrategy, DefaultTemplateStrategy;

  

  return {
    setters: [function (_aureliaPal) {
      DOM = _aureliaPal.DOM;
    }, function (_aureliaTemplating) {
      View = _aureliaTemplating.View;
    }, function (_utilities) {
      insertBeforeNode = _utilities.insertBeforeNode;
    }],
    execute: function () {
      _export('TemplateStrategyLocator', TemplateStrategyLocator = function () {
        function TemplateStrategyLocator() {
          
        }

        TemplateStrategyLocator.prototype.getStrategy = function getStrategy(element) {
          if (element.parentNode && element.parentNode.localName === 'tbody') {
            return new TableStrategy();
          }
          return new DefaultTemplateStrategy();
        };

        return TemplateStrategyLocator;
      }());

      _export('TemplateStrategyLocator', TemplateStrategyLocator);

      _export('TableStrategy', TableStrategy = function () {
        function TableStrategy() {
          

          this.tableCssReset = '\
    display: block;\
    width: auto;\
    height: auto;\
    margin: 0;\
    padding: 0;\
    border: none;\
    border-collapse: inherit;\
    border-spacing: 0;\
    background-color: transparent;\
    -webkit-border-horizontal-spacing: 0;\
    -webkit-border-vertical-spacing: 0;';
        }

        TableStrategy.prototype.getScrollContainer = function getScrollContainer(element) {
          return element.parentNode;
        };

        TableStrategy.prototype.moveViewFirst = function moveViewFirst(view, topBuffer) {
          insertBeforeNode(view, DOM.nextElementSibling(topBuffer.parentNode));
        };

        TableStrategy.prototype.moveViewLast = function moveViewLast(view, bottomBuffer) {
          var previousSibling = bottomBuffer.parentNode.previousSibling;
          var referenceNode = previousSibling.nodeType === 8 && previousSibling.data === 'anchor' ? previousSibling : bottomBuffer.parentNode;
          insertBeforeNode(view, referenceNode);
        };

        TableStrategy.prototype.createTopBufferElement = function createTopBufferElement(element) {
          var tr = DOM.createElement('tr');
          tr.setAttribute('style', this.tableCssReset);
          var buffer = DOM.createElement('td');
          buffer.setAttribute('style', this.tableCssReset);
          tr.appendChild(buffer);
          element.parentNode.insertBefore(tr, element);
          return buffer;
        };

        TableStrategy.prototype.createBottomBufferElement = function createBottomBufferElement(element) {
          var tr = DOM.createElement('tr');
          tr.setAttribute('style', this.tableCssReset);
          var buffer = DOM.createElement('td');
          buffer.setAttribute('style', this.tableCssReset);
          tr.appendChild(buffer);
          element.parentNode.insertBefore(tr, element.nextSibling);
          return buffer;
        };

        TableStrategy.prototype.removeBufferElements = function removeBufferElements(element, topBuffer, bottomBuffer) {
          element.parentNode.removeChild(topBuffer.parentNode);
          element.parentNode.removeChild(bottomBuffer.parentNode);
        };

        TableStrategy.prototype.getFirstElement = function getFirstElement(topBuffer) {
          var tr = topBuffer.parentNode;
          return DOM.nextElementSibling(tr);
        };

        TableStrategy.prototype.getLastElement = function getLastElement(bottomBuffer) {
          return bottomBuffer.parentNode.previousElementSibling;
        };

        return TableStrategy;
      }());

      _export('TableStrategy', TableStrategy);

      _export('DefaultTemplateStrategy', DefaultTemplateStrategy = function () {
        function DefaultTemplateStrategy() {
          
        }

        DefaultTemplateStrategy.prototype.getScrollContainer = function getScrollContainer(element) {
          return element.parentNode;
        };

        DefaultTemplateStrategy.prototype.moveViewFirst = function moveViewFirst(view, topBuffer) {
          insertBeforeNode(view, DOM.nextElementSibling(topBuffer));
        };

        DefaultTemplateStrategy.prototype.moveViewLast = function moveViewLast(view, bottomBuffer) {
          var previousSibling = bottomBuffer.previousSibling;
          var referenceNode = previousSibling.nodeType === 8 && previousSibling.data === 'anchor' ? previousSibling : bottomBuffer;
          insertBeforeNode(view, referenceNode);
        };

        DefaultTemplateStrategy.prototype.createTopBufferElement = function createTopBufferElement(element) {
          var elementName = element.parentNode.localName === 'ul' ? 'li' : 'div';
          var buffer = DOM.createElement(elementName);
          element.parentNode.insertBefore(buffer, element);
          return buffer;
        };

        DefaultTemplateStrategy.prototype.createBottomBufferElement = function createBottomBufferElement(element) {
          var elementName = element.parentNode.localName === 'ul' ? 'li' : 'div';
          var buffer = DOM.createElement(elementName);
          element.parentNode.insertBefore(buffer, element.nextSibling);
          return buffer;
        };

        DefaultTemplateStrategy.prototype.removeBufferElements = function removeBufferElements(element, topBuffer, bottomBuffer) {
          element.parentNode.removeChild(topBuffer);
          element.parentNode.removeChild(bottomBuffer);
        };

        DefaultTemplateStrategy.prototype.getFirstElement = function getFirstElement(topBuffer) {
          return DOM.nextElementSibling(topBuffer);
        };

        DefaultTemplateStrategy.prototype.getLastElement = function getLastElement(bottomBuffer) {
          return bottomBuffer.previousElementSibling;
        };

        return DefaultTemplateStrategy;
      }());

      _export('DefaultTemplateStrategy', DefaultTemplateStrategy);
    }
  };
});