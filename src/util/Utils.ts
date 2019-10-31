
import { WrappedElement , ContainedElement } from '../typings/mmir-ext-dialog.d';


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
export function getHtmlElement(target: string | WrappedElement | ContainedElement | HTMLElement, event?: Event): HTMLElement {
  let elem: HTMLElement = null;
  if(target){
    if(typeof target === 'string'){
      elem = document.getElementById(target);
    } else if((target as WrappedElement).nativeElement){
      elem = (target as WrappedElement).nativeElement;
    } else if((target as ContainedElement).el){
      elem = (target as ContainedElement).el;
    } else {
      elem = target as HTMLElement;
    }
  }

  if(!elem && event){
    elem = (event.currentTarget || event.target) as HTMLElement;
  }

  return elem;
}
