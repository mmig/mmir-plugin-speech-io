import { MediaManager } from 'mmir-lib';
import { StopReadingOptions } from '../typings/';
import { IPromptHandler, SpeechIoManager } from '../typings/';
export declare class PromptReader {
    private dlg;
    private media;
    protected _ttsActive: boolean;
    readonly active: boolean;
    /** context for tts(): set to FALSY for default context
     * @see mmir.media.setDefaultCtx(ctx: string | null)
     */
    ttsCtx?: string;
    voice?: string;
    pauseDuration?: number;
    handler: IPromptHandler;
    /** if a prompt is active, when a new one is requested: cancel the current one, or discard the new one?  */ cancelOnNew: boolean;
    constructor(dlg: SpeechIoManager<any>, media: MediaManager);
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
