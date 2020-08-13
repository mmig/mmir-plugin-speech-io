import { Observable } from 'rxjs';
import { DisplayText } from '../ctrl/SpeechInputController';
import { SelectionUtil } from '../util/SelectionUtil';
import { GuiElement, FormControl } from '../typings/';
export declare const UNSTABLE_RESULT_HTML_PREFIX = "<span class=\"unstable\">";
export declare const UNSTABLE_RESULT_HTML_SUFFIX = "</span>";
export declare class DictationTargetHandler {
    private targets;
    constructor();
    get(id: string): DictationHandler;
    has(id: string): boolean;
    put(id: string, el: DictationHandler): void;
    reset(): void;
    apply(func: (handler: DictationHandler) => void): void;
    destroy(): void;
}
export declare class DictationHandler {
    readonly id: string;
    private selectUtil;
    private asrResultSubs;
    private target;
    private textfield;
    nativeInput: HTMLElement;
    nativeCtrl: HTMLElement;
    private onTextChangeSubs;
    private _selectionListener;
    isBrowserEnv: boolean;
    _isNeedFixFocus: boolean;
    isPlainText: boolean;
    isTextInputEl: boolean;
    isIntegerInput: boolean;
    _isAutocomplete?: boolean;
    _inputData: CurrentInputData;
    selectionMode: SelectionMode;
    private _debug;
    get debug(): boolean;
    set debug(value: boolean);
    get activationCtrl(): HTMLElement;
    constructor(id: string, selectUtil: SelectionUtil);
    protected setInputTarget(textfield: GuiElement): void;
    protected doInitSelectionChange(): void;
    protected setCtrl(ctrl: GuiElement): void;
    protected initFromTarget(currentText: string, textChangeObservable: Observable<string>): void;
    setTargetRef(target: DictationTarget): void;
    destroy(): void;
    prepare(): void;
    showDictationFeedback(display: boolean): void;
    private getInputSelection;
    setText(str: string | DisplayText, isCommitAutoComplete?: boolean): void;
    getText(): string;
    isAutocomplete(): boolean;
    getAutocompleteMenu(): any;
    isAutocompleteNoResult(): boolean;
    /**
     * HELPER: set state "system-initiated selection in progress"
     *
     * NOTE: some browsers fire a FOCUS event when text is selected, some do not
     * 		-> this HELPER sets a marker to the text-element, so that:
     *
     * isActive === true => $(text-element).data('isSystemSelection') === true
     * isActive === false => $(text-element).data('isSystemSelection') === FALSY
     */
    setSysSel(isActive: boolean): void;
    isSysSel(): boolean;
    getData(field: string): string;
    setData(field: string, value: any): void;
    removeData(field: string): void;
    /**
     * HELPER for fixing the issue, that some Android devices will "pull" focus to the input-element
     * 			when text is entered / a selection is made
     * @param isForce
     * @returns
     */
    doSetUnfocused(isForce?: boolean): void;
    /**
     * HELPER: set "system initiated" selection (see #setSysSel)
     *
     * select all text
     */
    setSelection(): void;
    /**
     * HELPER: set "system initiated" selection (see #setSysSel)
     *
     * clear selection
     */
    setSelection(start: null): void;
    /**
     * HELPER: set "system initiated" selection (see #setSysSel)
     *
     * set selection range
     */
    setSelection(start: number, end: number, text?: string): void;
}
export declare type SelectionMode = 'none' | 'unstable' | 'interim';
export declare type InputSelection = {
    start: number;
    end: number;
    index?: number;
};
export declare class CurrentInputData {
    _debug: boolean;
    result: Array<string>;
    interim: string;
    unstable: string;
    selection: InputSelection | null;
    reset(): void;
    /**
     * sets current input to 1 single, stable result (and removes unstable & interim parts)
     *
     * @param {string} text
     *                     the (stable) text
     * @param {boolean} [isPreprocessText]
     *                     indicates, if text is already prepocessed: if not, preprocessing is applied
     *                     (transform punctuation-words, captialize at beginning of sentence etc)
     *                     DEFAULT: true
     */
    set(text: string, isPreprocessText?: boolean): void;
    getCurrentText(): string;
    getRestText(): string;
    /**
     * add an additional stable part to the current input
     *
     * @param {String} result
     * 			the (paritial but stable) result to add/append
     */
    add(result: string): void;
    private _add;
    private _addResult;
    _processPunctuation(text: string): string;
    /**
     * [_insertText description]
     * @param  text [description]
     * @param  newStr [description]
     * @param  selection [description]
     * @return an array with 2 entries: first with appended newText, second with rest of text
     */
    _insertText(text: string, newStr: string, selection: InputSelection): Array<string>;
    _getTargetIndex(): number;
}
export interface DictationTarget {
    /** the identifier for the dictation target */
    id: string;
    /** the text-input (<input> or <textarea>) for this dictation target */
    input?: GuiElement;
    /** GUI control for starting/stopping dictation to this target */
    ctrl?: GuiElement;
    /** containing object of the target field that will receive dictation results */
    container?: any;
    /** the name of the target field (within the container) that will receive dictation results */
    fieldName?: string;
    form?: FormControl;
}
