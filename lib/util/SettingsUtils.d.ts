import { ConfigurationManager } from 'mmir-lib';
import { IAppSettings } from '../typings/';
export interface AppSettingsConfigImpl extends IAppSettings {
    _conf: ConfigurationManager;
}
export declare function createConfigSettingsImpl(mmirConf: ConfigurationManager): IAppSettings;
