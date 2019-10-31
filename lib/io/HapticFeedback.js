"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IS_SOUND_FEEDBACK = true;
exports.IS_HAPTIC_FEEDBACK = true;
//default time-duration for click-feedback vibration
exports.CLICK_VIBRATE_DURATION = 100; //ms
function enableSoundFeedback(enable) {
    exports.IS_SOUND_FEEDBACK = enable;
}
exports.enableSoundFeedback = enableSoundFeedback;
function enableHapticFeedback(enable) {
    exports.IS_HAPTIC_FEEDBACK = enable;
}
exports.enableHapticFeedback = enableHapticFeedback;
function isSoundFeedbackEnabled() {
    var isSound = mmir.conf.get('soundFeedbackEnabled');
    if (typeof isSound === 'undefined') {
        isSound = exports.IS_SOUND_FEEDBACK;
    }
    return isSound;
}
exports.isSoundFeedbackEnabled = isSoundFeedbackEnabled;
function isHapticFeedbackEnabled() {
    var isHaptic = mmir.conf.get('hapticFeedbackEnabled');
    if (typeof isHaptic === 'undefined') {
        isHaptic = exports.IS_HAPTIC_FEEDBACK;
    }
    return isHaptic;
}
exports.isHapticFeedbackEnabled = isHapticFeedbackEnabled;
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
exports.triggerClickFeedback = triggerClickFeedback;
function triggerHapticFeedback() {
    setTimeout(function () {
        mmir.notifier.vibrate(exports.CLICK_VIBRATE_DURATION);
    }, 0);
}
exports.triggerHapticFeedback = triggerHapticFeedback;
function triggerSoundFeedback() {
    //do not block function, return immediatly using setTimeout
    setTimeout(function () {
        mmir.notifier.beep(1);
    }, 0);
}
exports.triggerSoundFeedback = triggerSoundFeedback;
function triggerErrorFeedback() {
    triggerMulitpleVibrationFeedback(3);
}
exports.triggerErrorFeedback = triggerErrorFeedback;
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
exports.triggerMulitpleVibrationFeedback = triggerMulitpleVibrationFeedback;
//# sourceMappingURL=HapticFeedback.js.map