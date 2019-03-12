import { IScrollNextScrollContext } from '../src/interfaces';

export declare class ITestAppInterface<T> {
  items: T[];
  getNextPage?: (scrollContext: IScrollNextScrollContext) => void;
}
