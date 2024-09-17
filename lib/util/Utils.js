"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHtmlElement = getHtmlElement;
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
function getHtmlElement(target, event) {
    var elem = null;
    if (target) {
        if (typeof target === 'string') {
            elem = document.getElementById(target);
        }
        else if (target.nativeElement) {
            elem = target.nativeElement;
        }
        else if (target.el) {
            elem = target.el;
        }
        else {
            elem = target;
        }
    }
    if (!elem && event) {
        elem = (event.currentTarget || event.target);
    }
    return elem;
}
//# sourceMappingURL=Utils.js.map