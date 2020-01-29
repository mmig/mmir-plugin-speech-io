export declare var IS_SOUND_FEEDBACK: boolean;
export declare var IS_HAPTIC_FEEDBACK: boolean;
export declare var CLICK_VIBRATE_DURATION: number;
export declare type FeedbackOption = {
    sound?: boolean;
    haptic?: boolean;
};
export declare function enableSoundFeedback(enable: boolean): void;
export declare function enableHapticFeedback(enable: boolean): void;
export declare function isSoundFeedbackEnabled(): any;
export declare function isHapticFeedbackEnabled(): any;
/**
 *
 * @param config (optional) cofiguration object with fields
 * 			config.audio BOOLEAN set if sound should be included in this feedback
 * 			config.haptic BOOLEAN set if vibration should be included in this feedback
 */
export declare function triggerClickFeedback(config?: FeedbackOption): void;
export declare function triggerHapticFeedback(): void;
export declare function triggerSoundFeedback(): void;
export declare function triggerErrorFeedback(): void;
export declare function triggerMulitpleVibrationFeedback(number: number): void;
