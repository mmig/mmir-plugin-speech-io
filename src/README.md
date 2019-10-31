# mmir-speechio-plugin


## Configuration

```typescript

interface SpeechIoPluginConfiguration extends RuntimeConfiguration {

  speechio: SpeechIoPluginConfigurationEntry & SpeechIoPluginConfigurationModeEntry & SpeechIoPluginConfigurationBaseEntry;

}

/**
 * specific configration values for active speech-mode ('dictation' or 'command'):
 * override general configuration values for the plugin
 */
interface SpeechIoPluginConfigurationModeEntry {
  dictation?: SpeechIoPluginConfigurationEntry;
  command?: SpeechIoPluginConfigurationEntry;
}

interface SpeechIoPluginConfigurationEntry {
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

interface SpeechIoPluginConfigurationBaseEntry {


  // //TODO impl. "auto-proceed" if speech-mode 'command' and 'guided-input' is active and entering a new view -> do start input for first "input-control" if auto-proceed is active
  // //     -> see transition initSpeechInputMode in dialog.xml
  // /**
  //  * if enabled:
  //  * if speech-mode 'command' and 'guided-input' is active and entering a new view -> do start input for first "input-control" if auto-proceed is active
  //  * @default false
  //  */
  // inputCtrlAutoProceed?: boolean;
}

```
