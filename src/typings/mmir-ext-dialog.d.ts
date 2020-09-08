import type { Cmd , ShowSpeechStateOptions , SpeechFeedbackOptions , RecognitionEmma , UnderstandingEmma , ReadingOptions , StopReadingOptions , ReadingShowOptions , TactileEmma, Emma, Logger } from './';

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
