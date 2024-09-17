"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CLICK_VIBRATE_DURATION = exports.IS_HAPTIC_FEEDBACK = exports.IS_SOUND_FEEDBACK = void 0;
exports.enableSoundFeedback = enableSoundFeedback;
exports.enableHapticFeedback = enableHapticFeedback;
exports.isSoundFeedbackEnabled = isSoundFeedbackEnabled;
exports.isHapticFeedbackEnabled = isHapticFeedbackEnabled;
exports.triggerClickFeedback = triggerClickFeedback;
exports.triggerHapticFeedback = triggerHapticFeedback;
exports.triggerSoundFeedback = triggerSoundFeedback;
exports.triggerErrorFeedback = triggerErrorFeedback;
exports.triggerMulitpleVibrationFeedback = triggerMulitpleVibrationFeedback;
var consts_1 = require("../consts");
exports.IS_SOUND_FEEDBACK = true;
exports.IS_HAPTIC_FEEDBACK = true;
//default time-duration for click-feedback vibration
exports.CLICK_VIBRATE_DURATION = 100; //ms
function enableSoundFeedback(enable) {
    exports.IS_SOUND_FEEDBACK = enable;
}
function enableHapticFeedback(enable) {
    exports.IS_HAPTIC_FEEDBACK = enable;
}
function isSoundFeedbackEnabled() {
    var isSound = mmir.conf.get([consts_1.PLUGIN_ID, 'soundFeedbackEnabled']);
    if (typeof isSound === 'undefined') {
        isSound = exports.IS_SOUND_FEEDBACK;
    }
    return isSound;
}
function isHapticFeedbackEnabled() {
    var isHaptic = mmir.conf.get([consts_1.PLUGIN_ID, 'hapticFeedbackEnabled']);
    if (typeof isHaptic === 'undefined') {
        isHaptic = exports.IS_HAPTIC_FEEDBACK;
    }
    return isHaptic;
}
/**
 *
 * @param config (optional) cofiguration object with fields
 * 			config.audio BOOLEAN set if sound should be included in this feedback
 * 			config.haptic BOOLEAN set if vibration should be included in this feedback
 */
function triggerClickFeedback(config) {
    if (typeof mmir === 'undefined' || !mmir.notifier) {
        return;
    }
    var isSound = config && typeof config.sound !== 'undefined' ? config.sound : true;
    var isHaptic = config && typeof config.haptic !== 'undefined' ? config.haptic : true;
    //TODO haptic and sound feedback should be run in parallel, not sequential (... use 'threads'?)
    if (isHaptic && isHapticFeedbackEnabled()) {
        triggerHapticFeedback();
    }
    if (isSound && isSoundFeedbackEnabled()) {
        triggerSoundFeedback();
    }
}
function triggerHapticFeedback() {
    setTimeout(function () {
        mmir.notifier.vibrate(exports.CLICK_VIBRATE_DURATION);
    }, 0);
}
function triggerSoundFeedback() {
    //do not block function, return immediatly using setTimeout
    setTimeout(function () {
        mmir.notifier.beep(1);
    }, 0);
}
function triggerErrorFeedback() {
    triggerMulitpleVibrationFeedback(3);
}
function triggerMulitpleVibrationFeedback(number) {
    var doTriggerErrorVibrateFeedback = function () {
        setTimeout(function () {
            triggerClickFeedback();
            ++count;
            if (count < number) {
                doTriggerErrorVibrateFeedback();
            }
        }, 4 * exports.CLICK_VIBRATE_DURATION);
    };
    triggerClickFeedback();
    var count = 1;
    if (count < number) {
        doTriggerErrorVibrateFeedback();
    }
}
//# sourceMappingURL=HapticFeedback.js.map