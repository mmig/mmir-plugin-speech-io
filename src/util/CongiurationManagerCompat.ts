
import { ConfigurationManager, ConfigurationChangeListener } from 'mmir-lib';

export interface ConfigurationManager_NEW extends ConfigurationManager {

  get<T>(propertyName: string | string[], defaultValue?: T, booleanArgs?: boolean): T;
  set<T>(propertyName: string | string[], value: T): T;

  on(propertyName: string, listener: ConfigurationChangeListener, emitOnAdding?: boolean): void;
  on(propertyNamePath:  string[], listener: ConfigurationChangeListener, emitOnAdding?: boolean): void;
  on(allChangesListener: ConfigurationChangeListener): void;
  addListener(propertyName: string, listener: ConfigurationChangeListener, emitOnAdding?: boolean): void;
  addListener(propertyNamePath:  string[], listener: ConfigurationChangeListener, emitOnAdding?: boolean): void;
  addListener(allChangesListener: ConfigurationChangeListener): void;
}

/**
 * HELPER add backwards support for `ConfigurationManager.on(..., emitOnAdding?: boolean )`
 *        (i.e. trigger listener with current value when adding listener and `emitOnAdding` is true)
 */
export function makeConfigurationManagerCompat(config: ConfigurationManager_NEW | ConfigurationManager): ConfigurationManager_NEW {

  if(config.on.length === 2){

    const newConfig = config as ConfigurationManager_NEW  & {__on: Function, __addListener: Function};
    newConfig.__on = config.on;
    newConfig.on = function(propertyName: string | string[], listener: ConfigurationChangeListener, emitOnAdding?: boolean){

      this.__on(propertyName, listener);

      if(propertyName && typeof propertyName !== 'function' && emitOnAdding){

        // use empty string as "any change" event type:
        const path: string[] =typeof propertyName === 'string'? propertyName.split('.') : propertyName;
        listener(this.get(path), void(0), path.join('.'));
      }
    } as any;

    // do replace alias, too:
    newConfig.addListener = newConfig.on;

    return newConfig;
  }

  return config as ConfigurationManager_NEW;
}
