
/**
 * convert/calculate CSS unit-values to pixel-length;
 * @param  elem the HTMLElement which should be measured
 * @param  value the CSS length value (incl. unit) to measure
 * @param  [prop] the (CSS) property name which should be measured (DEFAULT: "width")
 * @param  [force] force measuring by computing CSS styles for the element (DEFAULT: false)
 * @return the (measured) length in pixel
 */
export function toPx(elem: HTMLElement, value: string, prop?: string, force?: boolean): number;
