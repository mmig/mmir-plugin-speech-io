# [mmir-plugin-speech-io][0]

[![MIT license](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![GitHub package.json version](https://img.shields.io/github/package-json/v/mmig/mmir-plugin-speech-io/master)](https://github.com/mmig/mmir-plugin-speech-io)
[![npm](https://img.shields.io/npm/v/mmir-plugin-speech-io)](https://www.npmjs.com/package/mmir-plugin-speech-io)

Plugin for the [MMIR framework][3] that adds state-machines for managing speech input/output states

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
   * Flag that indicates if end-of-speech (EOS) detection will be used
   * for speech recognition.
   *
   * If enabled, the recognition will be stopped after EOS was detected
   * (e.g. upon a pause after dictating a sentence).
   *
   * @default false
   */
  eos?: boolean;

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
   * The canceling will only be applied, if it matches the whole input/sentence, i.e.:
   * <pre>
   * isStopCommand("some sentence <stop word>") -> false
   * isStopCommand(" <stop word> ") -> true
   * </pre>
   *
   * Can be either set with a string, or an object/dictionary that maps a
   * language ID to to the stop-command.
   * <pre>
   * var stopCmd = {
   *   de: 'anhalten',
   *   en: 'stop'
   * }
   * </pre>
   *
   * NOTE can be set during runtime with:
   * <pre>
   * voiceUiService.ctrl.speechIn.setDictationCommand(dictStopWord, dictAbortWord);
   * </pre>
   * @default ""
   */
  dictStopWord?: string | {[languageId: string]: string};

  /**
   * Will only work, if `dictStopWord` is also set!
   *
   * During active speech-input in 'dictation' mode:
   * if detected as single input/sentence, will abort speech-input for the
   * input-control and revert its text to its previous state (i.e. before dictation
   * was started for the input-control).
   *
   * The aborting will only be applied, if it matches the whole input/sentence, i.e.:
   * <pre>
   * isAbortCommand("some sentence <abort word>") -> false
   * isAbortCommand(" <abort word> ") -> true
   * </pre>
   *
   * Can be either set with a string, or an object/dictionary that maps a
   * language ID to to the abort-command.
   * <pre>
   * var abortCmd = {
   *   de: 'rückgängig',
   *   en: 'undo'
   * }
   * </pre>
   *
   * NOTE can be set during runtime with:
   * <pre>
   * voiceUiService.ctrl.speechIn.setDictationCommand(dictStopWord, dictAbortWord);
   * </pre>
   *
   * NOTE IMPORTANT:
   * currently this feature requires, that the original text, that will be reverted
   * to, is set manually to the text-element's `dataset` to key `original-text`
   * (e.g. when starting dictation)!
   *
   * @default ""
   */
  dictAbortWord?: string | {[languageId: string]: string};

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

  /**
   * if enabled:
   * the `mmir-service` will not raise an 'init' event upon intialization on the `mmir.dialog` instance.
   *
   * Otherwise, the `mmir-service` will raise an 'init' event with event data:
   * ```
   * {
   *  appConfig: IAppSettings,
   *  mmir: ExtMmirModule<CmdImpl>,
   *  emma: EmmaUtil<CmdImpl>
   * }
   * ```
   * This event and its data can be used in the `dialog.xml` state definition's inital state by
   * defining a transition for the event `init` (see example).
   *
   * @default false
   * @example
   * <scxml xmlns="http://www.w3.org/2005/07/scxml" version="1.0"
   *        profile="ecmascript" id="scxmlRoot" initial="AppStart">
   * <state id="AppStart">
   *   <!-- transition for init-event, which in this example will trigger state-change to "MainApp" -->
   *   <transition event="init" target="MainApp">
   *    <script>
   *      // get event data contents:
   *      var appConfig = _event.data.appConfig;
   *      var mmir = _event.data.mmir;
   *      var emmaUtil = _event.data.emma;
   *      //... use them somehow (e.g. could be stored in data model variable)
   */
  preventDialogManagerInit?: boolean;

  /**
   * if a prompt is active (i.e. TTS is playing), when a new one is requested:
   * cancel the current/active one (and read the new one)?
   *
   * If `false`, the the new prompt may be discarded, or cancel/replace the active one,
   * depending on the `ReadOptions` of the new prompt.
   *
   * @default true
   */
  cancelOnNewPrompt?: boolean;
}

```

## Example Usage


### `speechCommand`

`speechCommand` will be triggered, if speech-input is in `command` mode, and an (stable) ASR result becomes available

 1. register for `speechCommand`
    ```typescript
    ...
    vuiCtrl.ctrl.enterView(mmirService.speechEvents.speechCommand.subscribe(result => this.evalSemantics(result)));
    ```

 2. parse ASR result in `speechCommand`, and create appropriate interpretation, and trigger `commandAction`
    ```typescript
    public evalSemantics(emma: RecognitionEmma){

      const asrResult = this.mmir.emma._extractAsrData(emma);
      const text = asrResult.text;

      this.mmir.semantic.interpret(text, null, result => {

        let semantic: any;
        if(result.semantic != null) {
          semantic = result.semantic;
          semantic.phrase = text;
          if(this._debugMsg) console.log("semantic : " + result.semantic);//DEBUG
        }
        else {

          //create "no-match" semantic-object:
          semantic = {
            "NoMatch": {
              "phrase": text
            }
          };
        }

        this.mmir.emma.setSpeechUnderstanding(emma, semantic);

        // will trigger/emit commandAction:
        this.mmir.speechioInput.raise("speech",  semantic);

      });

    }
    ```

[0]: https://github.com/mmig/mmir-plugin-speech-io
[1]: https://www.npmjs.com/package/webpack
[2]: https://www.npmjs.com/package/mmir-webpack
[3]: https://github.com/mmig/mmir
