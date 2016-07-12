define(['exports', 'aurelia-dependency-injection', 'aurelia-pal', 'aurelia-templating', './utilities', './dom-helper'], function (exports, _aureliaDependencyInjection, _aureliaPal, _aureliaTemplating, _utilities, _domHelper) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.DefaultTemplateStrategy = exports.TableStrategy = exports.TemplateStrategyLocator = undefined;

  

  var _dec, _class, _dec2, _class2;

  var TemplateStrategyLocator = exports.TemplateStrategyLocator = (_dec = (0, _aureliaDependencyInjection.inject)(_aureliaDependencyInjection.Container), _dec(_class = function () {
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
  }()) || _class);
  var TableStrategy = exports.TableStrategy = (_dec2 = (0, _aureliaDependencyInjection.inject)(_domHelper.DomHelper), _dec2(_class2 = function () {
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
      var firstElement = _aureliaPal.DOM.nextElementSibling(tr);
      (0, _utilities.insertBeforeNode)(view, firstElement);
    };

    TableStrategy.prototype.moveViewLast = function moveViewLast(view, bottomBuffer) {
      var lastElement = this.getLastElement(bottomBuffer).nextSibling;
      var referenceNode = lastElement.nodeType === 8 && lastElement.data === 'anchor' ? lastElement : lastElement;
      (0, _utilities.insertBeforeNode)(view, referenceNode);
    };

    TableStrategy.prototype.createTopBufferElement = function createTopBufferElement(element) {
      var elementName = element.parentNode.localName === 'ul' ? 'li' : 'div';
      var buffer = _aureliaPal.DOM.createElement(elementName);
      var tableElement = element.parentNode.parentNode;
      tableElement.parentNode.insertBefore(buffer, tableElement);
      buffer.innerHTML = '&nbsp;';
      return buffer;
    };

    TableStrategy.prototype.createBottomBufferElement = function createBottomBufferElement(element) {
      var elementName = element.parentNode.localName === 'ul' ? 'li' : 'div';
      var buffer = _aureliaPal.DOM.createElement(elementName);
      var tableElement = element.parentNode.parentNode;
      tableElement.parentNode.insertBefore(buffer, tableElement.nextSibling);
      return buffer;
    };

    TableStrategy.prototype.removeBufferElements = function removeBufferElements(element, topBuffer, bottomBuffer) {
      topBuffer.parentNode.removeChild(topBuffer);
      bottomBuffer.parentNode.removeChild(bottomBuffer);
    };

    TableStrategy.prototype.getFirstElement = function getFirstElement(topBuffer) {
      var tbody = this._getTbodyElement(_aureliaPal.DOM.nextElementSibling(topBuffer));
      var tr = tbody.firstChild;
      return _aureliaPal.DOM.nextElementSibling(tr);
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
  }()) || _class2);

  var DefaultTemplateStrategy = exports.DefaultTemplateStrategy = function () {
    function DefaultTemplateStrategy() {
      
    }

    DefaultTemplateStrategy.prototype.getScrollContainer = function getScrollContainer(element) {
      return element.parentNode;
    };

    DefaultTemplateStrategy.prototype.moveViewFirst = function moveViewFirst(view, topBuffer) {
      (0, _utilities.insertBeforeNode)(view, _aureliaPal.DOM.nextElementSibling(topBuffer));
    };

    DefaultTemplateStrategy.prototype.moveViewLast = function moveViewLast(view, bottomBuffer) {
      var previousSibling = bottomBuffer.previousSibling;
      var referenceNode = previousSibling.nodeType === 8 && previousSibling.data === 'anchor' ? previousSibling : bottomBuffer;
      (0, _utilities.insertBeforeNode)(view, referenceNode);
    };

    DefaultTemplateStrategy.prototype.createTopBufferElement = function createTopBufferElement(element) {
      var elementName = element.parentNode.localName === 'ul' ? 'li' : 'div';
      var buffer = _aureliaPal.DOM.createElement(elementName);
      element.parentNode.insertBefore(buffer, element);
      return buffer;
    };

    DefaultTemplateStrategy.prototype.createBottomBufferElement = function createBottomBufferElement(element) {
      var elementName = element.parentNode.localName === 'ul' ? 'li' : 'div';
      var buffer = _aureliaPal.DOM.createElement(elementName);
      element.parentNode.insertBefore(buffer, element.nextSibling);
      return buffer;
    };

    DefaultTemplateStrategy.prototype.removeBufferElements = function removeBufferElements(element, topBuffer, bottomBuffer) {
      element.parentNode.removeChild(topBuffer);
      element.parentNode.removeChild(bottomBuffer);
    };

    DefaultTemplateStrategy.prototype.getFirstElement = function getFirstElement(topBuffer) {
      return _aureliaPal.DOM.nextElementSibling(topBuffer);
    };

    DefaultTemplateStrategy.prototype.getLastElement = function getLastElement(bottomBuffer) {
      return bottomBuffer.previousElementSibling;
    };

    DefaultTemplateStrategy.prototype.getTopBufferDistance = function getTopBufferDistance(topBuffer) {
      return 0;
    };

    return DefaultTemplateStrategy;
  }();
});