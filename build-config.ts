
/**
 * build configuration for the plugin:
 * exported AppConfig variables will be included in generated module-config.gen.js
 */

import { AppConfig } from 'mmir-tooling';

declare var __dirname: string;

/**
 * state model for mmirf/speechioManager
 */
export const buildConfigSpeechManager: AppConfig = {
  states: {
    models: {
      speechio: {
        moduleId: 'mmirf/speechioManager',
        mode: 'extended',
        file: __dirname + '/src/states/dialog.xml'
      }
    }
  }
};

/**
 * state model for mmif/speechioInput
 */
export const buildConfigSpeechInput: AppConfig = {
  states: {
    models: {
      speechioInput: {
        moduleId: 'mmirf/speechioInput',
        mode: 'extended',
        file: __dirname + '/src/states/input.xml'
      }
    }
  }
};
