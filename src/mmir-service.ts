
import { Subject , BehaviorSubject } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';

import { MediaManager, PlayError , LogLevel , LogLevelNum, IAudio , IWaitReadyImpl } from 'mmir-lib';
import { SpeechInputStateOptions, SpeechFeedbackOptions, RecognitionEmma, UnderstandingEmma , ReadingOptions , StopReadingOptions, ReadingStateOptions , Cmd , TactileEmma , Emma , ASRError, TTSError } from './typings/';

import { EmmaUtil } from './util/EmmaUtil';

import { SpeechEventEmitter , WaitReadyOptions , SpeechIoManager , ExtMmirModule , ExtStateEngine } from './typings/';
import { createSpeechioManager , raiseInternal , upgrade } from './util/SpeechIoManager';
import { SPEECH_IO_MANAGER_ID , SPEECH_IO_INPUT_ID , SPEECH_IO_INPUT_ENGINE_ID , SPEECH_IO_ENGINE_ID , PLUGIN_ID } from './consts';

// var __mmir: MmirModule = mmir as MmirModule;

export interface SpeechEventEmitterImpl<CmdImpl extends Cmd> extends SpeechEventEmitter<CmdImpl> {
    speechInputState: BehaviorSubject<SpeechInputStateOptions>;
    changeMicLevels: BehaviorSubject<SpeechFeedbackOptions>;
    waitReadyState: BehaviorSubject<WaitReadyOptions>;
    dictationResult: Subject<RecognitionEmma>;
    speechCommand: Subject<RecognitionEmma>;
    commandAction: Subject<UnderstandingEmma<CmdImpl>>;
    cancelSpeechIO: Subject<void>;
    read: Subject<string|ReadingOptions>;
    stopReading: Subject<StopReadingOptions>;
    readingState: BehaviorSubject<ReadingStateOptions>;
    tactile: Subject<TactileEmma>;
    tactileError: Subject<Emma>;
    //TODO GuidedInput events? //guidedInput: Subject<{reset?: boolean, start?: boolean, context?: /*default: */ 'global' | 'control'}>// ORIG: 'resetGuidedInputForCurrentControl' | 'startGuidedInput' | 'resetGuidedInput'
    asrError: Subject<ASRError>;
    ttsError: Subject<TTSError>;
    playError: Subject<PlayError>;
}

export interface EngineInitConfig {
  dialogInitConfig?: {[field: string]: any} | Promise<any>;
  inputInitConfig?: {[field: string]: any} | Promise<any>;
}

export interface SpeechIoInitConfig extends EngineInitConfig {
  speechIoInitConfig?: {[field: string]: any} | Promise<any>;
}

export class MmirService<CmdImpl extends Cmd> {

  protected evt: SpeechEventEmitterImpl<CmdImpl>;

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
    this.init();
  }

  protected init(engineConfig?: SpeechIoInitConfig): Promise<MmirService<CmdImpl>> {

    this.evt = {
      'speechInputState': new BehaviorSubject<SpeechInputStateOptions>(
          {active: false, mode: 'command', inputMode: ''}//<-initial state
        ).pipe(distinctUntilChanged((state1: SpeechInputStateOptions, state2: SpeechInputStateOptions) => {
          return state1.active === state2.active && state1.mode === state2.mode && state1.inputMode === state2.inputMode && state1.targetId === state2.targetId;
        })),
      'changeMicLevels': new BehaviorSubject<SpeechFeedbackOptions>(
          {isStart: false, active: false, mode: 'command', inputMode: ''}//<-initial state
        ).pipe(distinctUntilChanged((state1: SpeechFeedbackOptions, state2: SpeechFeedbackOptions) => {
          return state1.isStart === state2.isStart && state1.active === state2.active && state1.mode === state2.mode && state1.inputMode === state2.inputMode && state1.targetId === state2.targetId;
        })),
      'waitReadyState': new BehaviorSubject<WaitReadyOptions>(
          {state: 'ready', module: ''}//<-initial state
        ).pipe(distinctUntilChanged((state1: WaitReadyOptions, state2: WaitReadyOptions) => {
          return state1.state === state2.state && state1.module === state2.module;
        })),
      'dictationResult': new Subject<RecognitionEmma>(),
      'speechCommand': new Subject<RecognitionEmma>(),
      'commandAction': new Subject<UnderstandingEmma<CmdImpl>>(),
      'cancelSpeechIO': new Subject<void>(),
      'read': new Subject<string|ReadingOptions>(),
      'stopReading': new Subject<StopReadingOptions>(),
      'readingState': new BehaviorSubject<ReadingStateOptions>(
          {active: false, contextId: ''}//<-initial state
        ).pipe(distinctUntilChanged((state1: ReadingStateOptions, state2: ReadingStateOptions) => {
          if(state1.test || state2.test){
            return false;
          }
          return state1.active === state2.active && state1.contextId === state2.contextId &&
                  state1.readingId === state2.readingId && state1.targetId === state2.targetId &&
                  state1.readingData === state2.readingData;
        })),

      'tactile': new Subject<TactileEmma>(),
      'tactileError': new Subject<Emma>(),

      //TODO GuidedInput events?
      //'guidedInput': {reset?: boolean, start?: boolean, context?: /*default: */ 'global' | 'control'}// ORIG: 'resetGuidedInputForCurrentControl' | 'startGuidedInput' | 'resetGuidedInput'

      'asrError': new Subject<ASRError>(),
      'ttsError': new Subject<TTSError>(),
      'playError': new Subject<PlayError>(),

    } as SpeechEventEmitterImpl<CmdImpl>;

    // pre-set setting for debug output:
    //  (technically we should wait for mmir initialization to finish (in order
    //   to lookup any settings), but since this setting is not really important
    //   for how the class functions, we just continue anyway)
    this.isDebugVui = true;

    if(!this._initialize){
      this._initialize = this.mmirInit(engineConfig);
    }

    return this._initialize;
  }

  /** NOTE must not be called before mmir.ready() has been emitted */
  private initDebugVui(): void {
    const isEnabled = this.mmir.conf.getBoolean('showVuiDebugOutput');
    this.isDebugVui = isEnabled;
    if(this.mmir && this.mmir.speechioManager){
      let dlg = this.mmir.speechioManager;
      dlg._isDebugVui = isEnabled;
    }
  }

  public ready(): Promise<MmirService<CmdImpl>> {
    if(!this._initialize){

      if(!this._readyWait){

        console.warn('Called MmirService.ready() before init(): waiting...');

        this._readyWait = new Promise<MmirService<CmdImpl>>((resolve, reject) => {

          //resolve "wait for ready":
          this._resolveReadyWait = (mmirProvider: MmirService<CmdImpl>) => {
            clearTimeout(this._readyWaitTimer);
            mmirProvider.mmir.require('mmirf/logger').log('MmirService.ready(): resolved ready.');
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

  protected mmirInit(engineConfig?: SpeechIoInitConfig): Promise<MmirService<CmdImpl>> {

    //promise for setting up mmir
    return new Promise<MmirService<CmdImpl>>((resolve) => {
      this._mmir.ready(() => {

        this.initDebugVui();

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
          } as IWaitReadyImpl;

          const dlg: SpeechIoManager<CmdImpl> = this.mmir.speechioManager;
          dlg.eventEmitter = this.evt;
          dlg._isDebugVui = this.isDebugVui;

          dlg.emma = EmmaUtil.create(this.mmir);
          this._mmir.emma = dlg.emma;

          const asyncInit: Promise<any>[] = [];
          const initInputRes = this.raiseInternalInit(
            this.mmir.speechioEngine,
            {
              mmir: this._mmir,
              emma: dlg.emma,
              pluginId: PLUGIN_ID
            },
            engineConfig?.speechIoInitConfig
          );
          if(initInputRes){
            asyncInit.push(initInputRes);
          }

          const dialog = this.mmir.dialog;
          dialog.eventEmitter = {};
          dialog.emma = this._mmir.emma;
          upgrade(dialog);

          if(this.mmir.conf.getBoolean([PLUGIN_ID, 'preventDialogManagerInit']) !== true){

            this.initDialogAndInputEngine(engineConfig, asyncInit);
          }

          const doResolve = () => {
            if(this._resolveReadyWait){
              this._resolveReadyWait(this);
            }
            resolve(this);
          };

          if(asyncInit.length > 0){
            Promise.all(asyncInit).then(() => doResolve());
          } else {
            doResolve();
          }

        });//END   createSpeechio().then(...

      });//END mmir.ready(...

    });//END: new Promise()
  }

  /**
   * send 'init' events to mmir.inputEngine and mmir.dialogEngine
   *
   * By default, the init-events have data attached with
   * ```
   * {
   *   mmir: ExtMmirModule<CmdImpl>,
   *   emma: EmmaUtil<CmdImpl>,
   * }
   * ```
   * These init-data can be extended using param `engineConfig`.
   * If `engineConfig` is a promise, then the promise is resolved, before sending
   * the init event to the engines.
   *
   * @param [engineConfig] optional additional data for the init events
   * @param [asyncInitTaskList] optional a list for async task: if the list is specified and additional init data is specified, their promise will be added to the list
   */
  protected initDialogAndInputEngine(engineConfig?:EngineInitConfig, asyncInitTaskList?: Promise<any>[]): void {

    const dlg: SpeechIoManager<CmdImpl> = this.mmir.speechioManager;

    const initIptRes = this.raiseInternalInit(
      this.mmir.inputEngine,
      {
        mmir: this._mmir,
        emma: dlg.emma
      },
      engineConfig?.inputInitConfig
    );
    if(asyncInitTaskList && initIptRes){
      asyncInitTaskList.push(initIptRes);
    }

    const initDlgRes = this.raiseInternalInit(
      this.mmir.dialogEngine,
      {
        mmir: this._mmir,
        emma: dlg.emma
      },
      engineConfig?.dialogInitConfig
    );

    if(asyncInitTaskList && initDlgRes){
      asyncInitTaskList.push(initDlgRes);
    }
  }

  /**
   * HELPER circumvent message-queue for init-event:
   *       (this allows to pass non-stringified and non-stringifyable object instances)
   */
  protected raiseInternalInit(stateMachine: ExtStateEngine, baseConfig: {mmir: ExtMmirModule<CmdImpl>, emma: EmmaUtil<CmdImpl>, [field: string]: any}, managerInitConfig?: { [field: string]: any; }): void | Promise<void> {

    if(managerInitConfig && typeof managerInitConfig.then === 'function'){
      return managerInitConfig.then((config: any) => raiseInternal(stateMachine, 'init', Object.assign(config ? config : {}, baseConfig)))
    }
    raiseInternal(stateMachine, 'init', Object.assign(managerInitConfig ? managerInitConfig : {}, baseConfig));
  }

  public setSpeechIoDebugLevel(logLevel: LogLevel | LogLevelNum): void {
    const Logger = this._mmir.require('mmirf/logger');
    Logger.get(SPEECH_IO_MANAGER_ID).setLevel(logLevel);
    Logger.get(SPEECH_IO_INPUT_ID).setLevel(logLevel);
    Logger.get(SPEECH_IO_ENGINE_ID).setLevel(logLevel);
    Logger.get(SPEECH_IO_INPUT_ENGINE_ID).setLevel(logLevel);
  }

}
