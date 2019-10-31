
/* plugin config definition: used by mmir-plugin-exports to generate module-config.gen.js */

// import { PluginEntry } from 'mmir-lib';

/**
 * (optional) entry "speechio" in main configuration.json
 * for settings of speechio module.
 */
export interface PluginConfig {
  speechio?: PluginConfigEntry;
}

export interface PluginConfigEntry {//extends PluginEntry {

  /**
  * the module/plugin name for the MediaManager plugins configuration
  * @default "mmir-plugin-speech-io"
  */
  mod: 'mmir-plugin-speech-io';
}
