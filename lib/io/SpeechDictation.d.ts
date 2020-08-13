import { Observable } from 'rxjs';
import { DisplayText } from '../ctrl/SpeechInputController';
import { SelectionUtil } from '../util/SelectionUtil';
import { GuiElement } from '../typings/';
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
export interface FormControl extends AbstractControl {
    /**
     * Sets a new value for the form control.
     *
     * @param value The new value for the control.
     * @param options Configuration options that determine how the control propagates changes
     * and emits events when the value changes.
     * The configuration options are passed to the {@link AbstractControl#updateValueAndValidity
     * updateValueAndValidity} method.
     *
     * * `onlySelf`: When true, each change only affects this control, and not its parent. Default is
     * false.
     * * `emitEvent`: When true or not supplied (the default), both the `statusChanges` and
     * `valueChanges`
     * observables emit events with the latest status and value when the control value is updated.
     * When false, no events are emitted.
     * * `emitModelToViewChange`: When true or not supplied  (the default), each change triggers an
     * `onChange` event to
     * update the view.
     * * `emitViewToModelChange`: When true or not supplied (the default), each change triggers an
     * `ngModelChange`
     * event to update the model.
     *
     */
    setValue(value: any, options?: {
        onlySelf?: boolean;
        emitEvent?: boolean;
        emitModelToViewChange?: boolean;
        emitViewToModelChange?: boolean;
    }): void;
    /**
     * Patches the value of a control.
     *
     * This function is functionally the same as {@link FormControl#setValue setValue} at this level.
     * It exists for symmetry with {@link FormGroup#patchValue patchValue} on `FormGroups` and
     * `FormArrays`, where it does behave differently.
     *
     * @see `setValue` for options
     */
    patchValue(value: any, options?: {
        onlySelf?: boolean;
        emitEvent?: boolean;
        emitModelToViewChange?: boolean;
        emitViewToModelChange?: boolean;
    }): void;
    /**
     * Resets the form control, marking it `pristine` and `untouched`, and setting
     * the value to null.
     *
     * @param formState Resets the control with an initial value,
     * or an object that defines the initial value and disabled state.
     *
     * @param options Configuration options that determine how the control propagates changes
     * and emits events after the value changes.
     *
     * * `onlySelf`: When true, each change only affects this control, and not its parent. Default is
     * false.
     * * `emitEvent`: When true or not supplied (the default), both the `statusChanges` and
     * `valueChanges`
     * observables emit events with the latest status and value when the control is reset.
     * When false, no events are emitted.
     *
     */
    reset(formState?: any, options?: {
        onlySelf?: boolean;
        emitEvent?: boolean;
    }): void;
    /**
     * Register a listener for change events.
     *
     * @param fn The method that is called when the value changes
     */
    registerOnChange(fn: Function): void;
    /**
     * Register a listener for disabled events.
     *
     * @param fn The method that is called when the disabled status changes.
     */
    registerOnDisabledChange(fn: (isDisabled: boolean) => void): void;
}
export interface AbstractControl {
    /**
     * The current value of the control.
     *
     * * For a `FormControl`, the current value.
     * * For a `FormGroup`, the values of enabled controls as an object
     * with a key-value pair for each member of the group.
     * * For a `FormArray`, the values of enabled controls as an array.
     *
     */
    readonly value: any;
    /**
     * The parent control.
     */
    /**
     * The validation status of the control. There are four possible
     * validation status values:
     *
     * * **VALID**: This control has passed all validation checks.
     * * **INVALID**: This control has failed at least one validation check.
     * * **PENDING**: This control is in the midst of conducting a validation check.
     * * **DISABLED**: This control is exempt from validation checks.
     *
     * These status values are mutually exclusive, so a control cannot be
     * both valid AND invalid or invalid AND disabled.
     */
    readonly status: string;
    /**
     * A control is `valid` when its `status` is `VALID`.
     *
     * @see {@link AbstractControl.status}
     *
     * @returns True if the control has passed all of its validation tests,
     * false otherwise.
     */
    readonly valid: boolean;
    /**
     * A control is `invalid` when its `status` is `INVALID`.
     *
     * @see {@link AbstractControl.status}
     *
     * @returns True if this control has failed one or more of its validation checks,
     * false otherwise.
     */
    readonly invalid: boolean;
    /**
     * A control is `pending` when its `status` is `PENDING`.
     *
     * @see {@link AbstractControl.status}
     *
     * @returns True if this control is in the process of conducting a validation check,
     * false otherwise.
     */
    readonly pending: boolean;
    /**
     * A control is `disabled` when its `status` is `DISABLED`.
     *
     * Disabled controls are exempt from validation checks and
     * are not included in the aggregate value of their ancestor
     * controls.
     *
     * @see {@link AbstractControl.status}
     *
     * @returns True if the control is disabled, false otherwise.
     */
    readonly disabled: boolean;
    /**
     * A control is `enabled` as long as its `status` is not `DISABLED`.
     *
     * @returns True if the control has any status other than 'DISABLED',
     * false if the status is 'DISABLED'.
     *
     * @see {@link AbstractControl.status}
     *
     */
    readonly enabled: boolean;
    /**
     * An object containing any errors generated by failing validation,
     * or null if there are no errors.
     */
    /**
     * A control is `pristine` if the user has not yet changed
     * the value in the UI.
     *
     * @returns True if the user has not yet changed the value in the UI; compare `dirty`.
     * Programmatic changes to a control's value do not mark it dirty.
     */
    readonly pristine: boolean;
    /**
     * A control is `dirty` if the user has changed the value
     * in the UI.
     *
     * @returns True if the user has changed the value of this control in the UI; compare `pristine`.
     * Programmatic changes to a control's value do not mark it dirty.
     */
    readonly dirty: boolean;
    /**
     * True if the control is marked as `touched`.
     *
     * A control is marked `touched` once the user has triggered
     * a `blur` event on it.
     */
    readonly touched: boolean;
    /**
     * True if the control has not been marked as touched
     *
     * A control is `untouched` if the user has not yet triggered
     * a `blur` event on it.
     */
    readonly untouched: boolean;
    /**
     * A multicasting observable that emits an event every time the value of the control changes, in
     * the UI or programmatically.
     */
    readonly valueChanges: Observable<any>;
    /**
     * A multicasting observable that emits an event every time the validation `status` of the control
     * recalculates.
     *
     * @see {@link AbstractControl.status}
     *
     */
    readonly statusChanges: Observable<any>;
    /**
     * Marks the control as `touched`. A control is touched by focus and
     * blur events that do not change the value.
     *
     * @see `markAsUntouched()`
     * @see `markAsDirty()`
     * @see `markAsPristine()`
     *
     * @param opts Configuration options that determine how the control propagates changes
     * and emits events events after marking is applied.
     * * `onlySelf`: When true, mark only this control. When false or not supplied,
     * marks all direct ancestors. Default is false.
     */
    markAsTouched(opts?: {
        onlySelf?: boolean;
    }): void;
    /**
     * Marks the control as `untouched`.
     *
     * If the control has any children, also marks all children as `untouched`
     * and recalculates the `touched` status of all parent controls.
     *
     * @see `markAsTouched()`
     * @see `markAsDirty()`
     * @see `markAsPristine()`
     *
     * @param opts Configuration options that determine how the control propagates changes
     * and emits events after the marking is applied.
     * * `onlySelf`: When true, mark only this control. When false or not supplied,
     * marks all direct ancestors. Default is false.
     */
    markAsUntouched(opts?: {
        onlySelf?: boolean;
    }): void;
    /**
     * Marks the control as `dirty`. A control becomes dirty when
     * the control's value is changed through the UI; compare `markAsTouched`.
     *
     * @see `markAsTouched()`
     * @see `markAsUntouched()`
     * @see `markAsPristine()`
     *
     * @param opts Configuration options that determine how the control propagates changes
     * and emits events after marking is applied.
     * * `onlySelf`: When true, mark only this control. When false or not supplied,
     * marks all direct ancestors. Default is false.
     */
    markAsDirty(opts?: {
        onlySelf?: boolean;
    }): void;
    /**
     * Marks the control as `pristine`.
     *
     * If the control has any children, marks all children as `pristine`,
     * and recalculates the `pristine` status of all parent
     * controls.
     *
     * @see `markAsTouched()`
     * @see `markAsUntouched()`
     * @see `markAsDirty()`
     *
     * @param opts Configuration options that determine how the control emits events after
     * marking is applied.
     * * `onlySelf`: When true, mark only this control. When false or not supplied,
     * marks all direct ancestors. Default is false..
     */
    markAsPristine(opts?: {
        onlySelf?: boolean;
    }): void;
    /**
     * Marks the control as `pending`.
     *
     * A control is pending while the control performs async validation.
     *
     * @see {@link AbstractControl.status}
     *
     * @param opts Configuration options that determine how the control propagates changes and
     * emits events after marking is applied.
     * * `onlySelf`: When true, mark only this control. When false or not supplied,
     * marks all direct ancestors. Default is false..
     * * `emitEvent`: When true or not supplied (the default), the `statusChanges`
     * observable emits an event with the latest status the control is marked pending.
     * When false, no events are emitted.
     *
     */
    markAsPending(opts?: {
        onlySelf?: boolean;
        emitEvent?: boolean;
    }): void;
    /**
     * Disables the control. This means the control is exempt from validation checks and
     * excluded from the aggregate value of any parent. Its status is `DISABLED`.
     *
     * If the control has children, all children are also disabled.
     *
     * @see {@link AbstractControl.status}
     *
     * @param opts Configuration options that determine how the control propagates
     * changes and emits events after the control is disabled.
     * * `onlySelf`: When true, mark only this control. When false or not supplied,
     * marks all direct ancestors. Default is false..
     * * `emitEvent`: When true or not supplied (the default), both the `statusChanges` and
     * `valueChanges`
     * observables emit events with the latest status and value when the control is disabled.
     * When false, no events are emitted.
     */
    disable(opts?: {
        onlySelf?: boolean;
        emitEvent?: boolean;
    }): void;
    /**
     * Enables the control. This means the control is included in validation checks and
     * the aggregate value of its parent. Its status recalculates based on its value and
     * its validators.
     *
     * By default, if the control has children, all children are enabled.
     *
     * @see {@link AbstractControl.status}
     *
     * @param opts Configure options that control how the control propagates changes and
     * emits events when marked as untouched
     * * `onlySelf`: When true, mark only this control. When false or not supplied,
     * marks all direct ancestors. Default is false..
     * * `emitEvent`: When true or not supplied (the default), both the `statusChanges` and
     * `valueChanges`
     * observables emit events with the latest status and value when the control is enabled.
     * When false, no events are emitted.
     */
    enable(opts?: {
        onlySelf?: boolean;
        emitEvent?: boolean;
    }): void;
    /**
     * Sets the value of the control. Abstract method (implemented in sub-classes).
     */
    setValue(value: any, options?: Object): void;
    /**
     * Patches the value of the control. Abstract method (implemented in sub-classes).
     */
    patchValue(value: any, options?: Object): void;
    /**
     * Resets the control. Abstract method (implemented in sub-classes).
     */
    reset(value?: any, options?: Object): void;
    /**
     * Recalculates the value and validation status of the control.
     *
     * By default, it also updates the value and validity of its ancestors.
     *
     * @param opts Configuration options determine how the control propagates changes and emits events
     * after updates and validity checks are applied.
     * * `onlySelf`: When true, only update this control. When false or not supplied,
     * update all direct ancestors. Default is false..
     * * `emitEvent`: When true or not supplied (the default), both the `statusChanges` and
     * `valueChanges`
     * observables emit events with the latest status and value when the control is updated.
     * When false, no events are emitted.
     */
    updateValueAndValidity(opts?: {
        onlySelf?: boolean;
        emitEvent?: boolean;
    }): void;
    /**
     * Sets errors on a form control when running validations manually, rather than automatically.
     *
     * Calling `setErrors` also updates the validity of the parent control.
     *
     * @usageNotes
     * ### Manually set the errors for a control
     *
     * ```
     * const login = new FormControl('someLogin');
     * login.setErrors({
     *   notUnique: true
     * });
     *
     * expect(login.valid).toEqual(false);
     * expect(login.errors).toEqual({ notUnique: true });
     *
     * login.setValue('someOtherLogin');
     *
     * expect(login.valid).toEqual(true);
     * ```
     */
    /**
     * Retrieves a child control given the control's name or path.
     *
     * @param path A dot-delimited string or array of string/number values that define the path to the
     * control.
     *
     * @usageNotes
     * ### Retrieve a nested control
     *
     * For example, to get a `name` control nested within a `person` sub-group:
     *
     * * `this.form.get('person.name');`
     *
     * -OR-
     *
     * * `this.form.get(['person', 'name']);`
     */
    get(path: Array<string | number> | string): AbstractControl | null;
    /**
     * @description
     * Reports error data for the control with the given path.
     *
     * @param errorCode The code of the error to check
     * @param path A list of control names that designates how to move from the current control
     * to the control that should be queried for errors.
     *
     * @usageNotes
     * For example, for the following `FormGroup`:
     *
     * ```
     * form = new FormGroup({
     *   address: new FormGroup({ street: new FormControl() })
     * });
     * ```
     *
     * The path to the 'street' control from the root form would be 'address' -> 'street'.
     *
     * It can be provided to this method in one of two formats:
     *
     * 1. An array of string control names, e.g. `['address', 'street']`
     * 1. A period-delimited list of control names in one string, e.g. `'address.street'`
     *
     * @returns error data for that particular error. If the control or error is not present,
     * null is returned.
     */
    getError(errorCode: string, path?: Array<string | number> | string): any;
    /**
     * @description
     * Reports whether the control with the given path has the error specified.
     *
     * @param errorCode The code of the error to check
     * @param path A list of control names that designates how to move from the current control
     * to the control that should be queried for errors.
     *
     * @usageNotes
     * For example, for the following `FormGroup`:
     *
     * ```
     * form = new FormGroup({
     *   address: new FormGroup({ street: new FormControl() })
     * });
     * ```
     *
     * The path to the 'street' control from the root form would be 'address' -> 'street'.
     *
     * It can be provided to this method in one of two formats:
     *
     * 1. An array of string control names, e.g. `['address', 'street']`
     * 1. A period-delimited list of control names in one string, e.g. `'address.street'`
     *
     * If no path is given, this method checks for the error on the current control.
     *
     * @returns whether the given error is present in the control at the given path.
     *
     * If the control is not present, false is returned.
     */
    hasError(errorCode: string, path?: Array<string | number> | string): boolean;
    /**
     * Retrieves the top-level ancestor of this control.
     */
    readonly root: AbstractControl;
}
