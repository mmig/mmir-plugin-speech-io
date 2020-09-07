"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromptReader = void 0;
var PromptReader = /** @class */ (function () {
    function PromptReader(dlg, media) {
        this.dlg = dlg;
        this.media = media;
        this._ttsActive = false;
        this.cancelOnNew = false;
    }
    Object.defineProperty(PromptReader.prototype, "active", {
        get: function () { return this._ttsActive; },
        enumerable: false,
        configurable: true
    });
    PromptReader.prototype.setActive = function (newState) {
        if (typeof newState !== 'undefined' && this._ttsActive !== newState) {
            this._ttsActive = newState;
            // this._log('set tts active -> '+this._ttsActive);
        }
        return this._ttsActive;
    };
    PromptReader.prototype.cancel = function (options) {
        this.media.perform(this.ttsCtx, 'cancelSpeech');
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
            if (!this.cancelOnNew) {
                this._log('doRead: did not synthesize, because TTS is active now, discarded TTS text');
                return; //////////////// EARLY EXIT /////////////
            }
            else {
                //cancel any ongoing TTS
                this.media.perform(this.ttsCtx, 'cancelSpeech');
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
        //NOTE any other value than undefined for opt.voice will enforce this setting:
        //     i.e. if opt.voice = null, the TTS will NOT fallback to the speech.json
        //     settings, but use the TTS-engine's default voice instead
        //     -> this check will enable the fallback in speech.json for ALL FALSY
        //        values, i.e. even for null/false/0
        if (this.voice) {
            if (typeof this.voice !== 'string') {
                if (this._isLog())
                    this._log('invalid value for voice (must be string): ' + this.voice);
            }
            else {
                opt.voice = this.voice;
            }
        }
        if (typeof this.pauseDuration !== 'undefined') {
            if (!isFinite(this.pauseDuration) || this.pauseDuration <= 0) {
                if (this._isLog())
                    this._log('invalid value for pauseDuration (must be greater than 0): ' + this.pauseDuration);
            }
            else {
                opt.pauseDuration = this.pauseDuration;
            }
        }
        this.media.perform(this.ttsCtx, 'tts', [opt]);
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