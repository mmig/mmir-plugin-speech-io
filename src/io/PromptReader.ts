
import { MediaManager, TTSOptions, LanguageManager } from 'mmir-lib';
import { StopReadingOptions } from '../typings/';
import { IPromptHandler , SpeechIoManager } from '../typings/';
import { PLUGIN_ID , CANCEL_ON_NEW_PROMPT_CONFIG , TTS_ENGINE_CONFIG , TTS_DEFAULT_OPTIONS_CONFIG } from '../consts';
import { ConfigurationManager_NEW } from '../util/ConfigurationManagerCompat';

export class PromptReader {

  protected _ttsActive: boolean;
  /** if TTS is currently active */
  public get active(): boolean { return this._ttsActive; }

  protected _ttsCtx?: string;
  /** context for tts(): set to FALSY for default context
   * @see mmir.media.setDefaultCtx(ctx: string | null)
   *
   * @example
   * // set via configurationManager
   * mmir.conf.set('speechio.ttsEngine', ttsCtx)
   */
  public get ttsEngine(): string {
    return this._ttsCtx;
  }

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
  public getDefaultOptions(): TTSOptions | undefined {
    return this._ttsDefaultOptions;
  }

  //TODO impl. queuing-mode for new prompts?
  protected _cancelOnNew: boolean;
  /** if a prompt is active, when a new one is requested: cancel the current one, or discard the new one?  */
  public get cancelOnNew(): boolean {
    return this._cancelOnNew;
  }

  public handler: IPromptHandler;

  constructor(private dlg: SpeechIoManager<any>, private config: ConfigurationManager_NEW, private media: MediaManager, private lang: LanguageManager){
    this._ttsActive = false;
    this._cancelOnNew = false;

    this.initSettings();
  }

  private initSettings(){

    this.config.on([PLUGIN_ID, CANCEL_ON_NEW_PROMPT_CONFIG], (newValue) => {
      this._cancelOnNew = newValue;
    });

    this.config.on([PLUGIN_ID, TTS_ENGINE_CONFIG], (newValue) => {
      this._ttsCtx = newValue;
    });

    this.config.on([PLUGIN_ID, TTS_DEFAULT_OPTIONS_CONFIG], (newValue) => {
      this._ttsDefaultOptions = newValue;
    });
  }

  public setActive(newState?: boolean) : boolean {
    if(typeof newState !== 'undefined' && this._ttsActive !== newState){
      this._ttsActive = newState;
      // this._log('set tts active -> '+this._ttsActive);
    }
    return this._ttsActive;
  }

  public cancel(options?: StopReadingOptions){
    this.media.perform(this._ttsCtx, 'cancelSpeech');
    if(this._ttsActive){
      this.stoppedPrompt(options);
    }
  }

  /**
   * semi-private HELPER: notify state-machine that prompt has stopped
   * @param options the reading options (NOTE if continuesReading is set, no stopped notification will be emitted)
   */
  stoppedPrompt(options?: StopReadingOptions): void {
    if(!(options && options.continuesReading)){//do not set status-updates, if there is a "next reading"
      this.setActive(false);
    }
    //NOTE reading-stopped will start reading the next prompt, in case options.continuesReading was TRUE
    this.dlg.raise('reading-stopped');
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

      if(!this._cancelOnNew){

        this._log('doRead: did not synthesize, because TTS is active now, discarded TTS text');
        return;//////////////// EARLY EXIT /////////////

      } else {

        //cancel any ongoing TTS
        this.media.perform(this._ttsCtx, 'cancelSpeech');
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
        self.dlg.emit('ttsError', {type: 'tts', error: err});
      }
    };

    // //NOTE any other value than undefined for opt.voice will enforce this setting:
    // //     i.e. if opt.voice = null, the TTS will NOT fallback to the speech.json
    // //     settings, but use the TTS-engine's default voice instead
    // //     -> this check will enable the fallback in speech.json for ALL FALSY
    // //        values, i.e. even for null/false/0
    // if(this._ttsDefaultOptions?.voice){
    //   if(typeof this._ttsDefaultOptions.voice !== 'string'){
    //     if(this._isLog()) this._log('invalid value for voice (must be string): '+ this._ttsDefaultOptions.voice)
    //   } else {
    //     opt.voice = this._ttsDefaultOptions.voice;
    //   }
    // }
    if(this._ttsDefaultOptions){
      const defOpt = Object.assign({}, this.doGetDefaultReadingOptions(), opt);
      Object.assign(opt, defOpt);
    }

    this.media.perform(this._ttsCtx, 'tts', [opt]);
  }

  protected doGetDefaultReadingOptions(): any {
    if(this._ttsDefaultOptions){
      const lang = this.lang.getLanguage();
      if(this._ttsDefaultOptions[lang] && typeof this._ttsDefaultOptions[lang] === 'object'){
        return this._ttsDefaultOptions[lang];
      }
      return this._ttsDefaultOptions;
    }
    return undefined;
  }

  //////////////// TODO create own logger for PromptReader?

  protected _isLog(): boolean {
    return (this.media as any)._log.isd();
  }

  protected _isLogError(): boolean {
    return (this.media as any)._log.ise();
  }

  protected _log(msg: string): void {
    if(this._isLog()) (this.media as any)._log.debug(".PromptReader: " + msg, 1);
  }

  protected _logError(msg: string, err?: any): void {
    if(this._isLogError()) (this.media as any)._log.error(".PromptReader: " + msg, err, 1);
  }

}
