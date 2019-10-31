"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var SubscriptionUtil_1 = require("../util/SubscriptionUtil");
var SpeechOutputController = /** @class */ (function () {
    function SpeechOutputController(prompt, 
    // protected subsUtil: SubscriptionUtil,
    mmirProvider) {
        var _this = this;
        this.prompt = prompt;
        this._debugMsg = false;
        mmirProvider.ready().then(function (_mmirp) {
            // const mmir = _mmirp.mmir;
            _this._speechEventSubscriptions = SubscriptionUtil_1.SubscriptionUtil.subscribe(mmirProvider.speechEvents, ['read'], _this);
        });
    }
    Object.defineProperty(SpeechOutputController.prototype, "debug", {
        get: function () { return this._debugMsg; },
        set: function (value) {
            this._debugMsg = value;
        },
        enumerable: true,
        configurable: true
    });
    SpeechOutputController.prototype.destroy = function () {
        SubscriptionUtil_1.SubscriptionUtil.unsubscribe(this._speechEventSubscriptions);
    };
    ////////////////////////////////////////// Speech Output Event Handlers ///////////////////////
    /**
     * Called when text should should be read.
     *
     * When reading starts, the function must trigger the "reading-started" event:
     *
     * <pre>
     * mmir.speechioManager.raise('reading-started')
     * </pre>
     *
     * After reading the text (or an error occured, preventing to read the text),
     * the function must trigger the "reading-stopped" event:
     *
     * <pre>
     * mmir.speechioManager.raise('reading-stopped')
     * </pre>
     *
     *
     * @param  {string|ReadingOptions} data the data for determining the text the should be read
     *                                      (if string: corresponds to the ReadingOptions.dialogId)
     *
     * @returns {void|boolean} if data.test === true, the function return TRUE, if the
     *                            reading-request is valid (e.g. if reading is context-sensitive)
     */
    SpeechOutputController.prototype.read = function (data) {
        if (this._debugMsg) {
            console.log('read -> ', data);
            if (!this.prompt.handler) {
                console.warn('SpeechOutputController.read(): no IPromptHandler set!');
            }
        }
        var isConsumed = false;
        var isTest = false;
        var promptText;
        if (typeof data !== 'string') {
            isTest = data.test;
            if (!this.prompt.handler || this.prompt.handler.willReadPrompt(data.contextId, data.readingId)) {
                if (isTest) {
                    return true; /////////////////// EARYL EXIT ///////////////////
                }
                if (this.prompt.handler) {
                    promptText = this.prompt.handler.preparePrompt(data);
                }
                else {
                    promptText = this.getText(data);
                }
                isConsumed = !!((Array.isArray(promptText) && promptText.length > 0) || promptText);
            }
        }
        else {
            promptText = data;
            isConsumed = !!((Array.isArray(promptText) && promptText.length > 0) || promptText);
        }
        if (isConsumed && !isTest) {
            this.prompt.readPrompt(promptText);
        }
        if (!isConsumed && !isTest) {
            console.error('read: unknown read target ', data);
            var readData = data && typeof data === 'object' ? Object.assign({ active: false, contextId: '' }, data) : { active: false, contextId: '' };
            this.prompt.stoppedPrompt(readData);
        }
        return false;
    };
    SpeechOutputController.prototype.getText = function (data) {
        if (data && data.readingData) {
            return data.readingData.promptText;
        }
        return null;
    };
    return SpeechOutputController;
}());
exports.SpeechOutputController = SpeechOutputController;
//# sourceMappingURL=SpeechOutputController.js.map