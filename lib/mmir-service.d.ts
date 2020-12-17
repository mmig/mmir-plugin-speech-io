import { Subject, BehaviorSubject } from 'rxjs';
import { PlayError, LogLevel, LogLevelNum } from 'mmir-lib';
import { SpeechInputStateOptions, SpeechFeedbackOptions, RecognitionEmma, UnderstandingEmma, ReadingOptions, StopReadingOptions, ReadingStateOptions, Cmd, TactileEmma, Emma, ASRError, TTSError } from './typings/';
import { EmmaUtil } from './util/EmmaUtil';
import { SpeechEventEmitter, WaitReadyOptions, ExtMmirModule, ExtStateEngine } from './typings/';
export interface SpeechEventEmitterImpl<CmdImpl extends Cmd> extends SpeechEventEmitter<CmdImpl> {
    speechInputState: BehaviorSubject<SpeechInputStateOptions>;
    changeMicLevels: BehaviorSubject<SpeechFeedbackOptions>;
    waitReadyState: BehaviorSubject<WaitReadyOptions>;
    dictationResult: Subject<RecognitionEmma>;
    speechCommand: Subject<RecognitionEmma>;
    commandAction: Subject<UnderstandingEmma<CmdImpl>>;
    cancelSpeechIO: Subject<void>;
    read: Subject<string | ReadingOptions>;
    stopReading: Subject<StopReadingOptions>;
    readingState: BehaviorSubject<ReadingStateOptions>;
    tactile: Subject<TactileEmma>;
    tactileError: Subject<Emma>;
    asrError: Subject<ASRError>;
    ttsError: Subject<TTSError>;
    playError: Subject<PlayError>;
}
export declare class MmirService<CmdImpl extends Cmd> {
    protected evt: SpeechEventEmitterImpl<CmdImpl>;
    protected _mmir: ExtMmirModule<CmdImpl>;
    protected _initialize: Promise<MmirService<CmdImpl>>;
    protected _readyWait: Promise<MmirService<CmdImpl>>;
    protected _resolveReadyWait: (mmirProvider: MmirService<CmdImpl>) => void;
    protected _readyWaitTimer: number;
    protected readonly _readyWaitTimeout: number;
    protected isDebugVui: boolean;
    get mmir(): ExtMmirModule<CmdImpl>;
    get speechEvents(): SpeechEventEmitterImpl<CmdImpl>;
    constructor(mmir: ExtMmirModule<CmdImpl>);
    protected init(): Promise<MmirService<CmdImpl>>;
    /** NOTE must not be called before mmir.ready() has been emitted */
    private initDebugVui;
    ready(): Promise<MmirService<CmdImpl>>;
    protected mmirInit(inputInitConfig?: {
        [field: string]: any;
    } | Promise<any>, dialogInitConfig?: {
        [field: string]: any;
    } | Promise<any>): Promise<MmirService<CmdImpl>>;
    /**
     * HELPER circumvent message-queue for init-event:
     *       (this allows to pass non-stringified and non-stringifyable object instances)
     */
    protected raiseInternalInit(stateMachine: ExtStateEngine, baseConfig: {
        mmir: ExtMmirModule<CmdImpl>;
        emma: EmmaUtil<CmdImpl>;
        [field: string]: any;
    }, managerInitConfig?: {
        [field: string]: any;
    }): void | Promise<void>;
    setSpeechIoDebugLevel(logLevel: LogLevel | LogLevelNum): void;
}
