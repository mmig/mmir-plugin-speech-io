"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var rxjs_1 = require("rxjs");
var operators_1 = require("rxjs/operators");
var EmmaUtil_1 = require("./util/EmmaUtil");
var SpeechIoManager_1 = require("./util/SpeechIoManager");
var consts_1 = require("./consts");
var SettingsUtils_1 = require("./util/SettingsUtils");
var MmirService = /** @class */ (function () {
    function MmirService(mmir) {
        this._readyWaitTimeout = 10 * 60 * 1000; //10 min.
        this._mmir = mmir;
    }
    Object.defineProperty(MmirService.prototype, "mmir", {
        get: function () {
            return this._mmir;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(MmirService.prototype, "speechEvents", {
        get: function () {
            return this.evt;
        },
        enumerable: true,
        configurable: true
    });
    //FIXME find better way to "inject" dependencies
    MmirService.prototype.init = function (appConfig) {
        var _this = this;
        var _args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            _args[_i - 1] = arguments[_i];
        }
        this.appConfig = appConfig;
        if (!this.appConfig) {
            this._isCreateAppConfigImpl = true;
        }
        this.evt = {
            'showSpeechInputState': new rxjs_1.BehaviorSubject({ state: false, mode: 'command', inputMode: '' } //<-initial state
            ).pipe(operators_1.distinctUntilChanged(function (state1, state2) {
                return state1.state === state2.state && state1.mode === state2.mode && state1.inputMode === state2.inputMode && state1.targetId === state2.targetId;
            })),
            'changeMicLevels': new rxjs_1.BehaviorSubject({ isStart: false, state: false, mode: 'command', inputMode: '' } //<-initial state
            ).pipe(operators_1.distinctUntilChanged(function (state1, state2) {
                return state1.isStart === state2.isStart && state1.state === state2.state && state1.mode === state2.mode && state1.inputMode === state2.inputMode && state1.targetId === state2.targetId;
            })),
            'waitReadyState': new rxjs_1.BehaviorSubject({ state: 'ready', module: '' } //<-initial state
            ).pipe(operators_1.distinctUntilChanged(function (state1, state2) {
                return state1.state === state2.state && state1.module === state2.module;
            })),
            'showDictationResult': new rxjs_1.Subject(),
            'determineSpeechCmd': new rxjs_1.Subject(),
            'execSpeechCmd': new rxjs_1.Subject(),
            'cancelSpeechIO': new rxjs_1.Subject(),
            'read': new rxjs_1.Subject(),
            'stopReading': new rxjs_1.Subject(),
            'showReadingStatus': new rxjs_1.BehaviorSubject({ active: false, contextId: '' } //<-initial state
            ).pipe(operators_1.distinctUntilChanged(function (state1, state2) {
                if (state1.test || state2.test) {
                    return false;
                }
                return state1.active === state2.active && state1.contextId === state2.contextId &&
                    state1.readingId === state2.readingId && state1.targetId === state2.targetId &&
                    state1.readingData === state2.readingData;
            })),
            //TODO GuidedInput events?
            //'guidedInput': {reset?: boolean, start?: boolean, context?: /*default: */ 'global' | 'control'}// ORIG: 'resetGuidedInputForCurrentControl' | 'startGuidedInput' | 'resetGuidedInput'
            'playError': new rxjs_1.Subject()
        };
        // apply setting for debug output:
        //  (technically we should wait for the promise to finish, but since this
        //   setting is not really important for how the class functions, we just
        //   continue anyway)
        this.isDebugVui = true;
        this.appConfig.get('showVuiDebugOutput').then(function (isEnabled) {
            _this.isDebugVui = isEnabled;
            if (_this.mmir && _this.mmir.speechioManager) {
                var dlg = _this.mmir.speechioManager;
                dlg._isDebugVui = isEnabled;
            }
        });
        if (!this._initialize) {
            this._initialize = this.mmirInit();
        }
        return this._initialize;
    };
    MmirService.prototype.ready = function () {
        var _this = this;
        if (!this._initialize) {
            if (!this._readyWait) {
                console.log('Called MmirService.ready() before init(): waiting...');
                this._readyWait = new Promise(function (resolve, reject) {
                    //resolve "wait for ready":
                    _this._resolveReadyWait = function (mmirProvider) {
                        clearTimeout(_this._readyWaitTimer);
                        console.log('Resolved "wait for MmirService.ready()".');
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
    MmirService.prototype.mmirInit = function () {
        var _this = this;
        //promise for setting up mmir
        return new Promise(function (resolve) {
            _this._mmir.ready(function () {
                if (_this._isCreateAppConfigImpl === true && !_this.appConfig) {
                    _this.appConfig = SettingsUtils_1.createConfigSettingsImpl(_this._mmir.conf);
                }
                SpeechIoManager_1.createSpeechioManager(_this._mmir, _this.isDebugVui ? 'debug' : void (0)).then(function () {
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
                    //circumvent message-queue for init-event:
                    // (this allows to pass non-stringified and non-stringifyable object instances)
                    var dlgEngine = _this.mmir.speechioEngine;
                    dlgEngine.worker._engineGen.call(dlgEngine.worker._engineInstance, 'init', {
                        appConfig: _this.appConfig,
                        mmir: _this._mmir,
                        emma: dlg.emma,
                        pluginId: consts_1.PLUGIN_ID
                    });
                    if (_this._resolveReadyWait) {
                        _this._resolveReadyWait(_this);
                    }
                    resolve(_this);
                }); //END   createSpeechio().then(...
            }); //END mmir.ready(...
        }); //END: new Promise()
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