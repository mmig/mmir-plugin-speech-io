import { PromptReader } from './io/PromptReader';
import { VoiceUIController } from './ctrl/VoiceUIController';
import { ReadingOptions, Cmd, RecognitionEmma } from './typings/';
import { ExtMmirModule } from './typings/';
import { MmirService, SpeechEventEmitterImpl } from './mmir-service';
import { Observable } from 'rxjs';
export declare class VoiceUIService<CmdImpl extends Cmd> {
    protected vuiCtrl: VoiceUIController<CmdImpl>;
    protected mmirProvider: MmirService<CmdImpl>;
    protected _debug: boolean;
    get isReady(): boolean;
    get mmirService(): MmirService<CmdImpl>;
    get mmir(): ExtMmirModule<CmdImpl>;
    get prompt(): PromptReader;
    get ctrl(): VoiceUIController<CmdImpl>;
    get speechEvents(): SpeechEventEmitterImpl<CmdImpl>;
    get asrActiveChange(): Observable<boolean>;
    get ttsActiveChange(): Observable<boolean>;
    /** NOTE will only be available when controller is [[ready]] */
    get dictationResults(): Observable<RecognitionEmma>;
    get asrActive(): boolean;
    get ttsActive(): boolean;
    get debug(): boolean;
    set debug(value: boolean);
    constructor(mmirProvider: MmirService<CmdImpl>);
    private init;
    ready(): Promise<VoiceUIController<CmdImpl>>;
    asrCancel(): void;
    ttsCancel(): void;
    cancel(): void;
    readPrompt(promptData: ReadingOptions): void;
}
