import { PromptReader } from './io/PromptReader';
import { VoiceUIController } from './ctrl/VoiceUIController';
import { ReadingOptions, Cmd } from './typings/mmir-base-dialog.d';
import { ExtMmirModule } from './typings/mmir-ext-dialog.d';
import { MmirService } from './mmir-service';
export declare class VoiceUIService<CmdImpl extends Cmd> {
    protected vuiCtrl: VoiceUIController<CmdImpl>;
    protected mmirProvider: MmirService<CmdImpl>;
    protected _debug: boolean;
    protected _initialized: boolean;
    get mmir(): ExtMmirModule<CmdImpl>;
    get prompt(): PromptReader;
    get ctrl(): VoiceUIController<CmdImpl>;
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
