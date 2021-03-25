import { ConfigurationManager, ConfigurationChangeListener } from 'mmir-lib';
export interface ConfigurationManager_NEW extends ConfigurationManager {
    get<T>(propertyName: string | string[], defaultValue?: T, booleanArgs?: boolean): T;
    set<T>(propertyName: string | string[], value: T): T;
    on(propertyName: string, listener: ConfigurationChangeListener, emitOnAdding?: boolean): void;
    on(propertyNamePath: string[], listener: ConfigurationChangeListener, emitOnAdding?: boolean): void;
    on(allChangesListener: ConfigurationChangeListener): void;
    addListener(propertyName: string, listener: ConfigurationChangeListener, emitOnAdding?: boolean): void;
    addListener(propertyNamePath: string[], listener: ConfigurationChangeListener, emitOnAdding?: boolean): void;
    addListener(allChangesListener: ConfigurationChangeListener): void;
}
/**
 * HELPER add backwards support for `ConfigurationManager.on(..., emitOnAdding?: boolean )`
 *        (i.e. trigger listener with current value when adding listener and `emitOnAdding` is true)
 */
export declare function makeConfigurationManagerCompat(config: ConfigurationManager_NEW | ConfigurationManager): ConfigurationManager_NEW;
