import { Subscription } from 'rxjs';
import { PromptReader } from '../io/PromptReader';
import { ReadingOptions } from '../typings/';
import { SpeechEventName } from '../typings/';
import { MmirService } from '../mmir-service';
export declare class SpeechOutputController {
    protected prompt: PromptReader;
    protected _debugMsg: boolean;
    protected _speechEventSubscriptions: Map<SpeechEventName, Subscription>;
    debug: boolean;
    constructor(prompt: PromptReader, mmirProvider: MmirService<any>, ignoreMmirReady?: boolean);
    private init;
    destroy(): void;
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
     *                                      (if string: corresponds to the ReadingOptions.dialogId)
     *
     * @returns {void|boolean} if data.test === true, the function return TRUE, if the
     *                            reading-request is valid (e.g. if reading is context-sensitive)
     */
    read(data: string | ReadingOptions): void | boolean;
    protected getText(data: ReadingOptions): string | Array<string>;
}
