
import { MediaManager, TTSOptions } from 'mmir-lib';
import { StopReadingOptions } from '../typings/mmir-base-dialog';
import { IPromptHandler , SpeechIoManager } from '../typings/mmir-ext-dialog.d';

export class PromptReader {

  protected _ttsActive: boolean;
  public get active(): boolean { return this._ttsActive; }

  /** context for tts(): set to FALSY for default context
   * @see mmir.media.setDefaultCtx(ctx: string | null)
   */
  public ttsCtx?: string;

  public voice?: string;
  public pauseDuration?: number;

  public handler: IPromptHandler;

  /** if a prompt is active, when a new one is requested: cancel the current one, or discard the new one?  */ //TODO impl. queuing-mode for new prompts?
  public cancelOnNew: boolean;

  constructor(private dlg: SpeechIoManager<any>, private media: MediaManager){
    this._ttsActive = false;
    this.cancelOnNew = false;
  }

  public setActive(newState?: boolean) : boolean {
    if(typeof newState !== 'undefined' && this._ttsActive !== newState){
      this._ttsActive = newState;
      // this._log('set tts active -> '+this._ttsActive);
    }
    return this._ttsActive;
  }

  public cancel(options?: StopReadingOptions){
    this.media.perform(this.ttsCtx, 'cancelSpeech');
    if(this._ttsActive){
      this.stoppedPrompt(options);
    }
  }

  /**
   * semi-private HELPER: notify state-machine that prompt has stopped
   * @param options the reading options (NOTE if continuesReading is set, no stopped notification will be emitted)
   */
  stoppedPrompt(options?: StopReadingOptions): void {
    if(!(options && options.continuesReading)){//do not send status-updates, if there is a "next reading"
      this.setActive(false);
      this.dlg.raise('reading-stopped');
    }
  }

  public setHandler(handler: IPromptHandler): void {
    this.handler = handler;
  }

  public readPrompt(text: string|Array<string>): void {
    this.doRead(text);
  }

  protected doRead(text: string|Array<string>): void {


    //do not start/queue, if TTS is active right now, but discard the read-request
    //NOTE if this should be changed (i.e. not discarded), then asrActive(boolean) need to be changed too!
    if(this._ttsActive){

      if(!this.cancelOnNew){

        this._log('doRead: did not synthesize, because TTS is active now, discarded TTS text');
        return;//////////////// EARLY EXIT /////////////

      } else {

        //cancel any ongoing TTS
        this.media.perform(this.ttsCtx, 'cancelSpeech');
      }
    }

    this.dlg.raise('reading-started');
    var self = this;

    const opt: TTSOptions = {
      text: text,
      ready: function onPrepared(){
        if(self._isLog()) self._log('doRead: prepared TTS audio, starting to read now... '+ JSON.stringify(text));
      },
      success: function onFinished(){

        if(self._isLog()) self._log('doRead: finished reading '+ JSON.stringify(text));
        self.dlg.raise('reading-stopped');

      },
      error: function onError(err){

        if(self._isLogError()) self._logError('doRead: error reading '+JSON.stringify(text), err);//DEBUG
        self.dlg.raise('reading-stopped');

      }
    };

    //NOTE any other value than undefined for opt.voice will enforce this setting:
    //     i.e. if opt.voice = null, the TTS will NOT fallback to the speech.json
    //     settings, but use the TTS-engine's default voice instead
    //     -> this check will enable the fallback in speech.json for ALL FALSY
    //        values, i.e. even for null/false/0
    if(this.voice){
      if(typeof this.voice !== 'string'){
        if(this._isLog()) this._log('invalid value for voice (must be string): '+ this.voice)
      } else {
        opt.voice = this.voice;
      }
    }

    if(typeof this.pauseDuration !== 'undefined'){
      if(!isFinite(this.pauseDuration) || this.pauseDuration <= 0){
        if(this._isLog()) this._log('invalid value for pauseDuration (must be greater than 0): '+ this.pauseDuration)
      } else {
        opt.pauseDuration = this.pauseDuration;
      }
    }


    this.media.perform(this.ttsCtx, 'tts', [opt]);
  }

  //////////////// TODO create own logger for PromptReader?

  protected _isLog(): boolean {
    return (this.media as any)._log.isd();
  }

  protected _isLogError(): boolean {
    return (this.media as any)._log.ise();
  }

  protected _log(msg: string): void {
    if(this._isLog()) (this.media as any)._log.debug(".PromptReader: " + msg);
  }

  protected _logError(msg: string, err?: any): void {
    if(this._isLogError()) (this.media as any)._log.error(".PromptReader: " + msg, err);
  }

}
