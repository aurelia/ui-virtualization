import { ICollectionObserverSplice, ObserverLocator, OverrideContext, Scope } from 'aurelia-binding';
import { Container } from 'aurelia-dependency-injection';
import { BoundViewFactory, TargetInstruction, View, ViewResources, ViewSlot } from 'aurelia-templating';
import { AbstractRepeater, Repeat, RepeatStrategy, RepeatStrategyLocator } from 'aurelia-templating-resources';

declare class DomHelper {
	getElementDistanceToTopOfDocument(element: Element): number;
	hasOverflowScroll(element: HTMLElement): boolean;
}
export interface IScrollNextScrollContext {
	topIndex: number;
	isAtBottom: boolean;
	isAtTop: boolean;
}
export interface IVirtualRepeatStrategy extends RepeatStrategy {
	/**
	 * create first item to calculate the heights
	 */
	createFirstItem(repeat: IVirtualRepeat): void;
	/**
  * Handle the repeat's collection instance changing.
  * @param repeat The repeater instance.
  * @param items The new array instance.
  */
	instanceChanged(repeat: IVirtualRepeat, items: Array<any>, ...rest: any[]): void;
}
export interface IVirtualRepeat extends Repeat {
	items: any[];
	itemHeight: number;
	strategy: IVirtualRepeatStrategy;
	templateStrategy: ITemplateStrategy;
	topBuffer: HTMLElement;
	bottomBuffer: HTMLElement;
	isLastIndex: boolean;
	readonly viewFactory: BoundViewFactory;
}
/**
 * Templating strategy to handle virtual repeat views
 * Typically related to moving views, creating buffer and locating view range range in the DOM
 */
export interface ITemplateStrategy {
	getScrollContainer(element: Element): HTMLElement;
	moveViewFirst(view: View, topBuffer: Element): void;
	moveViewLast(view: View, bottomBuffer: Element): void;
	createTopBufferElement(element: Element): HTMLElement;
	createBottomBufferElement(element: Element): HTMLElement;
	removeBufferElements(element: Element, topBuffer: Element, bottomBuffer: Element): void;
	getFirstElement(topBuffer: Element): Element;
	getLastElement(bottomBuffer: Element): Element;
	getTopBufferDistance(topBuffer: Element): number;
}
/**
 * Override `bindingContext` and `overrideContext` on `View` interface
 */
export declare type IView = View & Scope;
declare class VirtualRepeatStrategyLocator extends RepeatStrategyLocator {
	constructor();
	getStrategy(items: any): IVirtualRepeatStrategy;
}
declare class TemplateStrategyLocator {
	static inject: (typeof Container)[];
	container: Container;
	constructor(container: Container);
	/**
	 * Selects the template strategy based on element hosting `virtual-repeat` custom attribute
	 */
	getStrategy(element: Element): ITemplateStrategy;
}
export declare class VirtualRepeat extends AbstractRepeater implements IVirtualRepeat {
	key: any;
	value: any;
	/**
	 * @bindable
	 */
	items: any[];
	/**
	 * @bindable
	 */
	local: string;
	readonly viewFactory: BoundViewFactory;
	templateStrategy: ITemplateStrategy;
	topBuffer: HTMLElement;
	bottomBuffer: HTMLElement;
	itemHeight: number;
	movedViewsCount: number;
	distanceToTop: number;
	/**
	 * When dealing with tables, there can be gaps between elements, causing distances to be messed up. Might need to handle this case here.
	 */
	topBufferDistance: number;
	scrollContainerHeight: number;
	isLastIndex: boolean;
	elementsInView: number;
	strategy: IVirtualRepeatStrategy;
	ignoreMutation: boolean;
	collectionObserver: any;
	constructor(element: HTMLElement, viewFactory: BoundViewFactory, instruction: TargetInstruction, viewSlot: ViewSlot, viewResources: ViewResources, observerLocator: ObserverLocator, strategyLocator: VirtualRepeatStrategyLocator, templateStrategyLocator: TemplateStrategyLocator, domHelper: DomHelper);
	/**@override */
	bind(bindingContext: any, overrideContext: OverrideContext): void;
	/**@override */
	attached(): void;
	/**@override */
	call(context: 'handleCollectionMutated' | 'handleInnerCollectionMutated', changes: ICollectionObserverSplice[]): void;
	/**@override */
	detached(): void;
	/**@override */
	unbind(): void;
	/**
	 * @override
	 *
	 * If `items` is truthy, do the following calculation/work:
	 *
	 * - container fixed height flag
	 * - necessary initial heights
	 * - create new collection observer & observe for changes
	 * - invoke `instanceChanged` on repeat strategy to create views / move views
	 * - update indices
	 * - update scrollbar position in special scenarios
	 * - handle scroll as if scroll event happened
	 */
	itemsChanged(): void;
	/**@override */
	handleCollectionMutated(collection: any[], changes: ICollectionObserverSplice[]): void;
	/**@override */
	handleInnerCollectionMutated(collection: any[], changes: ICollectionObserverSplice[]): void;
	/**@override */
	viewCount(): number;
	/**@override */
	views(): IView[];
	/**@override */
	view(index: number): IView;
	/**@override */
	addView(bindingContext: any, overrideContext: OverrideContext): void;
	/**@override */
	insertView(index: number, bindingContext: any, overrideContext: OverrideContext): void;
	/**@override */
	removeAllViews(returnToCache: boolean, skipAnimation: boolean): void | Promise<any>;
	/**@override */
	removeView(index: number, returnToCache: boolean, skipAnimation: boolean): View | Promise<View>;
	updateBindings(view: View): void;
}
export declare class InfiniteScrollNext {
}
export declare function configure(config: any): void;