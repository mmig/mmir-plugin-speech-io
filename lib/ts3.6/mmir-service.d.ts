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
export interface EngineInitConfig {
    dialogInitConfig?: {
        [field: string]: any;
    } | Promise<any>;
    inputInitConfig?: {
        [field: string]: any;
    } | Promise<any>;
}
export interface SpeechIoInitConfig extends EngineInitConfig {
    speechIoInitConfig?: {
        [field: string]: any;
    } | Promise<any>;
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
    readonly mmir: ExtMmirModule<CmdImpl>;
    readonly speechEvents: SpeechEventEmitterImpl<CmdImpl>;
    constructor(mmir: ExtMmirModule<CmdImpl>);
    protected init(engineConfig?: SpeechIoInitConfig): Promise<MmirService<CmdImpl>>;
    /** NOTE must not be called before mmir.ready() has been emitted */
    private initDebugVui;
    ready(): Promise<MmirService<CmdImpl>>;
    protected mmirInit(engineConfig?: SpeechIoInitConfig): Promise<MmirService<CmdImpl>>;
    /**
     * send 'init' events to mmir.inputEngine and mmir.dialogEngine
     *
     * By default, the init-events have data attached with
     * ```
     * {
     *   mmir: ExtMmirModule<CmdImpl>,
     *   emma: EmmaUtil<CmdImpl>,
     * }
     * ```
     * These init-data can be extended using param `engineConfig`.
     * If `engineConfig` is a promise, then the promise is resolved, before sending
     * the init event to the engines.
     *
     * @param [engineConfig] optional additional data for the init events
     * @param [asyncInitTaskList] optional a list for async task: if the list is specified and additional init data is specified, their promise will be added to the list
     */
    protected initDialogAndInputEngine(engineConfig?: EngineInitConfig, asyncInitTaskList?: Promise<any>[]): void;
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
