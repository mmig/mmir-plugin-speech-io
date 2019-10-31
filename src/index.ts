
export * from './typings/mmir-base-dialog.d';
export * from './typings/mmir-ext-dialog.d';
export * from './typings/speech-io-indicator.d';
export * from './typings/emma.d';
export * from './typings/app-settings.d';

export { MmirService } from './mmir-service';
export { VoiceUIService } from './voice-ui-service';
export { DictationTarget } from './io/SpeechDictation';
export { PromptReader } from './io/PromptReader';
export { EmmaUtil } from './util/EmmaUtil';
export { SubscriptionUtil } from './util/SubscriptionUtil';

export function initialize(cb: Function){ cb({});};//FIXME change mmir-plugin to allow other than media-plugins!!!
