import { MediaManager, TTSOptions } from 'mmir-lib';
import { StopReadingOptions } from '../typings/';
import { IPromptHandler, SpeechIoManager } from '../typings/';
import { ConfigurationManager_NEW } from '../util/CongiurationManagerCompat';
export declare class PromptReader {
    private dlg;
    private config;
    private media;
    protected _ttsActive: boolean;
    /** if TTS is currently active */
    get active(): boolean;
    protected _ttsCtx?: string;
    /** context for tts(): set to FALSY for default context
     * @see mmir.media.setDefaultCtx(ctx: string | null)
     *
     * @example
     * // set via configurationManager
     * mmir.conf.set('speechio.ttsEngine', ttsCtx)
     */
    get ttsEngine(): string;
    protected _ttsDefaultOptions?: TTSOptions;
    /** default options for the TTS engine
     * @see mmir.media.tts(options: TTSOptions)
     *
     * NOTE: should not set `language` or `voice` here!
     *
     * (options for `text` or callbacks will be ignored)
     *
     * @example
     * // set via configurationManager
     * mmir.conf.set('speechio.ttsDefaultOptions', ttsOptions)
     */
    getDefaultOptions(): TTSOptions | undefined;
    protected _cancelOnNew: boolean;
    /** if a prompt is active, when a new one is requested: cancel the current one, or discard the new one?  */
    get cancelOnNew(): boolean;
    handler: IPromptHandler;
    constructor(dlg: SpeechIoManager<any>, config: ConfigurationManager_NEW, media: MediaManager);
    private initSettings;
    setActive(newState?: boolean): boolean;
    cancel(options?: StopReadingOptions): void;
    /**
     * semi-private HELPER: notify state-machine that prompt has stopped
     * @param options the reading options (NOTE if continuesReading is set, no stopped notification will be emitted)
     */
    stoppedPrompt(options?: StopReadingOptions): void;
    setHandler(handler: IPromptHandler): void;
    readPrompt(text: string | Array<string>): void;
    protected doRead(text: string | Array<string>): void;
    protected _isLog(): boolean;
    protected _isLogError(): boolean;
    protected _log(msg: string): void;
    protected _logError(msg: string, err?: any): void;
}
