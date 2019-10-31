
import { ConfigurationManager } from 'mmir-lib';
import { IAppSettings } from '../typings/app-settings.d';

export interface AppSettingsConfigImpl extends IAppSettings {
  _conf: ConfigurationManager;
}

export function createConfigSettingsImpl(mmirConf: ConfigurationManager): IAppSettings {
  return {
    _conf: mmirConf,
    get(this: AppSettingsConfigImpl, key: string): Promise<any> {
      return Promise.resolve(this._conf.get(key));
    },
    set(this: AppSettingsConfigImpl, key: string, value: any): Promise<any> {
      return Promise.resolve(this._conf.set(key, value));
    },
    remove(this: AppSettingsConfigImpl, key: string): Promise<any> {
      return this.set(key, null);
    }
  } as AppSettingsConfigImpl;
}
