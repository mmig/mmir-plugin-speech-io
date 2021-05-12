import { MediaManager, TTSOptions, LanguageManager } from 'mmir-lib';
import { StopReadingOptions } from '../typings/';
import { IPromptHandler, SpeechIoManager } from '../typings/';
import { ConfigurationManager_NEW } from '../util/ConfigurationManagerCompat';
export declare class PromptReader {
    private dlg;
    private config;
    private media;
    private lang;
    protected _ttsActive: boolean;
    /*if TTS is currently active */
    readonly active: boolean;
    protected _ttsCtx?: string;
    /*context for tts(): set to FALSY for default context
    *
    * Change by set config value "ttsEngine".
    *
    * @see mmir.media.setDefaultCtx(ctx: string | null)
    *
    * @example
    * // set via configurationManager
    * mmir.conf.set('speechio.ttsEngine', ttsCtx)
    */
    readonly ttsEngine: string;
    protected _ttsDefaultOptions?: TTSOptions;
    /** default options for the TTS engine
     * @see mmir.media.tts(options: TTSOptions)
     *
     * NOTE: should not set `language` or `voice` here!
     *
     * (options for `text` or callbacks will be ignored)
     *
     * Change by set config value "ttsDefaultOptions" for
     * the corresponding language code.
     *
     * @example
     * // set via configurationManager for language "en"
     * mmir.conf.set('speechio.ttsDefaultOptions.en', ttsOptions)
     */
    getDefaultOptions(): TTSOptions | undefined;
    protected _cancelOnNew: boolean;
    /*
    * if a prompt is active, when a new one is requested:
    * cancel the current one, or discard the new one?
    *
    * Change by set config value "cancelOnNewPrompt".
    * @example
    * // set via configurationManager
    * mmir.conf.set('speechio.cancelOnNewPrompt', true);
    * @return [description]
    */
    readonly cancelOnNew: boolean;
    handler: IPromptHandler;
    constructor(dlg: SpeechIoManager<any>, config: ConfigurationManager_NEW, media: MediaManager, lang: LanguageManager);
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
    protected doGetDefaultReadingOptions(): any;
    protected _isLog(): boolean;
    protected _isLogError(): boolean;
    protected _log(msg: string): void;
    protected _logError(msg: string, err?: any): void;
}
