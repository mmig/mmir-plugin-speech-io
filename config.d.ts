
/* plugin config definition: used by mmir-plugin-exports to generate module-config.gen.js */

import { RuntimeConfiguration } from 'mmir-tooling';

/**
 * (optional) entry "speechio" in main configuration.json
 * for settings of speechio module.
 */
export interface PluginConfig {
  speechio?: PluginConfigEntry;
}

export interface PluginConfigEntry {//extends RuntimeConfigurationEntry {
  /**
   * the plugin type
   * @default "custom"
   */
  type: /*PluginType =*/ 'custom';
}


////////////////////////////// typings for plugin's configuration entry ////////////////////////

export interface SpeechIoPluginConfiguration extends RuntimeConfiguration {

  speechio: SpeechIoPluginConfigurationEntry & SpeechIoPluginConfigurationModeEntry & SpeechIoPluginConfigurationBaseEntry;

}

/**
 * specific configration values for active speech-mode ('dictation' or 'command'):
 * override general configuration values for the plugin
 */
export interface SpeechIoPluginConfigurationModeEntry {
  dictation?: SpeechIoPluginConfigurationEntry;
  command?: SpeechIoPluginConfigurationEntry;
  // guided?: SpeechIoPluginConfigurationEntry;
}

export interface SpeechIoPluginConfigurationEntry {
  /**
   * do disable stopping TTS output when starting ASR (microphone) input?
   *
   * (by default: do stop TTS before starting ASR/microphone input)
   *
   * @default false
   */
  disableCancelPrompt?: boolean;
  /**
   * number of (max.) alternative ASR results
   * @default 1
   */
  alternativeResults?: number;
  /**
   * speech mode / language model that should be used for ASR
   *
   * @default speechMode === 'dictation'? 'dictation' : 'search'
   */
  languageModel?: 'dictation' | 'search';
  /**
   * EOS (End Of Speech) detection pause:
   * require long pause (or only a short pause) to detect end-of-speech?
   *
   * @default false
   */
  longPause?: boolean;

  /**
   * disable improved ASR feedback (see documentation of {@link mmir.MediaManager.startRecord})
   *
   * (NOTE: will be ignored if not supported by active ASR engine)
   *
   * @default speechInputMode === 'command'
   */
  disableImprovedFeedback?: boolean;
}

export interface SpeechIoPluginConfigurationBaseEntry {

  /**
   * During active speech-input in 'dictation' mode:
   * if detected as single input/sentence, will stop speech-input for the input-control.
   *
   * NOTE can be set during runtime with:
   * <pre>
   * voiceUiService.ctrl.speechIn.setDictationCommand(dictStopWord, dictAbortWord);
   * </pre>
   * @default "anhalten"
   */
  dictStopWord?: string;

  /**
   *
   * During active speech-input in 'dictation' mode:
   * if detected as single input/sentence, will cancel speech-input for the
   * input-control and revert its text to its previous state (i.e. before dictation
   * was started for the input-control).
   *
   * NOTE can be set during runtime with:
   * <pre>
   * voiceUiService.ctrl.speechIn.setDictationCommand(dictStopWord, dictAbortWord);
   * </pre>
   *
   * @default ""
   */
  dictAbortWord?: string;

  /**
   * disable visual feedback for unstable dictation input in "pure text" input controls
   *
   * @default false
   */
  disableUnstableFeedback?: boolean;

  /**
   * enable/disable sound feedback for click/touch interactions
   *
   * @default true
   */
  soundFeedbackEnabled?: boolean;

  /**
   * enable/disable haptic feedback for click/touch interactions
   *
   * NOTE: haptic feedback (vibration) may not be supported for all execution
   *       environments/devices (will be ignored, if not supported)
   *
   * @default true
   */
  hapticFeedbackEnabled?: boolean;

  /**
   * print additional debug (console) output for speech I/O state-machine
   * @default false
   */
  showVuiDebugOutput?: boolean;

  /**
   * if enabled:
   * if speech-mode 'command' and 'guided-input' is active and entering a new view -> do start input for first "input-control" if auto-proceed is active
   *
   * NOTE 'guided-input' mode is not implemented yet TODO implement 'guided input' -> see transition initSpeechInputMode in dialog.xml
   *
   * @default false
   */
  inputCtrlAutoProceed?: boolean;
}
