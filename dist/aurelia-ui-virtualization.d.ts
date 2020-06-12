import { ICollectionObserverSplice, InternalCollectionObserver, ObserverLocator, OverrideContext, Scope } from 'aurelia-binding';
import { Container } from 'aurelia-dependency-injection';
import { BoundViewFactory, TargetInstruction, View, ViewResources, ViewSlot } from 'aurelia-templating';
import { AbstractRepeater } from 'aurelia-templating-resources';

export interface IScrollNextScrollContext {
	topIndex: number;
	isAtBottom: boolean;
	isAtTop: boolean;
}
export interface IVirtualRepeater extends AbstractRepeater {
	items: any;
	local?: string;
	/**
	 * First view index, for proper follow up calculations
	 */
	$first: number;
	/**
	 * Defines how many items there should be for a given index to be considered at edge
	 */
	edgeDistance: number;
	/**
	 * Template handling strategy for this repeat.
	 */
	templateStrategy: ITemplateStrategy;
	/**
	 * The element hosting the scrollbar for this repeater
	 */
	scrollerEl: HTMLElement;
	/**
	 * Bot buffer element, used to reflect the visualization of amount of items `after` the first visible item
	 */
	bottomBufferEl: HTMLElement;
	/**
	 * Height of top buffer to properly push the visible rendered list items into right position
	 * Usually determined by `_first` visible index * `itemHeight`
	 */
	topBufferHeight: number;
	/**
	 * Height of bottom buffer to properly push the visible rendered list items into right position
	 */
	bottomBufferHeight: number;
	/**
	 * Height of each item. Calculated based on first item
	 */
	itemHeight: number;
	/**
	 * Calculate current scrolltop position
	 */
	distanceToTop: number;
	/**
	 * Number indicating minimum elements required to render to fill up the visible viewport
	 */
	minViewsRequired: number;
	/**
	 * ViewSlot that encapsulates the repeater views operations in the template
	 */
	readonly viewSlot: ViewSlot;
	/**
	 * Aurelia change handler by convention for property `items`. Used to properly determine action
	 * needed when items value has been changed
	 */
	itemsChanged(): void;
	/**
	 * Get first visible view
	 */
	firstView(): IView | null;
	/**
	 * Get last visible view
	 */
	lastView(): IView | null;
	/**
	 * Get index of first visible view
	 */
	firstViewIndex(): number;
	/**
	 * Get index of last visible view
	 */
	lastViewIndex(): number;
	/**
	 * Virtual repeater normally employs scroll handling buffer for performance reasons.
	 * As syncing between scrolling state and visible views could be expensive.
	 */
	enableScroll(): void;
	/**
	 * Invoke infinite scroll next function expression with currently bound scope of the repeater
	 */
	getMore(topIndex: number, isNearTop: boolean, isNearBottom: boolean, force?: boolean): void;
	/**
	 * Get the real scroller element of the DOM tree this repeat resides in
	 */
	getScroller(): HTMLElement;
	/**
	 * Get scrolling information of the real scroller element of the DOM tree this repeat resides in
	 */
	getScrollerInfo(): IScrollerInfo;
	/**
	 * Observe scroller element to react upon sizing changes
	 */
	observeScroller(scrollerEl: HTMLElement): void;
	/**
	 * Dispose scroller content size observer, if has
	 * Dispose all event listeners related to sizing of scroller, if any
	 */
	unobserveScroller(): void;
	/**
	 * Signal the repeater to reset all its internal calculation states.
	 * Typically used when items value is null, undefined, empty collection.
	 * Or the repeater has been detached
	 */
	resetCalculation(): void;
	/**
	 * Update buffer elements height/width with corresponding
	 * @param skipUpdate `true` to signal this repeater that the update won't trigger scroll event
	 */
	updateBufferElements(skipUpdate?: boolean): void;
}
export declare type RepeatableValue = number | any[] | Map<any, any> | Set<any>;
export interface IVirtualRepeatStrategy<T extends RepeatableValue = RepeatableValue> {
	/**
	 * create first item to calculate the heights
	 */
	createFirstRow(repeat: IVirtualRepeater): IView;
	/**
	 * Count the number of the items in the repeatable value `items`
	 */
	count(items: T): number;
	/**
	 * Calculate required variables for a virtual repeat instance to operate properly
	 *
	 * @returns `false` to notify that calculation hasn't been finished
	 */
	initCalculation(repeat: IVirtualRepeater, items: T): VirtualizationCalculation;
	/**
	 * Handle special initialization if any, depends on different strategy
	 */
	onAttached(repeat: IVirtualRepeater): void;
	/**
	 * Calculate the start and end index of a repeat based on its container current scroll position
	 */
	getViewRange(repeat: IVirtualRepeater, scrollerInfo: IScrollerInfo): [number, number];
	/**
	 * Returns true if first index is approaching start of the collection
	 * Virtual repeat can use this to invoke infinite scroll next
	 */
	isNearTop(repeat: IVirtualRepeater, firstIndex: number): boolean;
	/**
	 * Returns true if last index is approaching end of the collection
	 * Virtual repeat can use this to invoke infinite scroll next
	 */
	isNearBottom(repeat: IVirtualRepeater, lastIndex: number): boolean;
	/**
	 * Update repeat buffers height based on repeat.items
	 */
	updateBuffers(repeat: IVirtualRepeater, firstIndex: number): void;
	/**
	 * Get the observer based on collection type of `items`
	 */
	getCollectionObserver(observerLocator: ObserverLocator, items: T): InternalCollectionObserver;
	/**
	 * @override
	 * Handle the repeat's collection instance changing.
	 * @param repeat The repeater instance.
	 * @param items The new array instance.
	 * @param firstIndex The index of first active view
	 */
	instanceChanged(repeat: IVirtualRepeater, items: T, firstIndex?: number): void;
	/**
	 * @override
	 * Handle the repeat's collection instance mutating.
	 * @param repeat The virtual repeat instance.
	 * @param items The modified array.
	 * @param splices Records of array changes.
	 */
	instanceMutated(repeat: IVirtualRepeater, items: RepeatableValue, splices: ICollectionObserverSplice[]): void;
	/**
	 * Unlike normal repeat, virtualization repeat employs "padding" elements. Those elements
	 * often are just blank block with proper height/width to adjust the height/width/scroll feeling
	 * of virtualized repeat.
	 *
	 * Because of this, either mutation or change of the collection of repeat will potentially require
	 * readjustment (or measurement) of those blank block, based on scroll position
	 *
	 * This is 2 phases scroll handle
	 */
	remeasure(repeat: IVirtualRepeater): void;
	/**
	 * Update all visible views of a repeater, starting from given `startIndex`
	 */
	updateAllViews(repeat: IVirtualRepeater, startIndex: number): void;
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
 * Expose property `children` to help manipulation/calculation
 */
export declare type IViewSlot = ViewSlot & {
	children: IView[];
};
/**
 * Object with information about current state of a scrollable element
 * Capturing:
 * - current scroll height
 * - current scroll top
 * - real height
 */
export interface IScrollerInfo {
	scroller: HTMLElement;
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
export declare class VirtualRepeat extends AbstractRepeater implements IVirtualRepeater {
	/**
	 * First view index, for proper follow up calculations
	 */
	$first: number;
	/**
	 * Height of top buffer to properly push the visible rendered list items into right position
	 * Usually determined by `_first` visible index * `itemHeight`
	 */
	topBufferHeight: number;
	/**
	 * Height of bottom buffer to properly push the visible rendered list items into right position
	 */
	bottomBufferHeight: number;
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
	viewSlot: IViewSlot;
	readonly viewFactory: BoundViewFactory;
	/**
	 * Reference to scrolling container of this virtual repeat
	 * Usually determined by template strategy.
	 *
	 * The scrolling container may vary based on different position of `virtual-repeat` attribute
	 */
	scrollerEl: HTMLElement;
	/**
	 * Defines how many items there should be for a given index to be considered at edge
	 */
	edgeDistance: number;
	/**
	 * Template handling strategy for this repeat.
	 */
	templateStrategy: ITemplateStrategy;
	/**
	 * Top buffer element, used to reflect the visualization of amount of items `before` the first visible item
	 */
	topBufferEl: HTMLElement;
	/**
	 * Bot buffer element, used to reflect the visualization of amount of items `after` the first visible item
	 */
	bottomBufferEl: HTMLElement;
	/**
	 * Height of each item. Calculated based on first item
	 */
	itemHeight: number;
	/**
	 * Calculate current scrolltop position
	 */
	distanceToTop: number;
	/**
	 * Number indicating minimum elements required to render to fill up the visible viewport
	 */
	minViewsRequired: number;
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
	enableScroll(): void;
	/**
	 * Get the real scroller element of the DOM tree this repeat resides in
	 */
	getScroller(): HTMLElement;
	/**
	 * Get scrolling information of the real scroller element of the DOM tree this repeat resides in
	 */
	getScrollerInfo(): IScrollerInfo;
	resetCalculation(): void;
	getMore(topIndex: number, isNearTop: boolean, isNearBottom: boolean, force?: boolean): void;
	updateBufferElements(skipUpdate?: boolean): void;
	firstView(): IView | null;
	lastView(): IView | null;
	firstViewIndex(): number;
	lastViewIndex(): number;
	/**
	 * Observe scroller element to react upon sizing changes
	 */
	observeScroller(scrollerEl: HTMLElement): void;
	/**
	 * Dispose scroller content size observer, if has
	 * Dispose all event listeners related to sizing of scroller, if any
	 */
	unobserveScroller(): void;
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
	/**@override */
	updateBindings(view: IView): void;
}
export declare class InfiniteScrollNext {
}
export declare function configure(config: {
	globalResources(...args: any[]): any;
}): void;