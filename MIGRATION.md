# Migration Guide


## Version `1.x.x` to `2.0.0`

### Changed Speech Event Names

Changed speech events/observables in `MmirService.speechEvents`:

```
showSpeechInputState -> speechInputState

showReadingStatus -> readingState

showDictationResult -> dictationResult

determineSpeechCmd -> speechCommand

execSpeechCmd -> commandAction
```

_(if `SubscriptionUtil.subscribe()` was used, in addition, the implementing
  method names on the corresponding classes need to changed accordingly)_

### Changed Type/Interface Names

```
ShowSpeechStateOptions -> SpeechInputStateOptions
ReadingShowOptions -> ReadingStateOptions
```

### Changed Field Names

```
SpeechInputStateOptions.state -> SpeechInputStateOptions.active // or before renaming of type: ShowSpeechStateOptions.state -> ShowSpeechStateOptions.active
```

### Changed Method Signatures

 * removed second parameter `event` in:
   ```
   EmmaUtil.setSpeechRecognition(emmaData: AnyEmma<CmdImpl>, event: any, data: RecognitionData, keepExistingFunction?: boolean): void
   ->
   EmmaUtil.setSpeechRecognition(emmaData: AnyEmma<CmdImpl>, data: RecognitionData, keepExistingFunction?: boolean): void
   ```
 * removed second parameter `event` in:
   ```
   EmmaUtil.setSpeechUnderstanding(emmaData: AnyEmma<CmdImpl>, event: any, data: UnderstandingData, keepExistingFunction?: boolean): void
   ->
   EmmaUtil.setSpeechUnderstanding(emmaData: AnyEmma<CmdImpl>, data: UnderstandingData, keepExistingFunction?: boolean): void
   ```

### Removed Methods

The following methods were removed without replacement
(were mostly only debub-implementations)

```
VoiceUiController.changeMicLevels(..)
VoiceUiController.evalSemantics(..)     // see example in README.md instead
SpeechInputController.speechCommand(..) // or before renaming of speech event: SpeechInputController.determineSpeechCmd(..)
SpeechInputController.commandAction(..) // or before renaming of speech event: SpeechInputController.execSpeechCmd(..)
```
