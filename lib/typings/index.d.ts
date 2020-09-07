

import type { Observable as RxObservable } from 'rxjs';

///////////////////////// HACK: typings from @angular/forms TODO should define own, independent interface ////////////////

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
    // validator: ValidatorFn | null;
    // asyncValidator: AsyncValidatorFn | null;
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
    // readonly parent: FormGroup | FormArray;
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
    // readonly errors: ValidationErrors | null;
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
    readonly valueChanges: RxObservable<any>;
    /**
     * A multicasting observable that emits an event every time the validation `status` of the control
     * recalculates.
     *
     * @see {@link AbstractControl.status}
     *
     */
    readonly statusChanges: RxObservable<any>;

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
    // /**
    //  * @param parent Sets the parent of the control
    //  */
    // setParent(parent: FormGroup | FormArray): void;
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
    // setErrors(errors: ValidationErrors | null, opts?: {
    //     emitEvent?: boolean;
    // }): void;
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


/**
 * subset of (and loosly based on) ionic/Storage:
 *
 * provides either static/default settings, or persistent customizable user
 * settings.
 *
 */
export interface IAppSettings {
    /**
     * Get the value associated with the given key.
     * @param {any} key the key to identify this value
     * @returns {Promise} Returns a promise with the value of the given key
     */
    get(key: string): Promise<any>;
    /**
     * Set the value for the given key.
     * @param {any} key the key to identify this value
     * @param {any} value the value for this key
     * @returns {Promise} Returns a promise that resolves when the key and value are set
     */
    set(key: string, value: any): Promise<any>;
    /**
     * Remove any value associated with this key.
     * @param {any} key the key to identify this value
     * @returns {Promise} Returns a promise that resolves when the value is removed
     */
    remove(key: string): Promise<any>;
}




export type EmmaFunctionType = 'recognition' | 'understanding' | 'gesture' | EmmaFunction;
export type AnyEmma<CmdImpl extends Cmd> = Emma | RecognitionEmma | UnderstandingEmma<CmdImpl> | TactileEmma;
export type RecognitionData = Array<any>;//really: argument-list of recognition-callback, see ASROnStatus
export type UnderstandingData = {semantic: any, phrase: string, phrases: Array<string>};

export interface EventLike {
  type: 'click' | 'speech' | string;
  [additionalFields: string]: any;
}



////////////// Speech Input Controller interfaces ///////////////////////////

export interface ISpeechState {

  /**
   * Called when GUI should update visual feedback for current Speech Input state.
   * @param {ShowSpeechStateOptions} options the data specifying the (changed) speech input state etc.
   */
  showSpeechInputState(options: ShowSpeechStateOptions): void;
}

export interface ISpeechFeedback {

  /**
   * If <code>options.isStart === true</code>:
   * Called when GUI should show indicator for Microphone input levels.
   *
   * This should also initialize/start listening to mic-levels changes, e.g.
   * register a listener:
   * <pre>
   * mmir.MediaManager.on('miclevelchanged', miclevelsChandeHandler);
   * </pre>
   * where miclevelsChandeHandler:
   *    function(micLevel: number)
   *
   *
   * If <code>options.isStart === false</code>:
   * Called when GUI should hide/deactivate indicator for Microphone input levels.
   *
   * This should destroy/free resource that were set up for visualizing mic-level
   * changes, e.g. could stop listening to mic-level changes, i.e. unregister listener:
   * <pre>
   * mmir.MediaManager.off('miclevelchanged', miclevelsChandeHandler);
   * </pre>
   *
   * @param {SpeechFeedbackOptions} options
   *              the data specifying the (changed) speech input state etc.
   */
  changeMicLevels(options: SpeechFeedbackOptions): void;

}

export interface ISpeechDictate {
  /**
   * Called for processing dictated text.
   *
   * E.g. text could  be visualized/shown in GUI, and/or stored internally etc.
   *
   * @param  {RecognitionEmma} emma the EMMA event contain an ASR result(s) from
   *                                 speech recognition.
   */
  showDictationResult(asrEmmaEvent: RecognitionEmma): void;
}

export interface ISpeechCommand {

  /**
   * Called for determining the understanding of an ASR result.
   *
   * E.g. apply a grammar to the ASR text, or keyword spotting, or some other
   * kind of "natural language understanding" (NLU).
   *
   * With the NLU result, this function should invoke
   * <pre>
   * InputManager.raise('speech', understandingResult);
   * </pre>
   * for the understood ASR, where understandingResult should have type UnderstandigResult.
   *
   * NOTE: for "not understood" ASR text, there could be a corresponding Command
   *       (i.e. calling InputManager.raise('speech', notUnderstoodCmd)) or some
   *       other form of feedback/processing should be triggered.
   *
   * @param  {RecognitionEmma} emma the EMMA event contain an ASR result(s) from
   *                                 speech recognition.
   */
  determineSpeechCmd(asrEmmaEvent: RecognitionEmma): void;
  /**
   * Called for "applying" an understood command.
   *
   * This function should select the "best" command(s) from semanticEmmaEvent and
   * execute it/them.
   *
   * When selecting / before executing, it should be checked, if the commands can
   * actually be executed.
   *
   * If no "best" command can be selected/executed, this function should instead invoke
   * a diambiguation dialog (when there are some potential, but no clear command candiates)
   * or a feedback should be triggerd, stating that there was no corresponding command
   * found for the user input.
   *
   * @param  {semanticEmmaEvent} emma the EMMA event contain an understanding result with a list
   *                                    understood Cmd(s)
   */
  execSpeechCmd<CmdImpl extends Cmd>(semanticEmmaEvent: UnderstandingEmma<CmdImpl>): void;

}

export interface ISpeechInputProcessor extends ISpeechState, ISpeechFeedback, ISpeechDictate, ISpeechCommand {

    /**
     * Called when speech input (ASR; recogintion) AND speech output (TTS; synthesis)
     * should be stopped.
     */
    cancelSpeechIO(): void;
}

////////////// Speech Output Controller interfaces ///////////////////////////

export interface ISpeechOutput {

  /**
   * Called when text should should be read.
   *
   * When reading starts, the function must trigger the "reading-started" event:
   *
   * <pre>
   * mmir.speechioManager.raise('reading-started')
   * </pre>
   *
   * After reading the text (or an error occured, preventing to read the text),
   * the function must trigger the "reading-stopped" event:
   *
   * <pre>
   * mmir.speechioManager.raise('reading-stopped')
   * </pre>
   *
   *
   * @param  {string|ReadingOptions} data the data for determining the text the should be read
   *                                      (if string: corresponds to the ReadingOptions.pageId)
   *
   * @returns {void|boolean} if data.test === true, the function return TRUE, if the
   *                            reading-request is valid (e.g. if reading is context-sensitive)
   */
  read(data: string|ReadingOptions): void | boolean;

  /**
   * Called when reading should be stopped / aborted.
   *
   * If reading is/was active and is stopped, the "reading-stopped" event must be
   * triggered:
   *
   * <pre>
   * mmir.speechioManager.raise('reading-stopped')
   * </pre>
   *
   * @param  {StopReadingOptions} data the data specifying, which TTS engine should be stopped
   */
  stopReading(options: StopReadingOptions): void;

  /**
   * Called for updating feedback about the reading status.
   *
   * E.g. for options.active === true, this should start reading-feedback,
   * for example, showing some visual feedback that reading is starting.
   *
   * For options.active === false, this function should stop the read-feedback
   * (if some feedback was started).
   *
   * @param  {ReadingShowOptions} options the data for updating the reading status feedback
   */
  showReadingStatus(options: ReadingShowOptions): void;

}

////////////// Guided Speech Input Controller interfaces /////////////////////
////////////// (triggered when input_mode === 'guided') //////////////////////

//TODO add doc for guided input
export interface IGuidedSpeechInput {

  // _util.ctrlGuided.perform('resetGuidedInputForCurrentControl');
  resetGuidedInputForCurrentControl(): void;
  // _util.ctrlGuided.perform('startGuidedInput');
  startGuidedInput(): void;
  // _util.ctrlGuided.perform('resetGuidedInput');
  resetGuidedInput(): void;

  // _util.ctrlSpeechIn.perform('isDictAutoProceed')
  isDictAutoProceed(): boolean;
}


////////////// Speech Input data interfaces /////////////////////

export type SpeechMode = 'command' | 'dictation';//TODO shorten these (need to change SCXML): 'cmd' | 'dict'
export type SpeechInputMode = '' | 'guided';// '' (DEFAULT) | 'guided' //TODO should this be a 3rd type for SpeechMode? would need to change SCXML / utils!

export interface ShowSpeechStateOptions {
  state: boolean;// is active/inactive
  mode: SpeechMode;
  inputMode: SpeechInputMode;	// '' (default) | 'guided'
  targetId?: any;//target-id for GUI widget (which should show/update its Speech State feedback)
}

export interface SpeechFeedbackOptions extends ShowSpeechStateOptions {
  //indicates that mic-levels feedback should be initialized (and possibly started) now
  isStart?: boolean;
}

export interface ReadingOptions {
  //context for reading target (may also be used for selecting reading target/text)
  contextId?: any;
  //selecting reading target / text (subcategory) -- specific readingIds may specify system prompts
  readingId?: any;
  //target ID for restarting speech-input after prompt was read.
  targetId?: any;
  //should not actually start but only return TRUE if reading-request is valid (e.g. if reading is context-sensitive)
  test?: boolean;
  //if readingId refers to a general/type of prompt ID, this field may contain the concrete text that should be read and/or additional information for generating the prompt
  readingData?: ReadingData;

  /**
   * if TRUE, will stop reading prompts:
   *  * if no prompt is currently active, nothing will be done
   *  * if a prompt is active, the active prompt will be stopped
   *
   * DEFAULT behavior:
   *   * if no prompt is active, the new one will start
   *   * if a prompt is active:
   *     * if prompt with same ID, prompt will be stopped
   *     * if prompt with different ID, active prompt will be stopped, and new one will be started
   *
   * @default false
   */
  stopReading?: boolean;
  /**
   * if set to TRUE and encountering an active prompt with the same readingId:
   * will stop current prompt and continue with new prompt (i.e. "restart" prompt with same ID)
   *
   * DEFAULT behavior if encountering an active prompt with same readingId:
   * stop reading and cancel/do not start reading new prompt.
   *
   * @default false
   */
  cancelActivePrompts?: boolean;
}

export interface ReadingShowOptions extends ReadingOptions {
  /**context for reading target (may also be used for selecting reading target/text)*/
  contextId: any;
  /**if reading is active or inactive*/
  active: boolean;
}

export interface StopReadingOptions extends ReadingShowOptions {

  /**when guided speech input is active: indicates that speech-guidance should be canceled*/
  cancelGuidance?: boolean;

  /**indicates that current prompt/readingId stops, but another prompt will continue after this one has stopped*/
  continuesReading?: boolean;
}

export interface ReadingData {
  promptText?: string | Array<string>;//(general) system prompt that should be read to the user
  textCmds?: string | Array<string>;//text representing a command (or command list)
  tryCount?: number;//TODO remove? too app specific? -> re-try count for mis-/not understood commands
}

////////////////////////////////////// EMMA ////////////////////////////////////////


export type EmmaMode = 'voice' | 'gui' | 'keys' | 'video' | 'photograph' | 'dtmf' | 'ink' | string;
export type EmmaFunction = 'recording' | 'transcription' | 'dialog' | 'verification' | string;
export type EmmaDeviceType = 'microphone'|'keypad'|'keyboard'|'touchscreen'|'touchpad'|'mouse'|'pen'|'joystick'|'thumbwheel'|'camera_2d'|'camera_3d'|'scanner'|string;
export type EmmaMedium = 'acoustic' | 'tactile' | 'visual';
export type EmmaGestureType = 'click' | 'touch' | 'swipe';//TODO add more gesture types
export type RecognitionType = 'FINAL' | 'INTERMEDIATE' | 'INTERIM';


export interface Emma {
    interpretation: Interpretation;
}

export interface RecognitionEmma extends Emma {
    interpretation: RecognitionInterpretation;
}

export interface UnderstandingEmma<CmdImpl extends Cmd> extends Emma {
    interpretation: UnderstandingInterpretation<CmdImpl>;
}

export interface TactileEmma extends Emma {
    interpretation: TactileInterpretation;
}

export interface Interpretation {
    /** (absolute) timestamp for start */
    start: number;
    /** (absolute) timestamp for end */
    end?: number;
    /** (application wide) ID for the interpretation */
    id: number | string;
    /** the mode used for the interpretation input  */
    mode: EmmaMode;
    /** the medium ~ "type of sensor" that captures the user input */
    medium: EmmaMedium;

    /** distinguishes verbal use of an input mode from non-verbal, supplying a command via written words vs. symbolic input like drawn arrows */
    verbal?: boolean

    deviceType?: EmmaDeviceType;

    /**
     * IETF Best Current Practice 47
     * @see https://www.rfc-editor.org/rfc/bcp/bcp47.txt
     * @example "fr"
     * @example "en-US"
     */
    lang?: string;
    /** The source of an interpreted input
     * @example "http://example.com/microphone/NC-61"
     * @example "http://example.com/microphone/NC-4024"
     */
    source?: string;
    /** application specific ID for identifying a dialog turn */
    dialogTurn?: string;

    /** the (intended) use of the interpretation */
    function?: EmmaFunction;

    location?: EmmaLocation;

    //non-emma-spec attributes:
    /** target of the interpretation, e.g. ID of the button that started the evaluation/interpretation */
    target?: any;
    /** the (application specific) value of the interpretation */
    value?: any;
}

export interface EmmaLocation {
    id: number | string;
    latitude?: number;
    longitude?: number;
    accuracy?: number;
    altitude?: number;
    altitudeAccuracy?: number;
    heading?: number;
    speed?: number;
    description?: string;
    address?: string;
}

export interface SpeechInterpretation extends Interpretation {
    mode: 'voice';
    medium: 'acoustic';

    // non-emma-spec attributes:
    speechMode: SpeechInterpretation;
    isGuided?: boolean;
    context?: 'form-overlay'//information for special app/gui context from which the ASR was triggered
    inputMode?: SpeechInputMode;
}

export interface RecognitionInterpretation extends SpeechInterpretation {
    function: 'recognition';
    value: RecognitionFunc;
}

export interface UnderstandingInterpretation<CmdImpl extends Cmd> extends SpeechInterpretation {
    function: 'understanding';
    value: UnderstandingFunc<CmdImpl>;
}

export interface TactileInterpretation extends Interpretation {
    mode: 'gui';
    medium: 'tactile';
    function: 'gesture';
    value: TactileFunc;
}

export interface Func {
    recognition?: SpeechRecognitionResult[];
    gesture?: Gesture;
}

export interface RecognitionFunc extends Func {
    recognition: SpeechRecognitionResult[];
}

export interface SpeechRecognitionResult {
    id: any;
    confidence: number;
    type: RecognitionType;
    text: string;
    unstable?: string;
}

export interface UnderstandingFunc<CmdImpl extends Cmd> extends Func {
    understandig: UnderstandigResult<CmdImpl>;
}

export interface TactileFunc extends Func {
  gesture: Gesture;
}

export interface Gesture {
  name: string;
  data?: any;
  type: EmmaGestureType;
  reference: GestureSource;
}

export interface GestureSource {
  /** value of element.tagName attribute (if present) */
  type?: string;
  /** value of element.id attribute (if present) */
  id?: string;
  /** value of element.name attribute (if present) */
  name?: string;
  /** css classes of element.className attribute (if present) */
  classes?: {[className: string]: string};
  /** entries of element.dataset attribute (if present) */
  data?: {[dataName: string]: string};
}

////////////////////////////////////// Speech Commands /////////////////////////////

export interface UnderstandigResult<CmdImpl extends Cmd> {
  id: number;		//INT "server-wide" ID
  start: number;	//INT UNIX timestamp (incl. milli-seconds)
  sourceId: number;		//INT interpretation-ID from the request (i.e. req.interpretation.id)
  nlu: Array<CmdImpl>;
}

export interface Cmd {
    // action: CmdType;
    // param: CmdParam;
    confidence: number;//range [0,1]
}



import type { Observable } from 'rxjs';

import type { MmirModule , DialogManager, InputManager , DialogEngine , PlayError } from 'mmir-lib';
import type { EmmaUtil } from '../util/EmmaUtil';
import type { FeedbackOption } from '../io/HapticFeedback';

export interface WrappedElement {
  nativeElement: any;
}

export interface ContainedElement {
  el: HTMLElement;
}

export type GuiElement = WrappedElement | ContainedElement | HTMLElement;


export interface WaitReadyOptions {
  state: 'wait' | 'ready';
  module: string;
}

export interface ASRError {
  type: 'asr';
  error: string | Error | any;
}

export interface TTSError {
  type: 'tts';
  error: string | Error | any;
}

export type SpeechEventName = 'showSpeechInputState' |                  //ISpeechState
                        'changeMicLevels' | 'waitReadyState' |          //ISpeechFeedback
                        'showDictationResult' |                         //ISpeechDictate
                        'determineSpeechCmd' | 'execSpeechCmd' |        //ISpeechCommand
                        'cancelSpeechIO' |                              //ISpeechInputProcessor
                        'read' | 'stopReading' | 'showReadingStatus' |  //ISpeechOutput
                        'playError' |                                   // rejected audio.play() promise (e.g. due to auto-play policy -> because user did not interact yet with page)
                        'resetGuidedInputForCurrentControl' | 'startGuidedInput' | 'resetGuidedInput' | 'isDictAutoProceed' //IGuidedSpeechInput
                        ;

export interface SpeechEventEmitter<CmdImpl extends Cmd> {
    showSpeechInputState: Observable<ShowSpeechStateOptions>;
    changeMicLevels: Observable<SpeechFeedbackOptions>;
    waitReadyState: Observable<WaitReadyOptions>;
    showDictationResult: Observable<RecognitionEmma>;
    determineSpeechCmd: Observable<RecognitionEmma>;
    execSpeechCmd: Observable<UnderstandingEmma<CmdImpl>>;
    cancelSpeechIO: Observable<void>;
    read: Observable<string|ReadingOptions>;
    stopReading: Observable<StopReadingOptions>;
    showReadingStatus: Observable<ReadingShowOptions>;
    //'resetGuidedInputForCurrentControl' | 'startGuidedInput' | 'resetGuidedInput' | 'isDictAutoProceed'
    tactile: Observable<TactileEmma>;
    unknown: Observable<Emma>;
    asrError: Observable<ASRError>;
    ttsError: Observable<TTSError>;
    playError: Observable<PlayError>;
}

export interface IPromptHandler {
  willReadPrompt(contextId: number | string, readingId: number | string, willPauseAsr?: boolean): boolean;
  preparePrompt(readingData: ReadingOptions): string | Array<string>;
  isCommandPrompt?: (readingId: number | string) => boolean;
}

export interface EmmaModule<CmdImpl extends Cmd> {
  emma: EmmaUtil<CmdImpl>;
}

export interface SpeechIoManager<CmdImpl extends Cmd> extends DialogManager, EmmaModule<CmdImpl> {
  emit: (actionName: string, data?: any) => any;
  eventEmitter: SpeechEventEmitter<CmdImpl>;
  _isDebugVui: boolean;
}

export interface ExtStateEngine extends DialogEngine {
  worker: any;
}

export interface ExtMmirModule<CmdImpl extends Cmd> extends MmirModule, EmmaModule<CmdImpl> {
  speechioManager: SpeechIoManager<CmdImpl>;
  speechioEngine: ExtStateEngine;
  speechioInput: InputManager;
  speechioInputEngine: ExtStateEngine;
}

export interface InputOutputOption extends FeedbackOption {
  // /**
  //  * if explicitly set to FALSE, active ASR will not be canceled
  //  */
  // asrCancel?: boolean;
  /**
   * if explicitly set to FALSE, active TTS will not be canceled
   */
  ttsCancel?: boolean
}


export type ManagerFactory = () => StateManager;

export interface StateManager {
  raise: (eventName: string, data?: any) => void;
  _init: (moduleId: string, config: StateManagerConfig, isRegisterEngine?: boolean) => Promise<{manager: StateManager, engine: any}>;
}

export interface StateManagerConfig {
  modelUri: string;
  mode?: 'simple' | 'extended';
  engineId?: string;
  logLevel?: number | string;
}


export interface Targetable {
  target?: HTMLElement | EventTarget;
  currentTarget?: HTMLElement | EventTarget;
  [field: string]: any
}

export interface ISpeechInputIndicator {

  initialized: boolean;
  visible?: boolean;

  show(event: Targetable | any, target?: HTMLElement): void;
  toggle(event: Targetable | any, target?: HTMLElement): void;
  hide(): void;
  ready(overlayTarget?: OverlayTarget) : Promise<void>;
}

export interface ISpeechOutputIndicator {

  initialized: boolean;
  visible?: boolean;

  startReading(event: Targetable | any, target?: HTMLElement): void;
  stopReading(isLeaveOpen?: boolean): void;

  ready(overlayTarget?: OverlayTarget) : Promise<void>;
}

export interface OverlayTarget {
    target: HTMLElement;
    show: boolean;
}

