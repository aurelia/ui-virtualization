import './setup';
import {ObserverLocator} from 'aurelia-binding';
import {BoundViewFactory, TemplatingEngine, ViewSlot, ViewFactory, ModuleAnalyzer, TargetInstruction, ViewResources} from 'aurelia-templating';
import {Container} from 'aurelia-dependency-injection';
import {DOM} from 'aurelia-pal';
import {VirtualRepeat} from '../src/virtual-repeat';
import {TemplateStrategyLocator} from '../src/template-strategy';
import {DomHelper} from '../src/dom-helper';
import {
  ViewSlotMock,
  BoundViewFactoryMock,
  RepeatStrategyMock,
  ViewMock,
  ArrayObserverMock,
  instructionMock,
  viewResourcesMock,
  TemplateStrategyMock
} from './mocks';

let element = DOM.createElement('div');
let topBuffer = DOM.createElement('div');
let bottomBuffer = DOM.createElement('div');
let scrollContainer = DOM.createElement('div');

xdescribe('VirtualRepeat', () => {
  let virtualRepeat, templateStrategyLocator, domHelper;
  let templateStrategyMock;

  beforeEach(() => {
    let container = new Container();
    templateStrategyMock = new TemplateStrategyMock();
    templateStrategyLocator = container.get(TemplateStrategyLocator);
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
      spyOn(templateStrategyMock, 'createTopBufferElement').and.callFake(() => topBuffer);
      spyOn(templateStrategyMock, 'createBottomBufferElement').and.callFake(() => topBuffer);
      spyOn(templateStrategyMock, 'getScrollContainer').and.callFake(() => scrollContainer);
      spyOn(templateStrategyMock, 'getFirstElement').and.callFake(() => {});
      spyOn(domHelper, 'getElementDistanceToTopOfDocument').and.callFake(() => undefined);
      spyOn(templateStrategyLocator, 'getStrategy').and.callFake(() => templateStrategyMock);
    });

    it('should locate the view strategy', () => {
      virtualRepeat.attached();
      expect(templateStrategyLocator.getStrategy).toHaveBeenCalledWith(element);
    });

    it('should get the scroll container', () => {
      virtualRepeat.attached();
      expect(templateStrategyMock.getScrollContainer).toHaveBeenCalledWith(element);
    });

    it('should create buffer elements', () => {
      virtualRepeat.attached();
      expect(templateStrategyMock.createTopBufferElement).toHaveBeenCalledWith(element);
      expect(templateStrategyMock.createBottomBufferElement).toHaveBeenCalledWith(element);
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

