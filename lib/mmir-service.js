"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MmirService = void 0;
var rxjs_1 = require("rxjs");
var operators_1 = require("rxjs/operators");
var EmmaUtil_1 = require("./util/EmmaUtil");
var SpeechIoManager_1 = require("./util/SpeechIoManager");
var consts_1 = require("./consts");
var ConfigurationManagerCompat_1 = require("./util/ConfigurationManagerCompat");
var MmirService = /** @class */ (function () {
    function MmirService(mmir) {
        this._readyWaitTimeout = 10 * 60 * 1000; //10 min.
        this._mmir = mmir;
        this.init();
    }
    Object.defineProperty(MmirService.prototype, "mmir", {
        get: function () {
            return this._mmir;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(MmirService.prototype, "speechEvents", {
        get: function () {
            return this.evt;
        },
        enumerable: false,
        configurable: true
    });
    MmirService.prototype.init = function (engineConfig) {
        if (this._initialize) {
            return this._initialize; ///////////////////// EARLY EXIT ////////////
        }
        this.evt = {
            'speechInputState': new rxjs_1.BehaviorSubject({ active: false, mode: 'command', inputMode: '' } //<-initial state
            ).pipe((0, operators_1.distinctUntilChanged)(function (state1, state2) {
                return state1.active === state2.active && state1.mode === state2.mode && state1.inputMode === state2.inputMode && state1.targetId === state2.targetId;
            })),
            'changeMicLevels': new rxjs_1.BehaviorSubject({ isStart: false, active: false, mode: 'command', inputMode: '' } //<-initial state
            ).pipe((0, operators_1.distinctUntilChanged)(function (state1, state2) {
                return state1.isStart === state2.isStart && state1.active === state2.active && state1.mode === state2.mode && state1.inputMode === state2.inputMode && state1.targetId === state2.targetId;
            })),
            'waitReadyState': new rxjs_1.BehaviorSubject({ state: 'ready', module: '' } //<-initial state
            ).pipe((0, operators_1.distinctUntilChanged)(function (state1, state2) {
                return state1.state === state2.state && state1.module === state2.module;
            })),
            'dictationResult': new rxjs_1.Subject(),
            'speechCommand': new rxjs_1.Subject(),
            'commandAction': new rxjs_1.Subject(),
            'cancelSpeechIO': new rxjs_1.Subject(),
            'read': new rxjs_1.Subject(),
            'stopReading': new rxjs_1.Subject(),
            'readingState': new rxjs_1.BehaviorSubject({ active: false, contextId: '' } //<-initial state
            ).pipe((0, operators_1.distinctUntilChanged)(function (state1, state2) {
                if (state1.test || state2.test) {
                    return false;
                }
                return state1.active === state2.active && state1.contextId === state2.contextId &&
                    state1.readingId === state2.readingId && state1.targetId === state2.targetId &&
                    state1.readingData === state2.readingData;
            })),
            'tactile': new rxjs_1.Subject(),
            'tactileError': new rxjs_1.Subject(),
            //TODO GuidedInput events?
            //'guidedInput': {reset?: boolean, start?: boolean, context?: /*default: */ 'global' | 'control'}// ORIG: 'resetGuidedInputForCurrentControl' | 'startGuidedInput' | 'resetGuidedInput'
            'asrError': new rxjs_1.Subject(),
            'ttsError': new rxjs_1.Subject(),
            'playError': new rxjs_1.Subject(),
        };
        // pre-set setting for debug output:
        //  (technically we should wait for mmir initialization to finish (in order
        //   to lookup any settings), but since this setting is not really important
        //   for how the class functions, we just continue anyway)
        this.isDebugVui = true;
        this._initialize = this.mmirInit(engineConfig);
        return this._initialize;
    };
    /** NOTE must not be called before mmir.ready() has been emitted */
    MmirService.prototype.initDebugVui = function () {
        var isEnabled = this.mmir.conf.getBoolean('showVuiDebugOutput');
        this.isDebugVui = isEnabled;
        if (this.mmir && this.mmir.speechioManager) {
            var dlg = this.mmir.speechioManager;
            dlg._isDebugVui = isEnabled;
        }
    };
    MmirService.prototype.ready = function () {
        var _this = this;
        if (!this._initialize) {
            if (!this._readyWait) {
                console.warn('Called MmirService.ready() before init(): waiting...');
                this._readyWait = new Promise(function (resolve, reject) {
                    //resolve "wait for ready":
                    _this._resolveReadyWait = function (mmirProvider) {
                        clearTimeout(_this._readyWaitTimer);
                        mmirProvider.mmir.require('mmirf/logger').log('MmirService.ready(): resolved ready.');
                        resolve(mmirProvider);
                        _this._readyWait = null;
                        _this._resolveReadyWait = null;
                    };
                    //set timeout for waiting to resolve:
                    _this._readyWaitTimer = setTimeout(function () {
                        reject('Timed out waiting for MmirService initialization (exceeded timeout _readyWaitTimeout: ' + _this._readyWaitTimeout + ' ms)');
                    }, _this._readyWaitTimeout);
                });
            }
            return this._readyWait;
        }
        return this._initialize;
    };
    MmirService.prototype.mmirInit = function (engineConfig) {
        var _this = this;
        //promise for setting up mmir
        return new Promise(function (resolve) {
            _this._mmir.ready(function () {
                (0, ConfigurationManagerCompat_1.makeConfigurationManagerCompat)(_this._mmir.conf);
                _this.initDebugVui();
                (0, SpeechIoManager_1.createSpeechioManager)(_this._mmir, _this.isDebugVui ? 'debug' : void (0)).then(function () {
                    // this.platform.setLang(this.mmir.lang.getLanguage(), true); FIXME set HTML language attribute!?!
                    _this.mmir.media.on('errorplay', function (audio, error) {
                        _this.evt.playError.next({ audio: audio, error: error });
                    });
                    var media = _this.mmir.media;
                    media.waitReadyImpl = {
                        eventHandler: _this.evt,
                        preparing: function (module) {
                            this.eventHandler.waitReadyState.next({ state: 'wait', module: module });
                        },
                        ready: function (module) {
                            this.eventHandler.waitReadyState.next({ state: 'ready', module: module });
                        }
                    };
                    var dlg = _this.mmir.speechioManager;
                    dlg.eventEmitter = _this.evt;
                    dlg._isDebugVui = _this.isDebugVui;
                    dlg.emma = EmmaUtil_1.EmmaUtil.create(_this.mmir);
                    _this._mmir.emma = dlg.emma;
                    var asyncInit = [];
                    var initInputRes = _this.raiseInternalInit(_this.mmir.speechioEngine, {
                        mmir: _this._mmir,
                        emma: dlg.emma,
                        pluginId: consts_1.PLUGIN_ID
                    }, engineConfig === null || engineConfig === void 0 ? void 0 : engineConfig.speechIoInitConfig);
                    if (initInputRes) {
                        asyncInit.push(initInputRes);
                    }
                    var dialog = _this.mmir.dialog;
                    dialog.eventEmitter = {};
                    dialog.emma = _this._mmir.emma;
                    (0, SpeechIoManager_1.upgrade)(dialog);
                    if (_this.mmir.conf.getBoolean([consts_1.PLUGIN_ID, 'preventDialogManagerInit']) !== true) {
                        _this.initDialogAndInputEngine(engineConfig, asyncInit);
                    }
                    var doResolve = function () {
                        if (_this._resolveReadyWait) {
                            _this._resolveReadyWait(_this);
                        }
                        resolve(_this);
                    };
                    if (asyncInit.length > 0) {
                        Promise.all(asyncInit).then(function () { return doResolve(); });
                    }
                    else {
                        doResolve();
                    }
                }); //END   createSpeechio().then(...
            }); //END mmir.ready(...
        }); //END: new Promise()
    };
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
    MmirService.prototype.initDialogAndInputEngine = function (engineConfig, asyncInitTaskList) {
        var dlg = this.mmir.speechioManager;
        var initIptRes = this.raiseInternalInit(this.mmir.inputEngine, {
            mmir: this._mmir,
            emma: dlg.emma
        }, engineConfig === null || engineConfig === void 0 ? void 0 : engineConfig.inputInitConfig);
        if (asyncInitTaskList && initIptRes) {
            asyncInitTaskList.push(initIptRes);
        }
        var initDlgRes = this.raiseInternalInit(this.mmir.dialogEngine, {
            mmir: this._mmir,
            emma: dlg.emma
        }, engineConfig === null || engineConfig === void 0 ? void 0 : engineConfig.dialogInitConfig);
        if (asyncInitTaskList && initDlgRes) {
            asyncInitTaskList.push(initDlgRes);
        }
    };
    /**
     * HELPER circumvent message-queue for init-event:
     *       (this allows to pass non-stringified and non-stringifyable object instances)
     */
    MmirService.prototype.raiseInternalInit = function (stateMachine, baseConfig, managerInitConfig) {
        if (managerInitConfig && typeof managerInitConfig.then === 'function') {
            return managerInitConfig.then(function (config) { return (0, SpeechIoManager_1.raiseInternal)(stateMachine, 'init', Object.assign(config ? config : {}, baseConfig)); });
        }
        (0, SpeechIoManager_1.raiseInternal)(stateMachine, 'init', Object.assign(managerInitConfig ? managerInitConfig : {}, baseConfig));
    };
    MmirService.prototype.setSpeechIoDebugLevel = function (logLevel) {
        var Logger = this._mmir.require('mmirf/logger');
        Logger.get(consts_1.SPEECH_IO_MANAGER_ID).setLevel(logLevel);
        Logger.get(consts_1.SPEECH_IO_INPUT_ID).setLevel(logLevel);
        Logger.get(consts_1.SPEECH_IO_ENGINE_ID).setLevel(logLevel);
        Logger.get(consts_1.SPEECH_IO_INPUT_ENGINE_ID).setLevel(logLevel);
    };
    return MmirService;
}());
exports.MmirService = MmirService;
//# sourceMappingURL=mmir-service.js.map