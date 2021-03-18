"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromptReader = void 0;
var consts_1 = require("../consts");
var PromptReader = /** @class */ (function () {
    function PromptReader(dlg, config, media) {
        this.dlg = dlg;
        this.config = config;
        this.media = media;
        this._ttsActive = false;
        this._cancelOnNew = false;
        this.initSettings();
    }
    Object.defineProperty(PromptReader.prototype, "active", {
        /** if TTS is currently active */
        get: function () { return this._ttsActive; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(PromptReader.prototype, "ttsEngine", {
        /** context for tts(): set to FALSY for default context
         * @see mmir.media.setDefaultCtx(ctx: string | null)
         *
         * @example
         * // set via configurationManager
         * mmir.conf.set('speechio.ttsEngine', ttsCtx)
         */
        get: function () {
            return this._ttsCtx;
        },
        enumerable: false,
        configurable: true
    });
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
    PromptReader.prototype.getDefaultOptions = function () {
        return this._ttsDefaultOptions;
    };
    Object.defineProperty(PromptReader.prototype, "cancelOnNew", {
        /** if a prompt is active, when a new one is requested: cancel the current one, or discard the new one?  */
        get: function () {
            return this._cancelOnNew;
        },
        enumerable: false,
        configurable: true
    });
    PromptReader.prototype.initSettings = function () {
        var _this = this;
        this.config.on([consts_1.PLUGIN_ID, consts_1.CANCEL_ON_NEW_PROMPT_CONFIG], function (newValue) {
            _this._cancelOnNew = newValue;
        });
        this.config.on([consts_1.PLUGIN_ID, consts_1.TTS_ENGINE_CONFIG], function (newValue) {
            _this._ttsCtx = newValue;
        });
        this.config.on([consts_1.PLUGIN_ID, consts_1.TTS_DEFAULT_OPTIONS_CONFIG], function (newValue) {
            _this._ttsDefaultOptions = newValue;
        });
    };
    PromptReader.prototype.setActive = function (newState) {
        if (typeof newState !== 'undefined' && this._ttsActive !== newState) {
            this._ttsActive = newState;
            // this._log('set tts active -> '+this._ttsActive);
        }
        return this._ttsActive;
    };
    PromptReader.prototype.cancel = function (options) {
        this.media.perform(this._ttsCtx, 'cancelSpeech');
        if (this._ttsActive) {
            this.stoppedPrompt(options);
        }
    };
    /**
     * semi-private HELPER: notify state-machine that prompt has stopped
     * @param options the reading options (NOTE if continuesReading is set, no stopped notification will be emitted)
     */
    PromptReader.prototype.stoppedPrompt = function (options) {
        if (!(options && options.continuesReading)) { //do not send status-updates, if there is a "next reading"
            this.setActive(false);
            this.dlg.raise('reading-stopped');
        }
    };
    PromptReader.prototype.setHandler = function (handler) {
        this.handler = handler;
    };
    PromptReader.prototype.readPrompt = function (text) {
        this.doRead(text);
    };
    PromptReader.prototype.doRead = function (text) {
        //do not start/queue, if TTS is active right now, but discard the read-request
        //NOTE if this should be changed (i.e. not discarded), then asrActive(boolean) need to be changed too!
        if (this._ttsActive) {
            if (!this._cancelOnNew) {
                this._log('doRead: did not synthesize, because TTS is active now, discarded TTS text');
                return; //////////////// EARLY EXIT /////////////
            }
            else {
                //cancel any ongoing TTS
                this.media.perform(this._ttsCtx, 'cancelSpeech');
            }
        }
        this.dlg.raise('reading-started');
        var self = this;
        var opt = {
            text: text,
            ready: function onPrepared() {
                if (self._isLog())
                    self._log('doRead: prepared TTS audio, starting to read now... ' + JSON.stringify(text));
            },
            success: function onFinished() {
                if (self._isLog())
                    self._log('doRead: finished reading ' + JSON.stringify(text));
                self.dlg.raise('reading-stopped');
            },
            error: function onError(err) {
                if (self._isLogError())
                    self._logError('doRead: error reading ' + JSON.stringify(text), err); //DEBUG
                self.dlg.raise('reading-stopped');
                self.dlg.emit('ttsError', { type: 'tts', error: err });
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
        if (this._ttsDefaultOptions) {
            var defOpt = Object.assign({}, this._ttsDefaultOptions, opt);
            Object.assign(opt, defOpt);
        }
        this.media.perform(this._ttsCtx, 'tts', [opt]);
    };
    //////////////// TODO create own logger for PromptReader?
    PromptReader.prototype._isLog = function () {
        return this.media._log.isd();
    };
    PromptReader.prototype._isLogError = function () {
        return this.media._log.ise();
    };
    PromptReader.prototype._log = function (msg) {
        if (this._isLog())
            this.media._log.debug(".PromptReader: " + msg);
    };
    PromptReader.prototype._logError = function (msg, err) {
        if (this._isLogError())
            this.media._log.error(".PromptReader: " + msg, err);
    };
    return PromptReader;
}());
exports.PromptReader = PromptReader;
//# sourceMappingURL=PromptReader.js.map