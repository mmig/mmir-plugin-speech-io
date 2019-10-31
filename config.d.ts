
/* plugin config definition: used by mmir-plugin-exports to generate module-config.gen.js */

import { MediaManagerPluginEntry } from 'mmir-lib';

/**
 * (optional) entry "asrZeromqLocal" in main configuration.json
 * for settings of asrZeromqLocal module.
 *
 * Some of these settings can also be specified by using the options argument
 * in the ASR functions of {@link MediaManagerWebInput}, e.g.
 * {@link MediaManagerWebInput#recognize} or {@link MediaManagerWebInput#startRecord}
 * (if specified via the options, values will override configuration settings).
 */
export interface PluginConfig {
  speechio?: PluginConfigEntry;
}

export interface PluginConfigEntry {//extends MediaManagerPluginEntry {

  /**
  * the module/plugin name for the MediaManager plugins configuration
  * @default "mmir-plugin-speech-io"
  */
  mod: 'mmir-plugin-speech-io';

  // /**
  //  * the plugin type
  //  * @default "asr"
  //  */
  // type: 'asr';

  /**
   * the require path / URI to (native wrapper) module `./lib/index.js`
   *
   * NOTE by default this is set to the relative path (w.r.t. to the plugin main module)
   *      may need to be changed, if relative resolution is changed
   *
   * Common Values:
   * * package internal (relative): "./lib"
   * * package-relative (exernal): "mmir-plugin-speech-io"
   *
   * @default "./lib"
   * @see [[ModuleLocation]]
   */
  moduleLocation?: string | ModuleLocation;
}

export enum ModuleLocation {
  internal = './lib',
  external = 'mmir-plugin-speech-io'
}
