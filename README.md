# mmir-plugin-speech-io

Plugin for the MMIR framework that adds a state-machines for managing speech input/output states

__NOTE__ currently this plugin requires a [webpack][1] build process (see [mmir-webpack][2]).


## Configuration

for including plugin in mmir webpack build
```javascript
//...
const mmirAppConfig = {
  includePlugins: [
    {id: 'mmir-plugin-speech-io', config: {
      //optional configuration for the plugin:
      alternativeResults: 5,
      longPause: true,
      command: {
        languageModel: 'dictation',
        alternativeResults: 2
      }
    }}
  ],
  //...
};

const webpack = require('webpack');
module.exports = function(webpackConfig, _options){
  try{
    require('mmir-webpack')(webpack, webpackConfig, mmirAppConfig);
  } catch(err){
    console.log(err);
    throw err;
  }
  return webpackConfig;
}

```

Configuration values:
```typescript

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

  /**
   * enable/disable receiving interim ASR results depending on speech mode
   *
   * @default speechInputMode === 'dictation'
   */
  enableInterimResults?: boolean

  /**
   * specific configration values for active speech-mode ('dictation' or 'command'):
   * override general configuration values for the plugin (see configuration options above)
   */
  dictation?: {...};
  command?: {...};


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
   * if speech-mode 'command' and 'guided-input' is active and entering a new view
   * -> do start input for first "input-control" if auto-proceed is active
   *
   * NOTE 'guided-input' mode is not implemented yet
   *
   * @default false
   */
  inputCtrlAutoProceed?: boolean;
}

```


[1]: https://www.npmjs.com/package/webpack
[2]: https://www.npmjs.com/package/mmir-webpack
