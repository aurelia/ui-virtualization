'use strict';

System.register(['aurelia-dependency-injection', 'aurelia-pal', 'aurelia-templating', './utilities', './dom-helper'], function (_export, _context) {
  "use strict";

  var inject, Container, DOM, View, insertBeforeNode, DomHelper, _dec, _class, _dec2, _class2, TemplateStrategyLocator, TableStrategy, DefaultTemplateStrategy;

  

  return {
    setters: [function (_aureliaDependencyInjection) {
      inject = _aureliaDependencyInjection.inject;
      Container = _aureliaDependencyInjection.Container;
    }, function (_aureliaPal) {
      DOM = _aureliaPal.DOM;
    }, function (_aureliaTemplating) {
      View = _aureliaTemplating.View;
    }, function (_utilities) {
      insertBeforeNode = _utilities.insertBeforeNode;
    }, function (_domHelper) {
      DomHelper = _domHelper.DomHelper;
    }],
    execute: function () {
      _export('TemplateStrategyLocator', TemplateStrategyLocator = (_dec = inject(Container), _dec(_class = function () {
        function TemplateStrategyLocator(container) {
          

          this.container = container;
        }

        TemplateStrategyLocator.prototype.getStrategy = function getStrategy(element) {
          if (element.parentNode && element.parentNode.localName === 'tbody') {
            return this.container.get(TableStrategy);
          }
          return this.container.get(DefaultTemplateStrategy);
        };

        return TemplateStrategyLocator;
      }()) || _class));

      _export('TemplateStrategyLocator', TemplateStrategyLocator);

      _export('TableStrategy', TableStrategy = (_dec2 = inject(DomHelper), _dec2(_class2 = function () {
        function TableStrategy(domHelper) {
          

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

          this.domHelper = domHelper;
        }

        TableStrategy.prototype.getScrollContainer = function getScrollContainer(element) {
          return element.parentNode;
        };

        TableStrategy.prototype.moveViewFirst = function moveViewFirst(view, topBuffer) {
          var tbody = this._getTbodyElement(topBuffer.nextSibling);
          var tr = tbody.firstChild;
          var firstElement = DOM.nextElementSibling(tr);
          insertBeforeNode(view, firstElement);
        };

        TableStrategy.prototype.moveViewLast = function moveViewLast(view, bottomBuffer) {
          var lastElement = this.getLastElement(bottomBuffer).nextSibling;
          var referenceNode = lastElement.nodeType === 8 && lastElement.data === 'anchor' ? lastElement : lastElement;
          insertBeforeNode(view, referenceNode);
        };

        TableStrategy.prototype.createTopBufferElement = function createTopBufferElement(element) {
          var elementName = element.parentNode.localName === 'ul' ? 'li' : 'div';
          var buffer = DOM.createElement(elementName);
          var tableElement = element.parentNode.parentNode;
          tableElement.parentNode.insertBefore(buffer, tableElement);
          buffer.innerHTML = '&nbsp;';
          return buffer;
        };

        TableStrategy.prototype.createBottomBufferElement = function createBottomBufferElement(element) {
          var elementName = element.parentNode.localName === 'ul' ? 'li' : 'div';
          var buffer = DOM.createElement(elementName);
          var tableElement = element.parentNode.parentNode;
          tableElement.parentNode.insertBefore(buffer, tableElement.nextSibling);
          return buffer;
        };

        TableStrategy.prototype.removeBufferElements = function removeBufferElements(element, topBuffer, bottomBuffer) {
          topBuffer.parentNode.removeChild(topBuffer);
          bottomBuffer.parentNode.removeChild(bottomBuffer);
        };

        TableStrategy.prototype.getFirstElement = function getFirstElement(topBuffer) {
          var tbody = this._getTbodyElement(DOM.nextElementSibling(topBuffer));
          var tr = tbody.firstChild;
          return DOM.nextElementSibling(tr);
        };

        TableStrategy.prototype.getLastElement = function getLastElement(bottomBuffer) {
          var tbody = this._getTbodyElement(bottomBuffer.previousSibling);
          var trs = tbody.children;
          return trs[trs.length - 1];
        };

        TableStrategy.prototype.getTopBufferDistance = function getTopBufferDistance(topBuffer) {
          var tbody = this._getTbodyElement(topBuffer.nextSibling);
          return this.domHelper.getElementDistanceToTopOfDocument(tbody) - this.domHelper.getElementDistanceToTopOfDocument(topBuffer);
        };

        TableStrategy.prototype._getTbodyElement = function _getTbodyElement(tableElement) {
          var tbodyElement = void 0;
          var children = tableElement.children;
          for (var i = 0, ii = children.length; i < ii; ++i) {
            if (children[i].localName === 'tbody') {
              tbodyElement = children[i];
              break;
            }
          }
          return tbodyElement;
        };

        return TableStrategy;
      }()) || _class2));

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

        DefaultTemplateStrategy.prototype.getTopBufferDistance = function getTopBufferDistance(topBuffer) {
          return 0;
        };

        return DefaultTemplateStrategy;
      }());

      _export('DefaultTemplateStrategy', DefaultTemplateStrategy);
    }
  };
});