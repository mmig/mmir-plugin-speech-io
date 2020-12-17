import type { Cmd , SpeechInputStateOptions , SpeechFeedbackOptions , RecognitionEmma , UnderstandingEmma , ReadingOptions , StopReadingOptions , ReadingStateOptions , TactileEmma, Emma } from './';
import type { Logger } from 'mmir-lib';

import type { Observable , Subject } from 'rxjs';

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

export type SpeechEventName = 'speechInputState' |                  //ISpeechState
                        'changeMicLevels' | 'waitReadyState' |      //ISpeechFeedback
                        'dictationResult' |                         //ISpeechDictate
                        'speechCommand' | 'commandAction' |    //ISpeechCommand
                        'cancelSpeechIO' |                          //ISpeechInputProcessor
                        'read' | 'stopReading' | 'readingState' |   //ISpeechOutput
                        'playError' |                               // rejected audio.play() promise (e.g. due to auto-play policy -> because user did not interact yet with page)
                        'asrError' | 'ttsError' |                   // errors during ASR and/or TTS
                        'tactile' | 'tactileError' |                      // tactile and raw tactile (i.e. tactileError) EMMA events
                        'resetGuidedInputForCurrentControl' | 'startGuidedInput' | 'resetGuidedInput' | 'isDictAutoProceed' //IGuidedSpeechInput
                        ;

export interface SpeechEventEmitter<CmdImpl extends Cmd> {
    /** notifys changes for speech-input state (i.e. recording started / stopped etc) */
    speechInputState: Observable<SpeechInputStateOptions>;
    /** notifys changes for microphone-levels */
    changeMicLevels: Observable<SpeechFeedbackOptions>;
    /** notifys changes regarding ready-wait state (i.e. when ASR or TTS are (temporarily) preparing input/output) */
    waitReadyState: Observable<WaitReadyOptions>;
    /** is triggered when new ARS results become available in `dication` mode */
    dictationResult: Observable<RecognitionEmma>;
    /** is triggered when new (stable) ARS results become available in `command` mode */
    speechCommand: Observable<RecognitionEmma>;
    /** is triggered when new actions for command interpretation(s) have been processed */
    commandAction: Observable<UnderstandingEmma<CmdImpl>>;
    /** is triggered when a prompt should be read */
    read: Observable<string|ReadingOptions>;
    /** notifys changes for speech-output i.e. reading state (i.e. reading started / stopped etc) */
      readingState: Observable<ReadingStateOptions>;
    /**
     * is triggered when speech input and output (i.e. ASR and TTS) should be canceled
     *
     * @see default implementation [[VoiceUiController.cancelSpeechIO]]
     */
    cancelSpeechIO: Observable<void>;
    /**
     * is triggered when current prompt should be canceled
     *
     * @see default implementation [[VoiceUiController.stopReading]]
     */
    stopReading: Observable<StopReadingOptions>;
    //'resetGuidedInputForCurrentControl' | 'startGuidedInput' | 'resetGuidedInput' | 'isDictAutoProceed'

    /** is triggered when a tactile interaction occured (e.g. via [[VoiceUiController.handleClick]]) */
    tactile: Observable<TactileEmma>;
    /** is triggered when an unknown (emma) interaction occured */
    tactileError: Observable<Emma>;
    /** is triggered when an ASR error occured */
    asrError: Observable<ASRError>;
    /** is triggered when an TTS error occured */
    ttsError: Observable<TTSError>;
    /**
     * is triggered when an audio play error occured:
     *
     * a special case for this is, when the execution environment (e.g. browser)
     * prohibits playing a sound or TTS audio due to the fact that the user did
     * not yet interact explicitly with the application (i.e. "supressing auto play").
     *
     * In this case, the application could show an error dialog/overlay that explicitly
     * forces the user to interact with the application and thus enable playing audio
     * for the future.
     */
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



export interface EventManager {
  emit: (actionName: string, data?: any) => any;
  eventEmitter: {[eventName: string]: Subject<any>} | SpeechEventEmitter<any>;
  _log: Logger;//FIXME when updating to mmir >= v6.2: remove
}

export interface SpeechIoManager<CmdImpl extends Cmd> extends DialogManager, EmmaModule<CmdImpl>, EventManager {
  _isDebugVui: boolean;
  eventEmitter: SpeechEventEmitter<CmdImpl>;
}

export interface ExtStateEngine extends DialogEngine {//FIXME when updating to mmir >= v6.2: change "extends DialogEngine" -> "extends StateEngine"
  worker: any;
}

export interface ExtDialogManager extends DialogManager, EmmaModule<any>, EventManager {
  eventEmitter: {[eventName: string]: Subject<any>};
}

export interface ExtMmirModule<CmdImpl extends Cmd> extends MmirModule, EmmaModule<CmdImpl> {
  speechioManager: SpeechIoManager<CmdImpl>;
  speechioEngine: ExtStateEngine;
  speechioInput: InputManager;
  speechioInputEngine: ExtStateEngine;

  dialog: ExtDialogManager;
  dialogEngine: ExtStateEngine;
  inputEngine: ExtStateEngine;
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
