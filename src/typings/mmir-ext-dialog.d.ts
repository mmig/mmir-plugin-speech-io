import type { Cmd , ShowSpeechStateOptions , SpeechFeedbackOptions , RecognitionEmma , UnderstandingEmma , ReadingOptions , StopReadingOptions , ReadingShowOptions , TactileEmma, Emma } from './';

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
