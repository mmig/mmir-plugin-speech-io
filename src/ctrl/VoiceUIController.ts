
import { Subscription , BehaviorSubject } from 'rxjs';

import { RecognitionEmma , UnderstandingEmma , SpeechInputStateOptions, ReadingStateOptions , StopReadingOptions, ReadingOptions, Cmd } from '../typings/';
import { SPEECH_ACTIVE , READ_ACTIVE , PLUGIN_ID } from '../consts';
import { triggerClickFeedback , FeedbackOption } from '../io/HapticFeedback';
import { PromptReader } from '../io/PromptReader';
import { SpeechInputController } from '../ctrl/SpeechInputController';
import { SpeechOutputController } from '../ctrl/SpeechOutputController';
import { SubscriptionUtil } from '../util/SubscriptionUtil';
import { DictationTargetHandler , DictationHandler, DictationTarget , SelectionMode } from '../io/SpeechDictation';
import { ReadTargetHandler , ReadHandler } from '../io/SpeechReading';
import { EventLike } from '../typings/';
import { ISpeechInputIndicator , ISpeechOutputIndicator } from '../typings/';

import { ExtMmirModule , SpeechEventName , GuiElement , SpeechIoManager , InputOutputOption } from '../typings/';

// import { ReadOverlay } from '../../../components/speech-overlay/dialogs/read-overlay';
import { MmirService } from '../mmir-service';

export class VoiceUIController<CmdImpl extends Cmd> {

  protected _mmirProvider: MmirService<CmdImpl>;
  protected mmir: ExtMmirModule<CmdImpl>;
  protected get speech(): SpeechIoManager<CmdImpl> {
    return this.mmir.speechioManager;
  }

  protected prompt: PromptReader;
  protected _asrActive: boolean = false;

  public asrActiveChange: BehaviorSubject<boolean>;
  public ttsActiveChange: BehaviorSubject<boolean>;

  /**
   * FLAG for "permanent command mode":
   * if true, speech-input for command mode will stay active on page/view changes
   * @type {boolean}
   */
  public isPermanentCommandMode: boolean = false;

  /**
   * set dictation overlay to singleton (or not):
   * in singleton mode, overlay reference does not get reset upon leaving a view.
   */
  public isDictationOverlaySingleton: boolean;
  /**
   * set read overlay to singleton (or not):
   * in singleton mode, overlay reference does not get reset upon leaving a view.
   */
  public isReadOverlaySingleton: boolean;

  protected _debugMsg: boolean = false;

  protected readonly _defaultDictationFeedbackStyle: SelectionMode = 'interim';//'unstable';//FIXME retrieve from settings?

  public get asrActive(): boolean { return this._asrActive; }
  public get ttsActive(): boolean { return this.prompt? this.prompt.active : false; }

  public speechOut: SpeechOutputController;
  public speechIn: SpeechInputController;

  protected activePageSubscriptions: Array<Subscription>;

  // protected subsUtil: SubscriptionUtil;
  protected dictTargetHandler: DictationTargetHandler;
  protected readTargetHandler: ReadTargetHandler;

  protected dictationOverlay: ISpeechInputIndicator;
  protected readOverlay: ISpeechOutputIndicator;

  protected readOverlayClickSubscription: Subscription;

  public get debug(): boolean { return this._debugMsg; }
  public set debug(value: boolean) {
    this._debugMsg = value;
    this.speechIn.debug = value;
    this.speechOut.debug = value;
  }

  protected _speechEventSubscriptions: Map<SpeechEventName, Subscription>;

  protected initializing: Promise<VoiceUIController<CmdImpl>>;
  protected _initialized = false;

  public get initialized(): boolean {
    return this._initialized;
  }

  constructor(
    mmirProvider: MmirService<CmdImpl>
  ) {
    this._mmirProvider = mmirProvider;
    this.mmir = this._mmirProvider.mmir;

    // this.subsUtil = new SubscriptionUtil(this.mmir);
    this.dictTargetHandler = new DictationTargetHandler();
    this.readTargetHandler = new ReadTargetHandler();

    this.activePageSubscriptions = [];

    this.asrActiveChange = new BehaviorSubject<boolean>(false);
    this.ttsActiveChange = new BehaviorSubject<boolean>(false);

    this.isDictationOverlaySingleton = false;
    this.isReadOverlaySingleton = false;

    this.initializing = mmirProvider.ready().then(() => {

      this._initialized = true;

      this.prompt = new PromptReader(this.speech, this.mmir.media);
      this.prompt.cancelOnNew = this.mmir.conf.getBoolean([PLUGIN_ID, 'cancelOnNewPrompt'], true);
      this.speechIn = new SpeechInputController(mmirProvider, this.dictTargetHandler);
      this.speechOut = new SpeechOutputController(this.prompt, mmirProvider);
      this._speechEventSubscriptions = SubscriptionUtil.subscribe(mmirProvider.speechEvents, [
        'speechInputState',
        // 'changeMicLevels',
        'cancelSpeechIO',
        'stopReading',
        'readingState'
        //'resetGuidedInputForCurrentControl' , 'startGuidedInput' , 'resetGuidedInput' , 'isDictAutoProceed'
      ], this);

      return this;
    });
  }

  public ready(): Promise<VoiceUIController<CmdImpl>> {
    return this.initializing;
  }

  public destroy() {

    if(this.speechIn){
      this.speechIn.destroy();
    }
    if(this.speechOut){
      this.speechOut.destroy();
    }
    this.releaseUiResources(true);
    this.dictTargetHandler.destroy();
    this.readTargetHandler.destroy();

    SubscriptionUtil.unsubscribe(this._speechEventSubscriptions);
  }

  public getPromptReader(): PromptReader{
    return this.prompt;
  }

  /**
   * stop speech-input/close microphone
   *
   * @param  {boolean} leaveCommandActive
   *              if true, speech-input will not be canceled, if it is currently
   *              in command mode, or guided-input mode
   *              (i.e. only canceled if in "pure" dictation mode)
   */
  public asrCancel(leaveCommandActive: boolean): void {
    const action = leaveCommandActive? 'cancel-non-guided-dictation' : 'cancel-speech-input';
    this.speech.raise(action);
  }

  public ttsCancel(options?: StopReadingOptions): void {
    if(this.prompt){
      this.prompt.cancel(options);
    }
  }

  public asrEngine(engine: string | null): void {
    if(this.mmir.speechioManager){
      this._asrEngine(engine);
    } else if(this.initializing) {
      this.initializing.then(() => {
          this._asrEngine(engine);
      });
    } else {
      console.error('VoiceUIController.asrEngine: cannot set ASR engine "'+engine+'", because mmir.speechioManager is not availabe!');
    }
  }

  public ttsEngine(engine: string | null): void {
    if(this.prompt){
      this._ttsEngine(engine);
    } else if(this.initializing) {
      this.initializing.then(() => {
        this._ttsEngine(engine);
      });
    } else {
      console.error('VoiceUIController.ttsEngine: cannot set TTS engine "'+engine+'", because prompt (PromptReader) is not availabe!');
    }
  }

  public enableBargeIn(enable: boolean): void {
    if(this.mmir.speechioManager){
      this._enableBargeIn(enable);
    } else if(this.initializing) {
      this.initializing.then(() => {
          this._enableBargeIn(enable);
      });
    } else {
      console.error('VoiceUIController.enableBargeIn: cannot set enableBargeIn to '+enable+', because mmir.speechioManager is not availabe!');
    }
  }

  /** @deprecated use [[ enterView ]] */
  public enterViewWith() : Promise<VoiceUIController<CmdImpl>>;
    /** @deprecated use [[ enterView ]] */
  public enterViewWith(asrActiveHandler: ((asrActive: boolean) => void)) : Promise<VoiceUIController<CmdImpl>>;
    /** @deprecated use [[ enterView ]] */
  public enterViewWith(asrActiveHandler: ((asrActive: boolean) => void), ttsActiveHandler: ((ttsActive: boolean) => void)) : Promise<VoiceUIController<CmdImpl>>;
    /** @deprecated use [[ enterView ]] */
  public enterViewWith(asrActiveHandler?: ((asrActive: boolean) => void) | null, ttsActiveHandler?: ((ttsActive: boolean) => void)) : Promise<VoiceUIController<CmdImpl>> {


    let viewSubscriptions: Subscription[] | undefined;
    if(asrActiveHandler || ttsActiveHandler){
      viewSubscriptions = [];
    }

    if(asrActiveHandler){
      viewSubscriptions.push(this.asrActiveChange.subscribe(asrActiveHandler));
    }

    if(ttsActiveHandler){
      viewSubscriptions.push(this.ttsActiveChange.subscribe(ttsActiveHandler));
    }

    return this.enterView(viewSubscriptions);
  }

  /**
   * HELPER when entering a new view / page:
   * resets handlers, subscriptions etc. from previous view and intializes handlers, subscriptions etc.
   * for the new view.
   *
   * @param  [viewSubscriptions] OPITONAL subscriptions for the newly entered view (will be canceled when leaving the view or entering a new view)
   * @return the READY promise for the VoiceUiController
   */
  public enterView(viewSubscriptions?: Subscription[] | Subscription) : Promise<VoiceUIController<CmdImpl>> {

    //cancel any previous subscriptions:
    this.doUnsubscribeCurrentPage();
    this.dictTargetHandler.reset();
    this.readTargetHandler.reset();

    if(viewSubscriptions){
      this.addViewSubscription(viewSubscriptions);
    }

    return this.initializing;
  }

  /**
   * Remembers the subscription for the current/active view, and
   * unsubscribes when #leaveView is triggered.
   *
   * @param {Subscription} subscription
   */
  public addViewSubscription(subscription: Subscription[] | Subscription): void {
    if(Array.isArray(subscription)){
      for(let subs of subscription){
        this.activePageSubscriptions.push(subs);
      }
    } else {
      this.activePageSubscriptions.push(subscription);
    }
  }

  /**
   * HELPER for leaving a view / page:
   *
   * resets/cancels handlers, resources, subscriptions etc. from current view and intializes handlers,
   * and cancels active ASR (if not <code>isPermanentCommandMode</code>) as well as active prompts/TTS.
   */
  public leaveView() {

    this.doUnsubscribeCurrentPage();
    this.releasePageResources();
    this.dictTargetHandler.reset();
    this.readTargetHandler.reset();

    //stop all voice input/output interactions (i.e. close microphone, stop reading ...)
    //NOTE would need special treatment, if pending ASR results should be stored/used!!!
    this.asrCancel(this.isPermanentCommandMode);
    this.ttsCancel();
  }

  protected _asrEngine(engine: string | null): void {
    if(this.asrActive){
      this.asrCancel(false);
    }
    this.mmir.speechioManager.raise('setAsrEngine', engine);
  }

  public _ttsEngine(engine: string | null): void {
    if(this.ttsActive){
      this.ttsCancel();
    }
    this.prompt.ttsCtx = engine;
  }

  protected _enableBargeIn(enable: boolean): void {
    this.mmir.speechioManager.raise('enableBargeIn', enable);
  }

  protected doUnsubscribeCurrentPage(){

    const len = this.activePageSubscriptions.length;
    if(len > 0){
      for(let i = 0; i < len; ++i){
        this.activePageSubscriptions[i].unsubscribe();
      }
      this.activePageSubscriptions.splice(0, len);
    }

  }

  protected releasePageResources(){
    this.releaseUiResources(false);
  }

  protected releaseUiResources(force: boolean){
    if(this.dictationOverlay){
      if(this.dictationOverlay.visible){
        this.dictationOverlay.hide();
      }
      if(force || !this.isDictationOverlaySingleton){
        this.dictationOverlay = null;
      }
    }
    if(this.readOverlay){
      if(this.readOverlay.visible){
        this.readOverlay.stopReading();
      }
      if(force || !this.isReadOverlaySingleton){
        this.clearReadOverlaySubscription();
        this.readOverlay = null;
      }
    }
  }

  public handleClick(event: MouseEvent | TouchEvent | RecognitionEmma | UnderstandingEmma<CmdImpl> | EventLike, name: string, data?: any){

    this.triggerTouchFeedback(event);

    // this.inp.raise('touch_input_event');
    // this.inp.raise('click_on_' + name, data);
    let emmaEvt = this.mmir.emma.toEmma(event as EventLike, data);
    this.mmir.emma._setEmmaFuncData(emmaEvt, 'gesture', {
      name: name
    });
    // this.mmir.emma.addTarget(emmaEvt, name, true);
    // this.mmir.emma.addProperty(emmaEvt, 'data', data, true);
    if(this._debugMsg) console.log(emmaEvt);
    this.mmir.speechioInput.raise('touch', emmaEvt);
  }

  public localize(res: string) : string {
    if(this.mmir.lang){
      return this.mmir.lang.getText(res);
    } else {
      //if(this._debugMsg) console.info('mmir.LanguageManager not ready yet...');
      return '';
    }
  }

  public triggerTouchFeedback(_event: MouseEvent | TouchEvent | RecognitionEmma | UnderstandingEmma<CmdImpl> | EventLike, feedbackOptions?: FeedbackOption){
    triggerClickFeedback(feedbackOptions);
  }

  ////////////////////////////////////////// Speech IO ////////////////////////

  /** trigger click/touch feedback & toggle command-mode ASR */
  public commandClicked(event: MouseEvent | TouchEvent | RecognitionEmma | UnderstandingEmma<CmdImpl> | EventLike, btnId: string, feedbackOptions?: InputOutputOption): void {

    if(event && (event as any).preventDefault){
      (event as any).preventDefault();
    }

    //if(this._debugMsg) console.log('commandClicked');

    if(this.ttsActive && (!feedbackOptions || (feedbackOptions && feedbackOptions.ttsCancel !== false))){
      this.ttsCancel();
    }

    // if(!isSyntheticClick(event))//TODO detect programatically triggered invocations of this function?
    this.triggerTouchFeedback(event, feedbackOptions);

    this.toggleCommand(btnId);
  }

  /** toggle command-mode ASR */
  public toggleCommand(btnId: string): void {

    this.speech.raise('toggleSpeechInputState', {mode: 'command', targetId: btnId});
    this.speech.raise('showSpeechState');
  }

  /**
   * trigger click/touch feedback & toggle dictation-mode ASR
   *
   * dictationClicked(event: Event, target: DictationTarget, feedbackMode?: SelectionMode)
   *
   * @param  {Event} event
   * @param  {DictationTarget | string} target
   *                          The dication target.
   *                          If called the first time for this target, the argument must be a DictationTarget object
   * @param  {SelectionMode} [feedbackStyle]
   *                          style for visualizing unstable/interim part of dictation result/text
   *                          DEFAULT: uses #_defaultDictationFeedbackStyle
   */
  public dictationClicked(event: Event | EventLike, targetId: string | DictationTarget, feedbackStyle?: SelectionMode, touchFeedback?: InputOutputOption, replaceExistingHandler?: boolean): void {

    if(event && (event as any).preventDefault){
      (event as any).preventDefault();
    }

    //if(this._debugMsg) console.log('dictationClicked');

    if(this.ttsActive && (!touchFeedback || (touchFeedback && touchFeedback.ttsCancel !== false))){
      this.ttsCancel();
    }

    // if(!isSyntheticClick(event))//TODO detect programatically triggered invocations of this function?
    this.triggerTouchFeedback(event, touchFeedback);

    this.toggleDictation(targetId, feedbackStyle, replaceExistingHandler);
  }

  /** toggle dictation-mode ASR */
  public toggleDictation(targetId: string | DictationTarget, feedbackStyle?: SelectionMode, replaceExistingHandler?: boolean): void {

    const handler = this.initDictationTarget(targetId, feedbackStyle, replaceExistingHandler);

    this.speech.raise('toggleSpeechInputState', {mode: 'dictation', targetId: handler? handler.id : targetId});
    this.speech.raise('showSpeechState');
  }

  public initDictationTarget(targetId: string | DictationTarget, feedbackStyle?: SelectionMode, replaceExistingHandler?: boolean) : DictationHandler {

    let targetRef: DictationTarget;
    if(typeof targetId !== 'string'){
      targetRef = targetId;
      targetId = targetId.id;
    }

    feedbackStyle = feedbackStyle? feedbackStyle : this._defaultDictationFeedbackStyle;

    let handler: DictationHandler = replaceExistingHandler? null : this.dictTargetHandler.get(targetId);
    if(!handler){
      if(targetRef){
        handler = this.speechIn.createDictationTarget(targetRef, targetId, feedbackStyle);
      } else {
        console.error('dictationClicked: missing DictationTarget, cannot create DiactationHandler for '+targetId);
        //TODO throw error or something?
        return null;/////////////// EARLY EXIT /////////////////////
      }
      this.dictTargetHandler.put(targetId, handler);
    }
    handler.prepare();

    return handler;
  }

  public resetDictationHandlers(): void {
    this.dictTargetHandler.reset();
  }

  private updateCurrentDictationTarget(targetId: string, active: boolean){
    this.dictTargetHandler.apply(handler => {
      if(active && handler.id === targetId){
        handler.nativeInput.classList.add(SPEECH_ACTIVE);
        handler.nativeCtrl.classList.add(SPEECH_ACTIVE);
      } else {
        handler.nativeInput.classList.remove(SPEECH_ACTIVE);
        handler.nativeCtrl.classList.remove(SPEECH_ACTIVE);
      }
      handler.showDictationFeedback(active);
    });
  }

  /**
   * Set the overlay for GUI feedback during dictation (speech input).
   *
   * @param  {ISpeechInputIndicator} speechOverlay
   *                         the overlay reference
   * @param  {boolean} [asSingleton] OPTIONAL
   *                        if the overlay should be used as singleton (i.e. reuse
   *                        this instance between views):
   *                        if specified, sets {@link #isDictationOverlaySingleton}
   */
  public setDictationOverlay(speechOverlay: ISpeechInputIndicator, asSingleton?: boolean): void {
    if(typeof asSingleton === 'boolean'){
      this.isDictationOverlaySingleton = asSingleton;
    }
    this.dictationOverlay = speechOverlay;
    this.updateDictationOverlayToCurrentState();
  }

  private updateDictationOverlayToCurrentState(){
      const subj = this._mmirProvider.speechEvents.speechInputState as any;
      if(subj && subj.source && subj.source.value){
        this.updateDictationOverlay(subj.source.value);
      }
  }

  private updateDictationOverlay(state: SpeechInputStateOptions){

    this.updateCurrentDictationTarget(state.targetId, state.active);

    if(!this.dictationOverlay || state.mode !== 'dictation'){
      return;
    }

    let handler: DictationHandler = this.dictTargetHandler.get(state.targetId);
    if(!handler){
      if(this._debugMsg) console.log('WARN: no dictation handler for dicatation target '+state.targetId);
      if(!state.active){
        this.setSpeechOverlay(null, this.dictationOverlay, false);
      }
    } else {
      this.setSpeechOverlay(handler.activationCtrl, this.dictationOverlay, state.active);
    }
  }

  private setSpeechOverlay(target: HTMLElement, speechOverlay: ISpeechInputIndicator, active?: boolean){

    if(speechOverlay){

      //is active was not defined, use current ASR status
      active = typeof active === 'undefined'? this._asrActive : active;

      //may get called before overlay-component has initialized:
      if(speechOverlay.initialized){

        if(active){
          speechOverlay.show({}, target);
        } else {
          speechOverlay.hide();
        }

      } else {
        //-> not yet initialized, so wait...

        //set state/target for when overlay is ready:
        speechOverlay.ready({show: active, target: target});
      }
    }

  }

  /**
   *
   * ttsClicked(event: Event, targetId?: string | ElementRef | HTMLElement)
   * ttsClicked(targetId: string | ElementRef | HTMLElement)
   *
   * @param  {Event} [event] if given, touch-feedback will be triggered
   * @param  {string | ElementRef | HTMLElement} [target]
   *                          The reading "target"/control widget (if omitted, the target of the event will be used)
   *                          (if omitted, but event is given, `event.target` will be used as reading target)
   * @param [readingData] if given, reading will be started for this reading data
   * @param [feedbackOptions] options for the touch feedback
   */
  /**
   * [ttsClicked description]
   * @param event [description]
   * @param target [description]
   */
  public ttsClicked(event?: Event | string | GuiElement | HTMLElement, target?: string | GuiElement | HTMLElement, readingData?: ReadingOptions, feedbackOptions?: FeedbackOption): void {

    if(event && (event as any).preventDefault){
      (event as any).preventDefault();
      this.triggerTouchFeedback(event as any, feedbackOptions);
    }

    if(!target && event && (event as Event).target) {
      target = (event as Event).target as HTMLElement;
      event = null;
    }

    this.startReading(readingData, target);
  }

  /**
   * [startReading description]
   * @param readingData [description]
   * @param target [description]
   */
  public startReading(readingData?: ReadingOptions, target?: string | GuiElement | HTMLElement): void {

    if(readingData){
      this.speech.raise('read-prompt', readingData);
    }

    let readTarget = this.readTargetHandler.tryGetAndPut(target);
    if(target){

      this.readTargetHandler.activeHandler = readTarget;

      const ctrl = readTarget.ctrl;
      if(this.readOverlay){
        // this.readOverlay.target = ctrl;
        this.readOverlay.startReading(event, ctrl);
      }
    }
  }

  /**
   * Set the GUI overlay feedback for active reading
   *
   * @param  {ISpeechOutputIndicator} readOverlay
   *                         the overlay reference
   * @param  {boolean} [asSingleton] OPTIONAL
   *                        if the overlay should be used as singleton (i.e. reuse
   *                        this instance between views):
   *                        if specified, sets {@link #isReadOverlaySingleton}
   */
  public setReadOverlay(readOverlay: ISpeechOutputIndicator, asSingleton?: boolean): void {
    if(typeof asSingleton === 'boolean'){
      this.isReadOverlaySingleton = asSingleton;
    }
    this.initReadOverlayInstance(readOverlay);
    this.updateReadOverlayToCurrentState();
  }

  private initReadOverlayInstance(readOverlay: ISpeechOutputIndicator): void {

    this.clearReadOverlaySubscription();

    this.readOverlay = readOverlay;

    //FIXME re-integrate read-overlay
    // if((readOverlay as ReadOverlay).onClicked){
    //   //add cancel-tts on-click functionality for read-overlay:
    //   this.readOverlayClickSubscription = (readOverlay as ReadOverlay).onClicked.subscribe(event => {
    //     this.triggerTouchFeedback(event);
    //     this.ttsCancel();
    //   });
    // }

  }

  private clearReadOverlaySubscription(): void {
    if(this.readOverlayClickSubscription && !this.readOverlayClickSubscription.closed){
      this.readOverlayClickSubscription.unsubscribe();
    }
    this.readOverlayClickSubscription = null;
  }

  private updateReadOverlayToCurrentState(){
      const subj = this._mmirProvider.speechEvents.readingState as any;
      if(subj && subj.source && subj.source.value){
        this.updateReadOverlay(subj.source.value, this.readTargetHandler.activeHandler);
      }
  }

  private updateReadOverlay(state: ReadingStateOptions, targetId?: string | ReadHandler){

    let active: boolean = state.active;
    if(!active && (state as StopReadingOptions).continuesReading){
      //if there is a next prompt/read-text immediately following the inactive state, do not actually set to inactive (but leave active)
      active = true;
    }

    this.updateCurrentReadTarget(targetId, active);

    if(!this.readOverlay){
      return;
    }

    let target: HTMLElement;
    let handler: ReadHandler = typeof targetId === 'string'? this.readTargetHandler.get(targetId) : targetId;
    if(handler){
      target = handler.ctrl;
    }
    this.doSetReadOverlay(target, this.readOverlay, active);
  }

  private doSetReadOverlay(target: HTMLElement, readOverlay: ISpeechOutputIndicator, active: boolean){

    if(readOverlay){

      //is active was not defined, use current ASR status
      active = typeof active === 'undefined'? this.ttsActive : active;
      active = target? active: false;

      //may get called before overlay-component has initialized:
      if(readOverlay.initialized){

        if(active){
          readOverlay.startReading({}, target);
        } else {
          readOverlay.stopReading();
        }

      } else {
        //-> not yet initialized, so wait...

        //set state/target for when overlay is ready:
        readOverlay.ready({show: active, target: target});
      }
    }

  }

  private updateCurrentReadTarget(targetId: string | ReadHandler, active: boolean){
    targetId = targetId && typeof targetId !== 'string'? targetId.id : targetId;
    this.readTargetHandler.apply(handler => {
      if(active && handler.id === targetId){
        handler.ctrl.classList.add(READ_ACTIVE);
      } else {
        handler.ctrl.classList.remove(READ_ACTIVE);
      }
    });
  }


  // public ttsClicked(event){
  //
  //   event.preventDefault();
  //
  //   if(this.asrActive){
  //     this.asrCancel(false);
  //   }
  //
  //   //FIXM
  //   // if(this.ttsActive){
  //   //   this.ttsCancel();
  //   // }
  //   // else {
  //   //   this.read(defaultPrompt);
  //   // }
  // }


  protected speechInputState(options: SpeechInputStateOptions): void {
    if(this._debugMsg) console.log('speechInputState -> ', options);
    this._asrActive = options.active;
    this.updateDictationOverlay(options);
    this.asrActiveChange.next(this._asrActive);
  };

  ////////////////////////////////////////// Speech Output Event Handlers ///////////////////////

  protected readingState(options: ReadingStateOptions): void {
    if(this._debugMsg) console.log('readingState -> ', options);

    this.prompt.setActive(options.active);
    this.updateReadOverlay(options, this.readTargetHandler.activeHandler);

    this.ttsActiveChange.next(this.prompt.active);
  };

  /**
   * Default implementation for `stopReading` (triggered by"reading-stopped" event):
   * cancel TTS reading, i.e. `this.ttsCancel(options)`
   *
   * NOTE: overwrite for changing the default behavior.
   *
   * @param  {StopReadingOptions} data the data specifying, which TTS engine should be stopped
   */
  public stopReading(options: StopReadingOptions): void {
    if(this._debugMsg) console.log('stopReading -> ', options);
    //NOTE raising 'reading-stopped' etc. is handled in prompt.cancel()
    this.ttsCancel(options);
  };


  /**
   * Default implementation for `cancelSpeechIO`:
   * cancel TTS reading and ASR input, i.e. `this.ttsCancel()` and `this.asrCancel(this.isPermanentCommandMode)`
   *
   * NOTE: overwrite for changing the default behavior.
   */
  public cancelSpeechIO(): void {
    if(this._debugMsg) console.log('cancelSpeechIO -> ()');
    this.ttsCancel();
    this.asrCancel(this.isPermanentCommandMode);
  };

}
