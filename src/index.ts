
export * from './typings';

export { MmirService } from './mmir-service';
export { VoiceUIService } from './voice-ui-service';
export { DictationTarget } from './io/SpeechDictation';
export { PromptReader } from './io/PromptReader';
export { EmmaUtil } from './util/EmmaUtil';
export { SubscriptionUtil } from './util/SubscriptionUtil';
export { raiseInternal as raiseStateInternal, createInstance as createStateManager, upgrade as createEmitFunction } from './util/SpeechIoManager';
export { AppSettingsConfig , PersistentAppSettingsConfig } from './util/SettingsUtils';
