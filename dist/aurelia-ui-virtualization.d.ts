import { ICollectionObserverSplice, InternalCollectionObserver, ObserverLocator, OverrideContext, Scope } from 'aurelia-binding';
import { Container } from 'aurelia-dependency-injection';
import { BoundViewFactory, TargetInstruction, View, ViewResources, ViewSlot } from 'aurelia-templating';
import { AbstractRepeater, RepeatStrategy } from 'aurelia-templating-resources';

export interface IScrollNextScrollContext {
	topIndex: number;
	isAtBottom: boolean;
	isAtTop: boolean;
}
export interface IVirtualRepeatStrategy extends RepeatStrategy {
	/**
	 * create first item to calculate the heights
	 */
	createFirstItem(repeat: VirtualRepeat): IView;
	/**
	 * Calculate required variables for a virtual repeat instance to operate properly
	 *
	 * @returns `false` to notify that calculation hasn't been finished
	 */
	initCalculation(repeat: VirtualRepeat, items: number | any[] | Map<any, any> | Set<any>): VirtualizationCalculation;
	/**
	 * Get the observer based on collection type of `items`
	 */
	getCollectionObserver(observerLocator: ObserverLocator, items: any[] | Map<any, any> | Set<any>): InternalCollectionObserver;
	/**
	 * @override
	 * Handle the repeat's collection instance changing.
	 * @param repeat The repeater instance.
	 * @param items The new array instance.
	 * @param firstIndex The index of first active view
	 */
	instanceChanged(repeat: VirtualRepeat, items: any[] | Map<any, any> | Set<any>, firstIndex?: number): void;
	/**
	 * @override
	 * Handle the repeat's collection instance mutating.
	 * @param repeat The virtual repeat instance.
	 * @param array The modified array.
	 * @param splices Records of array changes.
	 */
	instanceMutated(repeat: VirtualRepeat, array: any[], splices: ICollectionObserverSplice[]): void;
}
/**
 * Templating strategy to handle virtual repeat views
 * Typically related to moving views, creating buffer and locating view range range in the DOM
 */
export interface ITemplateStrategy {
	/**
	 * Determine the scroll container of a [virtual-repeat] based on its anchor (`element` is a comment node)
	 */
	getScrollContainer(element: Element): HTMLElement;
	/**
	 * Move root element of a view to first position in the list, after top buffer
	 * Note: [virtual-repeat] only supports single root node repeat
	 */
	moveViewFirst(view: View, topBuffer: Element): void;
	/**
	 * Move root element of a view to last position in the list, before bottomBuffer
	 * Note: [virtual-repeat] only supports single root node repeat
	 */
	moveViewLast(view: View, bottomBuffer: Element): void;
	/**
	 * Create top and bottom buffer elements for an anchor (`element` is a comment node)
	 */
	createBuffers(element: Element): [HTMLElement, HTMLElement];
	/**
	 * Clean up buffers of a [virtual-repeat]
	 */
	removeBuffers(element: Element, topBuffer: Element, bottomBuffer: Element): void;
	/**
	 * Get the first element(or view) between top buffer and bottom buffer
	 * Note: [virtual-repeat] only supports single root node repeat
	 */
	getFirstElement(topBufer: Element, botBuffer: Element): Element;
	/**
	 * Get the last element(or view) between top buffer and bottom buffer
	 * Note: [virtual-repeat] only supports single root node repeat
	 */
	getLastElement(topBuffer: Element, bottomBuffer: Element): Element;
}
/**
 * Override `bindingContext` and `overrideContext` on `View` interface
 */
export declare type IView = View & Scope;
/**
 * Object with information about current state of a scrollable element
 * Capturing:
 * - current scroll height
 * - current scroll top
 * - real height
 */
export interface IScrollerInfo {
	scroller: HTMLElement;
	scrollHeight: number;
	scrollTop: number;
	height: number;
}
export declare const enum VirtualizationCalculation {
	none = 0,
	reset = 1,
	has_sizing = 2,
	observe_scroller = 4
}
/**
 * List of events that can be used to notify virtual repeat that size has changed
 */
export declare const VirtualizationEvents: {
	scrollerSizeChange: "virtual-repeat-scroller-size-changed";
	itemSizeChange: "virtual-repeat-item-size-changed";
};
declare class VirtualRepeatStrategyLocator {
	constructor();
	/**
	 * Adds a repeat strategy to be located when repeating a template over different collection types.
	 * @param strategy A repeat strategy that can iterate a specific collection type.
	 */
	addStrategy(matcher: (items: any) => boolean, strategy: IVirtualRepeatStrategy): void;
	/**
	 * Gets the best strategy to handle iteration.
	 */
	getStrategy(items: any): IVirtualRepeatStrategy;
}
declare class TemplateStrategyLocator {
	constructor(container: Container);
	/**
	 * Selects the template strategy based on element hosting `virtual-repeat` custom attribute
	 */
	getStrategy(element: Element): ITemplateStrategy;
}
export declare class VirtualRepeat extends AbstractRepeater {
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
	/**
	 * Calculate current scrolltop position
	 */
	distanceToTop: number;
	/**
	 * collection repeating strategy
	 */
	strategy: IVirtualRepeatStrategy;
	collectionObserver: any;
	constructor(element: HTMLElement, viewFactory: BoundViewFactory, instruction: TargetInstruction, viewSlot: ViewSlot, viewResources: ViewResources, observerLocator: ObserverLocator, collectionStrategyLocator: VirtualRepeatStrategyLocator, templateStrategyLocator: TemplateStrategyLocator);
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
	/**
	 * Get the real scroller element of the DOM tree this repeat resides in
	 */
	getScroller(): HTMLElement;
	/**
	 * Get scrolling information of the real scroller element of the DOM tree this repeat resides in
	 */
	getScrollerInfo(): IScrollerInfo;
	/**@override */
	viewCount(): number;
	/**@override */
	views(): IView[];
	/**@override */
	view(index: number): IView | null;
	/**@override */
	addView(bindingContext: any, overrideContext: OverrideContext): IView;
	/**@override */
	insertView(index: number, bindingContext: any, overrideContext: OverrideContext): void;
	/**@override */
	removeAllViews(returnToCache: boolean, skipAnimation: boolean): void | Promise<void>;
	/**@override */
	removeView(index: number, returnToCache: boolean, skipAnimation: boolean): IView | Promise<IView>;
	updateBindings(view: IView): void;
}
export declare class InfiniteScrollNext {
}
export declare function configure(config: {
	globalResources(...args: any[]): any;
}): void;