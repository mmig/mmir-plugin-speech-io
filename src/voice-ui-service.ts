
import { PromptReader } from './io/PromptReader';
import { VoiceUIController } from './ctrl/VoiceUIController';

import { ReadingOptions , Cmd } from './typings/mmir-base-dialog.d';
import { ExtMmirModule } from './typings/mmir-ext-dialog.d';
import { MmirService } from './mmir-service';

export class VoiceUIService<CmdImpl extends Cmd> {

  protected vuiCtrl: VoiceUIController<CmdImpl>;
  protected mmirProvider: MmirService<CmdImpl>;

  protected _debug: boolean = false;
  protected _initialized = false;

  public get mmir(): ExtMmirModule<CmdImpl> { return this.mmirProvider.mmir;}
  public get prompt(): PromptReader { return this.vuiCtrl.getPromptReader();}
  public get ctrl(): VoiceUIController<CmdImpl> { return this.vuiCtrl;}

  public get asrActive(): boolean {
    if(this._initialized){
      return this.vuiCtrl.asrActive;
    }
    return false;
  }

  public get ttsActive(): boolean {
    if(this._initialized){
      return this.vuiCtrl.ttsActive;
    }
    return false;
  }

  public get debug(): boolean { return this._debug; }
  public set debug(value: boolean) {
    this._debug = value;
    this.ctrl.debug = value;
  }

  constructor(mmirProvider: MmirService<CmdImpl>) {
    this.mmirProvider = mmirProvider;
    this.vuiCtrl = new VoiceUIController(mmirProvider);
  }

  public async ready(): Promise<VoiceUIController<CmdImpl>> {
    return this.vuiCtrl.ready().then(() => {
      this._initialized = true;
      return this.vuiCtrl;
    });
  }

  public asrCancel(): void {
    if(this._initialized){
      this.vuiCtrl.asrCancel(this.vuiCtrl.isPermanentCommandMode);
    }
  }

  public ttsCancel(): void {
    if(this._initialized){
      this.vuiCtrl.ttsCancel();
    }
  }

  public cancel(): void {
    if(this._initialized){
      this.vuiCtrl.ttsCancel();
      this.vuiCtrl.asrCancel(this.vuiCtrl.isPermanentCommandMode);
    }
  }

  public readPrompt(promptData: ReadingOptions){
    if(this._initialized){
      this.mmir.speechioManager.raise('read-prompt', promptData);
    } else {
      this.ready().then(() => this.mmir.speechioManager.raise('read-prompt', promptData));
    }
  }

}
