import './setup';
import {ObserverLocator} from 'aurelia-binding';
import {BoundViewFactory, TemplatingEngine, ViewSlot, ViewFactory, ModuleAnalyzer, TargetInstruction, ViewResources} from 'aurelia-templating';
import {Container} from 'aurelia-dependency-injection';
import {DOM} from 'aurelia-pal';
import {VirtualRepeat} from '../src/virtual-repeat';
import {ViewStrategyLocator} from '../src/view-strategy';
import {DomHelper} from '../src/dom-helper';
import {
  ViewSlotMock,
  BoundViewFactoryMock,
  RepeatStrategyMock,
  ViewMock,
  ArrayObserverMock,
  instructionMock,
  viewResourcesMock,
  ViewStrategyMock
} from './mocks';

let element = DOM.createElement('div');
let topBuffer = DOM.createElement('div');
let bottomBuffer = DOM.createElement('div');
let scrollContainer = DOM.createElement('div');

describe('VirtualRepeat', () => {
  let virtualRepeat, viewStrategyLocator, domHelper;
  let viewStrategyMock;

  beforeEach(() => {
    let container = new Container();
    viewStrategyMock = new ViewStrategyMock();
    viewStrategyLocator = container.get(ViewStrategyLocator);
    domHelper = container.get(DomHelper);
    container.registerInstance(DOM.Element, element);
    container.registerInstance(BoundViewFactory, new BoundViewFactoryMock());
    container.registerInstance(TargetInstruction, instructionMock);
    container.registerInstance(ViewSlot, new ViewSlotMock());
    let templatingEngine = container.get(TemplatingEngine);
    virtualRepeat = templatingEngine.createViewModelForUnitTest(VirtualRepeat);
  });

  describe('attached', () => {

    beforeEach(() => {
      virtualRepeat.items = [];
      spyOn(viewStrategyMock, 'createTopBufferElement').and.callFake(() => topBuffer);
      spyOn(viewStrategyMock, 'createBottomBufferElement').and.callFake(() => topBuffer);
      spyOn(viewStrategyMock, 'getScrollContainer').and.callFake(() => scrollContainer);
      spyOn(viewStrategyMock, 'getFirstElement').and.callFake(() => {});
      spyOn(domHelper, 'getElementDistanceToTopOfDocument').and.callFake(() => undefined);
      spyOn(viewStrategyLocator, 'getStrategy').and.callFake(() => viewStrategyMock);
    });

    it('should locate the view strategy', () => {
      virtualRepeat.attached();
      expect(viewStrategyLocator.getStrategy).toHaveBeenCalledWith(element);
    });

    it('should get the scroll container', () => {
      virtualRepeat.attached();
      expect(viewStrategyMock.getScrollContainer).toHaveBeenCalledWith(element);
    });

    it('should create buffer elements', () => {
      virtualRepeat.attached();
      expect(viewStrategyMock.createTopBufferElement).toHaveBeenCalledWith(element);
      expect(viewStrategyMock.createBottomBufferElement).toHaveBeenCalledWith(element);
    });

    it('should handle container scroll when container with overflow scrolling', () => {
      spyOn(domHelper, 'hasOverflowScroll').and.callFake(() => true);
      virtualRepeat.attached();
      expect(virtualRepeat._fixedHeightContainer).toBe(true);
    });

    it('should not handle container scroll when no container with overflow scrolling', () => {
      virtualRepeat.attached();
      expect(virtualRepeat._fixedHeightContainer).toBe(false);
    });
  });
});

