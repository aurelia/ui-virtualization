import './setup';
import {
  BoundViewFactory,
  TemplatingEngine,
  ViewSlot,
  TargetInstruction
} from 'aurelia-templating';
import {
  Container
} from 'aurelia-dependency-injection';
import {
  DOM
} from 'aurelia-pal';
import {
  VirtualRepeat
} from '../src/virtual-repeat';
import {
  TemplateStrategyLocator
} from '../src/template-strategy-locator';
import {
  ViewSlotMock,
  BoundViewFactoryMock,
  ViewMock,
  ArrayObserverMock,
  instructionMock,
  viewResourcesMock,
  TemplateStrategyMock
} from './mocks';
import { ITemplateStrategy } from '../src/interfaces';

let element = DOM.createElement('div');
let topBuffer = DOM.createElement('div');
let bottomBuffer = DOM.createElement('div');
let scrollContainer = DOM.createElement('div');

xdescribe('VirtualRepeat', () => {
  let container: Container;
  let virtualRepeat: VirtualRepeat;
  let templateStrategyLocator: TemplateStrategyLocator;
  let templateStrategyMock: ITemplateStrategy;

  beforeEach(() => {
    let container = new Container();
    templateStrategyMock = new TemplateStrategyMock();
    templateStrategyLocator = container.get(TemplateStrategyLocator);
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
      spyOn(templateStrategyMock, 'createBuffers').and.callFake(() => []);
      spyOn(templateStrategyMock, 'getScrollContainer').and.callFake(() => scrollContainer);
      spyOn(templateStrategyMock, 'getFirstElement').and.callFake(() => {});
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
      expect(templateStrategyMock.createBuffers).toHaveBeenCalledWith(element);
    });

    it('should handle container scroll when container with overflow scrolling', () => {
      virtualRepeat.attached();
      expect(virtualRepeat._fixedHeightContainer).toBe(true);
    });

    it('should not handle container scroll when no container with overflow scrolling', () => {
      virtualRepeat.attached();
      expect(virtualRepeat._fixedHeightContainer).toBe(false);
    });
  });
});

