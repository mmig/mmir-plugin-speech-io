
import { Subject , BehaviorSubject } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';

import { MediaManager, PlayError , LogLevel , LogLevelNum, IAudio } from 'mmir-lib';
import { ShowSpeechStateOptions, SpeechFeedbackOptions, RecognitionEmma, UnderstandingEmma , ReadingOptions , StopReadingOptions, ReadingShowOptions , Cmd , TactileEmma , Emma , ASRError, TTSError } from './typings/';
import { IAppSettings } from './typings/';

import { EmmaUtil } from './util/EmmaUtil';

import { SpeechEventEmitter , WaitReadyOptions , SpeechIoManager , ExtStateEngine , ExtMmirModule } from './typings/';
import { createSpeechioManager , raiseInternal } from './util/SpeechIoManager';
import { SPEECH_IO_MANAGER_ID , SPEECH_IO_INPUT_ID , SPEECH_IO_INPUT_ENGINE_ID , SPEECH_IO_ENGINE_ID , PLUGIN_ID } from './consts';
import { createConfigSettingsImpl } from './util/SettingsUtils';

// var __mmir: MmirModule = mmir as MmirModule;

interface SpeechEventEmitterImpl<CmdImpl extends Cmd> extends SpeechEventEmitter<CmdImpl> {
    showSpeechInputState: BehaviorSubject<ShowSpeechStateOptions>;
    changeMicLevels: BehaviorSubject<SpeechFeedbackOptions>;
    waitReadyState: BehaviorSubject<WaitReadyOptions>;
    showDictationResult: Subject<RecognitionEmma>;
    determineSpeechCmd: Subject<RecognitionEmma>;
    execSpeechCmd: Subject<UnderstandingEmma<CmdImpl>>;
    cancelSpeechIO: Subject<void>;
    read: Subject<string|ReadingOptions>;
    stopReading: Subject<StopReadingOptions>;
    showReadingStatus: BehaviorSubject<ReadingShowOptions>;
    tactile: Subject<TactileEmma>;
    unknown: Subject<Emma>;
    //TODO GuidedInput events? //guidedInput: Subject<{reset?: boolean, start?: boolean, context?: /*default: */ 'global' | 'control'}>// ORIG: 'resetGuidedInputForCurrentControl' | 'startGuidedInput' | 'resetGuidedInput'
    asrError: Subject<ASRError>;
    ttsError: Subject<TTSError>;
    playError: Subject<PlayError>;
}

export class MmirService<CmdImpl extends Cmd> {

  protected evt: SpeechEventEmitterImpl<CmdImpl>;
  protected appConfig: IAppSettings;
  protected _isCreateAppConfigImpl: boolean;

  protected _mmir : ExtMmirModule<CmdImpl>;

  protected _initialize: Promise<MmirService<CmdImpl>>;
  protected _readyWait: Promise<MmirService<CmdImpl>>;
  protected _resolveReadyWait: (mmirProvider: MmirService<CmdImpl>) => void;
  protected _readyWaitTimer: number;
  protected readonly _readyWaitTimeout: number = 10 * 60 * 1000;//10 min.

  //FLAG: should debug output for VUI (via dialog system) be shown in console
  protected isDebugVui: boolean;

  public get mmir(): ExtMmirModule<CmdImpl> {
    return this._mmir;
  }

  public get speechEvents(): SpeechEventEmitterImpl<CmdImpl> {
    return this.evt;
  }

  constructor(mmir: ExtMmirModule<CmdImpl>) {
    this._mmir = mmir;
  }

  //FIXME find better way to "inject" dependencies
  public init(
    appConfig: IAppSettings, ... _args: any[]
  ): Promise<MmirService<CmdImpl>> {

    this.appConfig = appConfig;
    if(!this.appConfig){
      this._isCreateAppConfigImpl = true;
    }

    this.evt = {
      'showSpeechInputState': new BehaviorSubject<ShowSpeechStateOptions>(
          {state: false, mode: 'command', inputMode: ''}//<-initial state
        ).pipe(distinctUntilChanged((state1: ShowSpeechStateOptions, state2: ShowSpeechStateOptions) => {
          return state1.state === state2.state && state1.mode === state2.mode && state1.inputMode === state2.inputMode && state1.targetId === state2.targetId;
        })),
      'changeMicLevels': new BehaviorSubject<SpeechFeedbackOptions>(
          {isStart: false, state: false, mode: 'command', inputMode: ''}//<-initial state
        ).pipe(distinctUntilChanged((state1: SpeechFeedbackOptions, state2: SpeechFeedbackOptions) => {
          return state1.isStart === state2.isStart && state1.state === state2.state && state1.mode === state2.mode && state1.inputMode === state2.inputMode && state1.targetId === state2.targetId;
        })),
      'waitReadyState': new BehaviorSubject<WaitReadyOptions>(
          {state: 'ready', module: ''}//<-initial state
        ).pipe(distinctUntilChanged((state1: WaitReadyOptions, state2: WaitReadyOptions) => {
          return state1.state === state2.state && state1.module === state2.module;
        })),
      'showDictationResult': new Subject<RecognitionEmma>(),
      'determineSpeechCmd': new Subject<RecognitionEmma>(),
      'execSpeechCmd': new Subject<UnderstandingEmma<CmdImpl>>(),
      'cancelSpeechIO': new Subject<void>(),
      'read': new Subject<string|ReadingOptions>(),
      'stopReading': new Subject<StopReadingOptions>(),
      'showReadingStatus': new BehaviorSubject<ReadingShowOptions>(
          {active: false, contextId: ''}//<-initial state
        ).pipe(distinctUntilChanged((state1: ReadingShowOptions, state2: ReadingShowOptions) => {
          if(state1.test || state2.test){
            return false;
          }
          return state1.active === state2.active && state1.contextId === state2.contextId &&
                  state1.readingId === state2.readingId && state1.targetId === state2.targetId &&
                  state1.readingData === state2.readingData;
        })),

      'tactile': new Subject<TactileEmma>(),
      'unknown': new Subject<Emma>(),

      //TODO GuidedInput events?
      //'guidedInput': {reset?: boolean, start?: boolean, context?: /*default: */ 'global' | 'control'}// ORIG: 'resetGuidedInputForCurrentControl' | 'startGuidedInput' | 'resetGuidedInput'

      'asrError': new Subject<ASRError>(),
      'ttsError': new Subject<TTSError>(),
      'playError': new Subject<PlayError>(),

    } as SpeechEventEmitterImpl<CmdImpl>;

    // apply setting for debug output:
    //  (technically we should wait for the promise to finish, but since this
    //   setting is not really important for how the class functions, we just
    //   continue anyway)
    this.isDebugVui = true;
    let initVuiDebugPromise: Promise<void>;
    if(this._isCreateAppConfigImpl === true && !this.appConfig){

      //... if no AppConfig implementation is available, we need to wait for
      //    mmir to initialize to create the default implementation
      initVuiDebugPromise = new Promise((resolve) => {

        this._mmir.ready(() => {
          if(this._isCreateAppConfigImpl === true && !this.appConfig){
            this.appConfig = createConfigSettingsImpl(this._mmir.conf);
          }
          resolve();
        });

      })
    }

    initVuiDebugPromise = initVuiDebugPromise? initVuiDebugPromise.then(() => this.initDebugVui()) : Promise.resolve(this.initDebugVui());

    if(!this._initialize){
      this._initialize = initVuiDebugPromise.then(() => this.mmirInit());
    }

    return this._initialize;
  }

  private initDebugVui(): void { //Promise<void> {
    //DISABLED: cannot use async-method on appConfig, since a custom implementation
    //          may wait on the mmir-service to be ready before execution its get() method
    //          (-> would never initialize, since this function is called from ini() )
    // return this.appConfig.get('showVuiDebugOutput').then(isEnabled => {
    const isEnabled = this.mmir.conf.getBoolean('showVuiDebugOutput');
    this.isDebugVui = isEnabled;
    if(this.mmir && this.mmir.speechioManager){
      let dlg = this.mmir.speechioManager;
      dlg._isDebugVui = isEnabled;
    }
    // });
  }

  public ready(): Promise<MmirService<CmdImpl>> {
    if(!this._initialize){

      if(!this._readyWait){

        console.log('Called MmirService.ready() before init(): waiting...');

        this._readyWait = new Promise<MmirService<CmdImpl>>((resolve, reject) => {

          //resolve "wait for ready":
          this._resolveReadyWait = (mmirProvider: MmirService<CmdImpl>) => {
            clearTimeout(this._readyWaitTimer);
            console.log('Resolved "wait for MmirService.ready()".');
            resolve(mmirProvider);
            this._readyWait = null;
            this._resolveReadyWait = null;
          };

          //set timeout for waiting to resolve:
          this._readyWaitTimer = setTimeout(() => {
            reject('Timed out waiting for MmirService initialization (exceeded timeout _readyWaitTimeout: '+this._readyWaitTimeout+' ms)');
          }, this._readyWaitTimeout) as any;

        });

      }

      return this._readyWait;
    }
    return this._initialize;
  }

  protected mmirInit(): Promise<MmirService<CmdImpl>> {

    //promise for setting up mmir
    return new Promise<MmirService<CmdImpl>>((resolve) => {
      this._mmir.ready(() => {

        //DISABLED now done in init() -> when initializing VUI debug settings
        // if(this._isCreateAppConfigImpl === true && !this.appConfig){
        //   this.appConfig = createConfigSettingsImpl(this._mmir.conf);
        // }

        createSpeechioManager(this._mmir, this.isDebugVui? 'debug' : void(0)).then(() => {

          // this.platform.setLang(this.mmir.lang.getLanguage(), true); FIXME set HTML language attribute!?!

          this.mmir.media.on('errorplay', (audio: IAudio, error: any) => {
            this.evt.playError.next({audio: audio, error: error});
          });

          const media: MediaManager = this.mmir.media;
          media.waitReadyImpl = {
            eventHandler: this.evt,
            preparing: function(module: string){
              this.eventHandler.waitReadyState.next({state: 'wait', module: module});
            },
            ready: function(module: string){
              this.eventHandler.waitReadyState.next({state: 'ready', module: module});
            }
          } as any;

          const dlg: SpeechIoManager<CmdImpl> = this.mmir.speechioManager;
          dlg.eventEmitter = this.evt;
          dlg._isDebugVui = this.isDebugVui;

          dlg.emma = EmmaUtil.create(this.mmir);
          this._mmir.emma = dlg.emma;

          //circumvent message-queue for init-event:
          // (this allows to pass non-stringified and non-stringifyable object instances)
          let dlgEngine: ExtStateEngine = this.mmir.speechioEngine;
          raiseInternal(dlgEngine, 'init', {
            appConfig: this.appConfig,
            mmir: this._mmir,
            emma: dlg.emma,
            pluginId: PLUGIN_ID
          });


          if(this._resolveReadyWait){
            this._resolveReadyWait(this);
          }

          resolve(this);

        });//END   createSpeechio().then(...

      });//END mmir.ready(...

    });//END: new Promise()
  }

  public setSpeechIoDebugLevel(logLevel: LogLevel | LogLevelNum): void {
    const Logger = this._mmir.require('mmirf/logger');
    Logger.get(SPEECH_IO_MANAGER_ID).setLevel(logLevel);
    Logger.get(SPEECH_IO_INPUT_ID).setLevel(logLevel);
    Logger.get(SPEECH_IO_ENGINE_ID).setLevel(logLevel);
    Logger.get(SPEECH_IO_INPUT_ENGINE_ID).setLevel(logLevel);
  }

}
