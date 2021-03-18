

////////////// Speech Input Controller interfaces ///////////////////////////

export interface ISpeechState {

  /**
   * Called when GUI should update visual feedback for current Speech Input state.
   * @param {SpeechInputStateOptions} options the data specifying the (changed) speech input state etc.
   */
  speechInputState(options: SpeechInputStateOptions): void;
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
  dictationResult(asrEmmaEvent: RecognitionEmma): void;
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
  speechCommand(asrEmmaEvent: RecognitionEmma): void;
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
  commandAction<CmdImpl extends Cmd>(semanticEmmaEvent: UnderstandingEmma<CmdImpl>): void;

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
   * @param  {ReadingStateOptions} options the data for updating the reading status feedback
   */
  readingState(options: ReadingStateOptions): void;

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

export interface SpeechInputStateOptions {
  active: boolean;// is active/inactive
  mode: SpeechMode;
  inputMode: SpeechInputMode;	// '' (default) | 'guided'
  targetId?: any;//target-id for GUI widget (which should show/update its Speech State feedback)
}

export interface SpeechFeedbackOptions extends SpeechInputStateOptions {
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

export interface ReadingStateOptions extends ReadingOptions {
  /**context for reading target (may also be used for selecting reading target/text)*/
  contextId: any;
  /**if reading is active or inactive*/
  active: boolean;
}

export interface StopReadingOptions extends ReadingStateOptions {

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
    text: string;
    confidence: number;
    type: RecognitionType;
    unstable?: string;
    custom?: any;
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
