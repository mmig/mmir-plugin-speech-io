import { WrappedElement, ContainedElement } from '../typings/';
/**
 * HELPER get/extract a "target" element
 *
 * @param  {string | ElementRef | HTMLElement | null} target
 *           an ID attribute, reference or HTML element
 * @param  {Event} [event]
 *          if target is omitted, and the event is specified, the currentTarget (or target) of
 *          the event are used
 * @return {HTMLElement} the HTML element (or null)
 */
export declare function getHtmlElement(target: string | WrappedElement | ContainedElement | HTMLElement, event?: Event): HTMLElement;
