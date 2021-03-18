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
    readonly isReady: boolean;
    readonly mmirService: MmirService<CmdImpl>;
    readonly mmir: ExtMmirModule<CmdImpl>;
    readonly prompt: PromptReader;
    readonly ctrl: VoiceUIController<CmdImpl>;
    readonly speechEvents: SpeechEventEmitterImpl<CmdImpl>;
    readonly asrActiveChange: Observable<boolean>;
    readonly ttsActiveChange: Observable<boolean>;
    /*NOTE will only be available when controller is [[ready]] */
    readonly dictationResults: Observable<RecognitionEmma>;
    readonly asrActive: boolean;
    readonly ttsActive: boolean;
    debug: boolean;
    constructor(mmirProvider: MmirService<CmdImpl>);
    private init;
    ready(): Promise<VoiceUIController<CmdImpl>>;
    asrCancel(): void;
    ttsCancel(): void;
    cancel(): void;
    readPrompt(promptData: ReadingOptions): void;
}
