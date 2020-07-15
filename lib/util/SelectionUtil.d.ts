import * as CaretPositionModule from '../lib/caretPosition';
import * as LengthModule from '../lib/length';
import { CaretOptions } from '../lib/caretPosition';
export declare class SelectionUtil {
    private unitUtil;
    private caretPos;
    _debug: boolean;
    private _selMarkerStart;
    private _selMarkerEnd;
    private _selMarkerBlock;
    constructor(unitUtil: typeof LengthModule, caretPos: typeof CaretPositionModule);
    clearSelectionMarker(): void;
    /**
     * Auxiliary selection marker for text-input fields:
     * if a text-input control looses its focus, the selection may not get displayed anymore.
     *
     * This utility function creates a marker DIV and displays the selection regardless of the
     * focus-status.
     *
     * The implementation takes care, that there will be only 1 selection-marker
     * at a time (i.e. no markers in multiple controls).
     *
     * @param {HTMLElement} elem
     * 			the textarea/input for the selection.
     * 			If NULL, the selection marker will be cleared.
     * @param {Number} start
     * 			the starting index for the selection
     * @param {Number}
     * 			the length of the selection
     * @param {Boolean} [forceDisplay] OPTIONAL
     * 			if present and TRUE, display of selection marker will be forced
     * 			(i.e. shown, even if elem has focus, length is 0, ...)
     *
     */
    setSelectionMarker(elem: HTMLInputElement | HTMLTextAreaElement | null, start: number, length: number, target?: {
        container: any;
        fieldName: string;
    } | string, forceDisplay?: boolean): void;
    setSelectionColor(color: string): void;
    getSelectionColor(): string;
    /**
     * Set options for calculating the selection-marker area.
     *
     * The default settings are
     * 	reuse: true
     * 	guessIfUpdateStyle: true
     *
     * These settings are optimal when text-controls are styled uniformly (font type, font size etc).
     * If text-controls are styled differently, <code>guessIfUpdateStyle</code> should be set to false, or
     * {@link #resetStyleCaretCoordinatesDiv} should be invoked when a new (differently styled) text control
     * gets selected.
     *
     * @param options
     * 				options for calculating the caret (selection area) coordinates:
     * 				options.reuse				BOOLEAN: reuse shadow DIV that is used for calculating the caret coordinates (DEFAULT: true)
     * 				options.guessIfUpdateStyle	BOOLEAN | FUNCTION: if TRUE, styling of the shadow DIV is not updated, if the current target element has the same type (Tag Name) as the previous one.
     * 																If function: a callback for determining, if the shadow DIV's style should be updated (return TRUE, if it shoud get updated): callback(shadowDiv) : BOOLEAN
     * 																NOTE this option is only relevant, if "reuse" is TRUE.
     * 																(DEFAULT: true)
     * 				options.forceUpdateStyle	BOOLEAN: force updating the style of the shadow DIV; only relevant, if "reuse" is TRUE (DEFAULT: false)
     * 				options.id					STRING: the id attribute for the shadow DIV (DEFAULT: "input-textarea-caret-position-mirror-div")
     */
    setSelectionOptions(options: CaretOptions): void;
    getSelectionOptions(): CaretOptions;
    /**
     * Manually reset the shadow DIV that is used for calculating the selection-marker area.
     *
     * This can be used, when <code>options.reuse = true</code> and the style of the target text-control (input or texarea) has
     * changed (in comparison to the last one, for which the selection-marker was calculated).
     *
     * If <code>options.reuse = false</code>, the shadow DIV is always reset, before calculating the area for the selection-marker,
     * i.e. no resetting necessary.
     */
    resetSelectionCalc(): void;
    setHeightFromFont(elem: HTMLElement, marker: HTMLElement): number;
}
