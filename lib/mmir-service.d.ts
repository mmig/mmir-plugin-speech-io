import { Subject, BehaviorSubject } from 'rxjs';
import { PlayError, LogLevel, LogLevelNum } from 'mmir-lib';
import { ShowSpeechStateOptions, SpeechFeedbackOptions, RecognitionEmma, UnderstandingEmma, ReadingOptions, StopReadingOptions, ReadingShowOptions, Cmd, TactileEmma, Emma, ASRError, TTSError } from './typings/';
import { IAppSettings } from './typings/';
import { SpeechEventEmitter, WaitReadyOptions, ExtMmirModule } from './typings/';
interface SpeechEventEmitterImpl<CmdImpl extends Cmd> extends SpeechEventEmitter<CmdImpl> {
    showSpeechInputState: BehaviorSubject<ShowSpeechStateOptions>;
    changeMicLevels: BehaviorSubject<SpeechFeedbackOptions>;
    waitReadyState: BehaviorSubject<WaitReadyOptions>;
    showDictationResult: Subject<RecognitionEmma>;
    determineSpeechCmd: Subject<RecognitionEmma>;
    execSpeechCmd: Subject<UnderstandingEmma<CmdImpl>>;
    cancelSpeechIO: Subject<void>;
    read: Subject<string | ReadingOptions>;
    stopReading: Subject<StopReadingOptions>;
    showReadingStatus: BehaviorSubject<ReadingShowOptions>;
    tactile: Subject<TactileEmma>;
    unknown: Subject<Emma>;
    asrError: Subject<ASRError>;
    ttsError: Subject<TTSError>;
    playError: Subject<PlayError>;
}
export declare class MmirService<CmdImpl extends Cmd> {
    protected evt: SpeechEventEmitterImpl<CmdImpl>;
    protected appConfig: IAppSettings;
    protected _isCreateAppConfigImpl: boolean;
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
    init(appConfig: IAppSettings, ..._args: any[]): Promise<MmirService<CmdImpl>>;
    private initDebugVui;
    ready(): Promise<MmirService<CmdImpl>>;
    protected mmirInit(): Promise<MmirService<CmdImpl>>;
    setSpeechIoDebugLevel(logLevel: LogLevel | LogLevelNum): void;
}
export {};
