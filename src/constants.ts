export const doc = document;
export const htmlElement = doc.documentElement;
export const $raf = requestAnimationFrame;

export interface IBrowserConstants {
  /**
   * Indicates how far browser will scroll each scroll jump in not smooth scrolling mode
   */
  scrollStep: number;
}

export const BrowserConstants: IBrowserConstants = {
  scrollStep: 100
};
