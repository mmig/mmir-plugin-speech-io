"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoiceUIController = void 0;
var rxjs_1 = require("rxjs");
var consts_1 = require("../consts");
var HapticFeedback_1 = require("../io/HapticFeedback");
var PromptReader_1 = require("../io/PromptReader");
var SpeechInputController_1 = require("../ctrl/SpeechInputController");
var SpeechOutputController_1 = require("../ctrl/SpeechOutputController");
var SubscriptionUtil_1 = require("../util/SubscriptionUtil");
var SpeechDictation_1 = require("../io/SpeechDictation");
var SpeechReading_1 = require("../io/SpeechReading");
var VoiceUIController = /** @class */ (function () {
    function VoiceUIController(mmirProvider) {
        var _this = this;
        this._asrActive = false;
        /**
         * FLAG for "permanent command mode":
         * if true, speech-input for command mode will stay active on page/view changes
         * @type {boolean}
         */
        this.isPermanentCommandMode = false;
        this._debugMsg = false;
        this._defaultDictationFeedbackStyle = 'interim'; //'unstable';//FIXME retrieve from settings?
        this._initialized = false;
        this._mmirProvider = mmirProvider;
        this.mmir = this._mmirProvider.mmir;
        // this.subsUtil = new SubscriptionUtil(this.mmir);
        this.dictTargetHandler = new SpeechDictation_1.DictationTargetHandler();
        this.readTargetHandler = new SpeechReading_1.ReadTargetHandler();
        this.activePageSubscriptions = [];
        this.asrActiveChange = new rxjs_1.BehaviorSubject(false);
        this.ttsActiveChange = new rxjs_1.BehaviorSubject(false);
        this.isDictationOverlaySingleton = false;
        this.isReadOverlaySingleton = false;
        this.initializing = mmirProvider.ready().then(function () {
            _this._initialized = true;
            _this.prompt = new PromptReader_1.PromptReader(_this.speech, _this.mmir.media);
            _this.prompt.cancelOnNew = true; //FIXME retrieve from settings?
            _this.speechIn = new SpeechInputController_1.SpeechInputController(mmirProvider, _this.dictTargetHandler);
            _this.speechOut = new SpeechOutputController_1.SpeechOutputController(_this.prompt, mmirProvider);
            _this._speechEventSubscriptions = SubscriptionUtil_1.SubscriptionUtil.subscribe(mmirProvider.speechEvents, [
                'showSpeechInputState',
                'changeMicLevels',
                'cancelSpeechIO',
                'stopReading',
                'showReadingStatus'
                //'resetGuidedInputForCurrentControl' , 'startGuidedInput' , 'resetGuidedInput' , 'isDictAutoProceed'
            ], _this);
            return _this;
        });
    }
    Object.defineProperty(VoiceUIController.prototype, "speech", {
        get: function () {
            return this.mmir.speechioManager;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(VoiceUIController.prototype, "asrActive", {
        get: function () { return this._asrActive; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(VoiceUIController.prototype, "ttsActive", {
        get: function () { return this.prompt ? this.prompt.active : false; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(VoiceUIController.prototype, "debug", {
        get: function () { return this._debugMsg; },
        set: function (value) {
            this._debugMsg = value;
            this.speechIn.debug = value;
            this.speechOut.debug = value;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(VoiceUIController.prototype, "initialized", {
        get: function () {
            return this._initialized;
        },
        enumerable: false,
        configurable: true
    });
    VoiceUIController.prototype.ready = function () {
        return this.initializing;
    };
    VoiceUIController.prototype.destroy = function () {
        if (this.speechIn) {
            this.speechIn.destroy();
        }
        if (this.speechOut) {
            this.speechOut.destroy();
        }
        this.releaseUiResources(true);
        this.dictTargetHandler.destroy();
        this.readTargetHandler.destroy();
        SubscriptionUtil_1.SubscriptionUtil.unsubscribe(this._speechEventSubscriptions);
    };
    VoiceUIController.prototype.getPromptReader = function () {
        return this.prompt;
    };
    /**
     * stop speech-input/close microphone
     *
     * @param  {boolean} leaveCommandActive
     *              if true, speech-input will not be canceled, if it is currently
     *              in command mode, or guided-input mode
     *              (i.e. only canceled if in "pure" dictation mode)
     */
    VoiceUIController.prototype.asrCancel = function (leaveCommandActive) {
        var action = leaveCommandActive ? 'cancel-non-guided-dictation' : 'cancel-speech-input';
        this.speech.raise(action);
    };
    VoiceUIController.prototype.ttsCancel = function (options) {
        if (this.prompt) {
            this.prompt.cancel(options);
        }
    };
    VoiceUIController.prototype.asrEngine = function (engine) {
        var _this = this;
        if (this.mmir.speechioManager) {
            this._asrEngine(engine);
        }
        else if (this.initializing) {
            this.initializing.then(function () {
                _this._asrEngine(engine);
            });
        }
        else {
            console.error('VoiceUIController.asrEngine: cannot set ASR engine "' + engine + '", because mmir.speechioManager is not availabe!');
        }
    };
    VoiceUIController.prototype.ttsEngine = function (engine) {
        var _this = this;
        if (this.prompt) {
            this._ttsEngine(engine);
        }
        else if (this.initializing) {
            this.initializing.then(function () {
                _this._ttsEngine(engine);
            });
        }
        else {
            console.error('VoiceUIController.ttsEngine: cannot set TTS engine "' + engine + '", because prompt (PromptReader) is not availabe!');
        }
    };
    VoiceUIController.prototype.enableBargeIn = function (enable) {
        var _this = this;
        if (this.mmir.speechioManager) {
            this._enableBargeIn(enable);
        }
        else if (this.initializing) {
            this.initializing.then(function () {
                _this._enableBargeIn(enable);
            });
        }
        else {
            console.error('VoiceUIController.enableBargeIn: cannot set enableBargeIn to ' + enable + ', because mmir.speechioManager is not availabe!');
        }
    };
    /** @deprecated use [[ enterView ]] */
    VoiceUIController.prototype.enterViewWith = function (asrActiveHandler, ttsActiveHandler) {
        var viewSubscriptions;
        if (asrActiveHandler || ttsActiveHandler) {
            viewSubscriptions = [];
        }
        if (asrActiveHandler) {
            viewSubscriptions.push(this.asrActiveChange.subscribe(asrActiveHandler));
        }
        if (ttsActiveHandler) {
            viewSubscriptions.push(this.ttsActiveChange.subscribe(ttsActiveHandler));
        }
        return this.enterView(viewSubscriptions);
    };
    /**
     * HELPER when entering a new view / page:
     * resets handlers, subscriptions etc. from previous view and intializes handlers, subscriptions etc.
     * for the new view.
     *
     * @param  [viewSubscriptions] OPITONAL subscriptions for the newly entered view (will be canceled when leaving the view or entering a new view)
     * @return the READY promise for the VoiceUiController
     */
    VoiceUIController.prototype.enterView = function (viewSubscriptions) {
        //cancel any previous subscriptions:
        this.doUnsubscribeCurrentPage();
        this.dictTargetHandler.reset();
        this.readTargetHandler.reset();
        if (viewSubscriptions) {
            this.addViewSubscription(viewSubscriptions);
        }
        return this.initializing;
    };
    /**
     * Remembers the subscription for the current/active view, and
     * unsubscribes when #leaveView is triggered.
     *
     * @param {Subscription} subscription
     */
    VoiceUIController.prototype.addViewSubscription = function (subscription) {
        if (Array.isArray(subscription)) {
            for (var _i = 0, subscription_1 = subscription; _i < subscription_1.length; _i++) {
                var subs = subscription_1[_i];
                this.activePageSubscriptions.push(subs);
            }
        }
        else {
            this.activePageSubscriptions.push(subscription);
        }
    };
    /**
     * HELPER for leaving a view / page:
     *
     * resets/cancels handlers, resources, subscriptions etc. from current view and intializes handlers,
     * and cancels active ASR (if not <code>isPermanentCommandMode</code>) as well as active prompts/TTS.
     */
    VoiceUIController.prototype.leaveView = function () {
        this.doUnsubscribeCurrentPage();
        this.releasePageResources();
        this.dictTargetHandler.reset();
        this.readTargetHandler.reset();
        //stop all voice input/output interactions (i.e. close microphone, stop reading ...)
        //NOTE would need special treatment, if pending ASR results should be stored/used!!!
        this.asrCancel(this.isPermanentCommandMode);
        this.ttsCancel();
    };
    VoiceUIController.prototype._asrEngine = function (engine) {
        if (this.asrActive) {
            this.asrCancel(false);
        }
        this.mmir.speechioManager.raise('setAsrEngine', engine);
    };
    VoiceUIController.prototype._ttsEngine = function (engine) {
        if (this.ttsActive) {
            this.ttsCancel();
        }
        this.prompt.ttsCtx = engine;
    };
    VoiceUIController.prototype._enableBargeIn = function (enable) {
        this.mmir.speechioManager.raise('enableBargeIn', enable);
    };
    VoiceUIController.prototype.doUnsubscribeCurrentPage = function () {
        var len = this.activePageSubscriptions.length;
        if (len > 0) {
            for (var i = 0; i < len; ++i) {
                this.activePageSubscriptions[i].unsubscribe();
            }
            this.activePageSubscriptions.splice(0, len);
        }
    };
    VoiceUIController.prototype.releasePageResources = function () {
        this.releaseUiResources(false);
    };
    VoiceUIController.prototype.releaseUiResources = function (force) {
        if (this.dictationOverlay) {
            if (this.dictationOverlay.visible) {
                this.dictationOverlay.hide();
            }
            if (force || !this.isDictationOverlaySingleton) {
                this.dictationOverlay = null;
            }
        }
        if (this.readOverlay) {
            if (this.readOverlay.visible) {
                this.readOverlay.stopReading();
            }
            if (force || !this.isReadOverlaySingleton) {
                this.clearReadOverlaySubscription();
                this.readOverlay = null;
            }
        }
    };
    VoiceUIController.prototype.handleClick = function (event, name, data) {
        this.triggerTouchFeedback(event);
        // this.inp.raise('touch_input_event');
        // this.inp.raise('click_on_' + name, data);
        var emmaEvt = this.mmir.emma.toEmma(event, data);
        this.mmir.emma._setEmmaFuncData(emmaEvt, 'gesture', {
            name: name
        });
        // this.mmir.emma.addTarget(emmaEvt, name, true);
        // this.mmir.emma.addProperty(emmaEvt, 'data', data, true);
        if (this._debugMsg)
            console.log(emmaEvt);
        this.mmir.speechioInput.raise('touch', emmaEvt);
    };
    VoiceUIController.prototype.localize = function (res) {
        if (this.mmir.lang) {
            return this.mmir.lang.getText(res);
        }
        else {
            //if(this._debugMsg) console.info('mmir.LanguageManager not ready yet...');
            return '';
        }
    };
    VoiceUIController.prototype.evalSemantics = function (asr_result) {
        var _this = this;
        this.mmir.semantic.interpret(asr_result, null, function (result) {
            var semantic;
            if (result.semantic != null) {
                semantic = result.semantic;
                semantic.phrase = asr_result;
                if (_this._debugMsg)
                    console.log("semantic : " + result.semantic); //DEBUG
            }
            else {
                //create "no-match" semantic-object:
                semantic = {
                    "NoMatch": {
                        "phrase": asr_result
                    }
                };
            }
            //TODO create emma-understanding event
            _this.mmir.speechioInput.raise("speech_input_event", semantic);
        });
    };
    VoiceUIController.prototype.triggerTouchFeedback = function (_event, feedbackOptions) {
        HapticFeedback_1.triggerClickFeedback(feedbackOptions);
    };
    ////////////////////////////////////////// Speech IO ////////////////////////
    VoiceUIController.prototype.commandClicked = function (event, btnId, feedbackOptions) {
        if (event && event.preventDefault) {
            event.preventDefault();
        }
        //if(this._debugMsg) console.log('commandClicked');
        if (this.ttsActive && (!feedbackOptions || (feedbackOptions && feedbackOptions.ttsCancel !== false))) {
            this.ttsCancel();
        }
        // if(!isSyntheticClick(event))//TODO detect programatically triggered invocations of this function?
        this.triggerTouchFeedback(event, feedbackOptions);
        this.speech.raise('toggleSpeechInputState', { mode: 'command', targetId: btnId });
        this.speech.raise('showSpeechState');
    };
    /**
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
    VoiceUIController.prototype.dictationClicked = function (event, targetId, feedbackStyle, touchFeedback) {
        if (event && event.preventDefault) {
            event.preventDefault();
        }
        //if(this._debugMsg) console.log('dictationClicked');
        if (this.ttsActive && (!touchFeedback || (touchFeedback && touchFeedback.ttsCancel !== false))) {
            this.ttsCancel();
        }
        // if(!isSyntheticClick(event))//TODO detect programatically triggered invocations of this function?
        this.triggerTouchFeedback(event, touchFeedback);
        var handler = this.initDictationTarget(targetId, feedbackStyle);
        this.speech.raise('toggleSpeechInputState', { mode: 'dictation', targetId: handler ? handler.id : targetId });
        this.speech.raise('showSpeechState');
    };
    VoiceUIController.prototype.initDictationTarget = function (targetId, feedbackStyle) {
        var targetRef;
        if (typeof targetId !== 'string') {
            targetRef = targetId;
            targetId = targetId.id;
        }
        feedbackStyle = feedbackStyle ? feedbackStyle : this._defaultDictationFeedbackStyle;
        var handler = this.dictTargetHandler.get(targetId);
        if (!handler) {
            if (targetRef) {
                handler = this.speechIn.createDictationTarget(targetRef, targetId, feedbackStyle);
            }
            else {
                console.error('dictationClicked: missing DictationTarget, cannot create DiactationHandler for ' + targetId);
                //TODO throw error or something?
                return null; /////////////// EARLY EXIT /////////////////////
            }
            this.dictTargetHandler.put(targetId, handler);
        }
        handler.prepare();
        return handler;
    };
    VoiceUIController.prototype.updateCurrentDictationTarget = function (targetId, active) {
        this.dictTargetHandler.apply(function (handler) {
            if (active && handler.id === targetId) {
                handler.nativeInput.classList.add(consts_1.SPEECH_ACTIVE);
                handler.nativeCtrl.classList.add(consts_1.SPEECH_ACTIVE);
            }
            else {
                handler.nativeInput.classList.remove(consts_1.SPEECH_ACTIVE);
                handler.nativeCtrl.classList.remove(consts_1.SPEECH_ACTIVE);
            }
            handler.showDictationFeedback(active);
        });
    };
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
    VoiceUIController.prototype.setDictationOverlay = function (speechOverlay, asSingleton) {
        if (typeof asSingleton === 'boolean') {
            this.isDictationOverlaySingleton = asSingleton;
        }
        this.dictationOverlay = speechOverlay;
        this.updateDictationOverlayToCurrentState();
    };
    VoiceUIController.prototype.updateDictationOverlayToCurrentState = function () {
        var subj = this._mmirProvider.speechEvents.showSpeechInputState;
        if (subj && subj.source && subj.source.value) {
            this.updateDictationOverlay(subj.source.value);
        }
    };
    VoiceUIController.prototype.updateDictationOverlay = function (state) {
        this.updateCurrentDictationTarget(state.targetId, state.state);
        if (!this.dictationOverlay || state.mode !== 'dictation') {
            return;
        }
        var handler = this.dictTargetHandler.get(state.targetId);
        if (!handler) {
            if (this._debugMsg)
                console.log('WARN: no dictation handler for dicatation target ' + state.targetId);
            if (!state.state) {
                this.setSpeechOverlay(null, this.dictationOverlay, false);
            }
        }
        else {
            this.setSpeechOverlay(handler.activationCtrl, this.dictationOverlay, state.state);
        }
    };
    VoiceUIController.prototype.setSpeechOverlay = function (target, speechOverlay, active) {
        if (speechOverlay) {
            //is active was not defined, use current ASR status
            active = typeof active === 'undefined' ? this._asrActive : active;
            //may get called before overlay-component has initialized:
            if (speechOverlay.initialized) {
                if (active) {
                    speechOverlay.show({}, target);
                }
                else {
                    speechOverlay.hide();
                }
            }
            else {
                //-> not yet initialized, so wait...
                //set state/target for when overlay is ready:
                speechOverlay.ready({ show: active, target: target });
            }
        }
    };
    /**
     *
     * ttsClicked(event: Event, targetId?: string | ElementRef | HTMLElement)
     * ttsClicked(targetId: string | ElementRef | HTMLElement)
     *
     * @param  {Event} [event]
     * @param  {string | ElementRef | HTMLElement} [target]
     *                          The reading "target"/control widget (if omitted, the target of the event will be used)
     */
    VoiceUIController.prototype.ttsClicked = function (event, targetId, feedbackOptions) {
        if (event && event.preventDefault) {
            event.preventDefault();
            this.triggerTouchFeedback(event, feedbackOptions);
        }
        if (!event || !event.target) {
            targetId = event;
            event = null;
        }
        var target = this.readTargetHandler.tryGetAndPut(targetId, event);
        if (target) {
            this.readTargetHandler.activeHandler = target;
            var ctrl = target.ctrl;
            if (this.readOverlay) {
                // this.readOverlay.target = ctrl;
                this.readOverlay.startReading(event, ctrl);
            }
        }
    };
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
    VoiceUIController.prototype.setReadOverlay = function (readOverlay, asSingleton) {
        if (typeof asSingleton === 'boolean') {
            this.isReadOverlaySingleton = asSingleton;
        }
        this.initReadOverlayInstance(readOverlay);
        this.updateReadOverlayToCurrentState();
    };
    VoiceUIController.prototype.initReadOverlayInstance = function (readOverlay) {
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
    };
    VoiceUIController.prototype.clearReadOverlaySubscription = function () {
        if (this.readOverlayClickSubscription && !this.readOverlayClickSubscription.closed) {
            this.readOverlayClickSubscription.unsubscribe();
        }
        this.readOverlayClickSubscription = null;
    };
    VoiceUIController.prototype.updateReadOverlayToCurrentState = function () {
        var subj = this._mmirProvider.speechEvents.showReadingStatus;
        if (subj && subj.source && subj.source.value) {
            this.updateReadOverlay(subj.source.value, this.readTargetHandler.activeHandler);
        }
    };
    VoiceUIController.prototype.updateReadOverlay = function (state, targetId) {
        var active = state.active;
        if (!active && state.continuesReading) {
            //if there is a next prompt/read-text immediately following the inactive state, do not actually set to inactive (but leave active)
            active = true;
        }
        this.updateCurrentReadTarget(targetId, active);
        if (!this.readOverlay) {
            return;
        }
        var target;
        var handler = typeof targetId === 'string' ? this.readTargetHandler.get(targetId) : targetId;
        if (handler) {
            target = handler.ctrl;
        }
        this.doSetReadOverlay(target, this.readOverlay, active);
    };
    VoiceUIController.prototype.doSetReadOverlay = function (target, readOverlay, active) {
        if (readOverlay) {
            //is active was not defined, use current ASR status
            active = typeof active === 'undefined' ? this.ttsActive : active;
            active = target ? active : false;
            //may get called before overlay-component has initialized:
            if (readOverlay.initialized) {
                if (active) {
                    readOverlay.startReading({}, target);
                }
                else {
                    readOverlay.stopReading();
                }
            }
            else {
                //-> not yet initialized, so wait...
                //set state/target for when overlay is ready:
                readOverlay.ready({ show: active, target: target });
            }
        }
    };
    VoiceUIController.prototype.updateCurrentReadTarget = function (targetId, active) {
        targetId = targetId && typeof targetId !== 'string' ? targetId.id : targetId;
        this.readTargetHandler.apply(function (handler) {
            if (active && handler.id === targetId) {
                handler.ctrl.classList.add(consts_1.READ_ACTIVE);
            }
            else {
                handler.ctrl.classList.remove(consts_1.READ_ACTIVE);
            }
        });
    };
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
    VoiceUIController.prototype.showSpeechInputState = function (options) {
        if (this._debugMsg)
            console.log('showSpeechInputState -> ', options);
        this._asrActive = options.state;
        this.updateDictationOverlay(options);
        this.asrActiveChange.next(this._asrActive);
    };
    ;
    /**
     * If <code>options.isStart === true</code>:
     * Called when GUI should show indicator for Microphone input levels.
     *
     * This should also initialize/start listening to mic-levels changes, e.g.
     * register a listener:
     * <pre>
     * mmir.MediaManager.on('miclevelchanged', miclevelsChandeHandler);
     * </pre>
     * where miclevelsChandeHandler:
     *    function(micLevel: number)
     *
     *
     * If <code>options.isStart === false</code>:
     * Called when GUI should hide/deactivate indicator for Microphone input levels.
     *
     * This should destroy/free resource that were set up for visualizing mic-level
     * changes, e.g. could stop listening to mic-level changes, i.e. unregister listener:
     * <pre>
     * mmir.MediaManager.off('miclevelchanged', miclevelsChandeHandler);
     * </pre>
     *
     * @param {SpeechFeedbackOptions} options
     *              the data specifying the (changed) speech input state etc.
     */
    VoiceUIController.prototype.changeMicLevels = function (options) {
        if (this._debugMsg)
            console.log('changeMicLevels -> ', options);
    };
    ;
    ////////////////////////////////////////// Speech Output Event Handlers ///////////////////////
    VoiceUIController.prototype.showReadingStatus = function (options) {
        if (this._debugMsg)
            console.log('showReadingStatus -> ', options);
        this.prompt.setActive(options.active);
        this.updateReadOverlay(options, this.readTargetHandler.activeHandler);
        this.ttsActiveChange.next(this.prompt.active);
    };
    ;
    /**
     * Called when reading should be stopped / aborted.
     *
     * If reading is/was active and is stopped, the "reading-stopped" event must be
     * triggered:
     *
     * <pre>
     * mmir.speechioManager.raise('reading-stopped')
     * </pre>
     *
     * @param  {StopReadingOptions} data the data specifying, which TTS engine should be stopped
     */
    VoiceUIController.prototype.stopReading = function (options) {
        if (this._debugMsg)
            console.log('stopReading -> ', options);
        //NOTE raising 'reading-stopped' etc. is handled in prompt.cancel()
        this.ttsCancel(options);
    };
    ;
    /**
     * Called when speech input (ASR; recogintion) AND speech output (TTS; synthesis)
     * should be stopped.
     */
    VoiceUIController.prototype.cancelSpeechIO = function () {
        if (this._debugMsg)
            console.log('cancelSpeechIO -> ()');
        this.ttsCancel();
        this.asrCancel(this.isPermanentCommandMode);
    };
    ;
    return VoiceUIController;
}());
exports.VoiceUIController = VoiceUIController;
//# sourceMappingURL=VoiceUIController.js.map