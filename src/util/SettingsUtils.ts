
import { Observable, Subject } from 'rxjs';
// import { Observable, Subject } from 'rxjs';

import type { ConfigurationManager, ConfigurationChangeListener } from 'mmir-lib';
import type { MmirService } from '../mmir-service';
import { IAppSettings } from '../typings/';

export class SettingsChange {
  constructor(
    public readonly propertyName: string,
    public readonly newValue: any,
    public readonly oldValue: any
  ){}
}

/**
 * creates an IAppSettings wrapper for mmir.ConfigurationManager
 * @param  mmirConf the configuartion manager instance
 */
export class AppSettingsConfig implements IAppSettings {

  protected _conf: ConfigurationManager;
  protected conf: Promise<ConfigurationManager>;
  protected onChangeListener: ConfigurationChangeListener;
  protected onChangeSubject: Subject<SettingsChange>;

  constructor(
    configService: MmirService<any> | ConfigurationManager,
  ) {
    this.init(configService);
  }

  protected init(configService: MmirService<any> | ConfigurationManager): void {

    this.onChangeSubject = new Subject<SettingsChange>();
    if((configService as MmirService<any>).mmir){
      this.conf = (configService as MmirService<any>).ready().then(mmirService => {
        this._conf = mmirService.mmir.conf;
        return this._conf;
      });
    } else {
      this.conf = Promise.resolve(configService as ConfigurationManager);
    }

    this.conf.then(() => {
      this.onChangeListener = (newValue: any, oldValue?: any, propertyPath?: string[]) => {
        this.onChangeSubject.next(new SettingsChange(propertyPath.join('.'), newValue, oldValue));
      };
      this._conf.on(this.onChangeListener);
    });
  }

  public async get(key: string): Promise<any> {
    return this.conf.then(c => c.get([key]));
  }

  public async set(key: string, value: any): Promise<any> {
    return this.conf.then(c => c.set([key], value));
  }

  public async remove(key: string): Promise<any> {
    return this.set(key, null);
  }

  public onChange(): Observable<SettingsChange> {
    return this.onChangeSubject.asObservable();
  }

  public destroy(): void {
    if(this.onChangeListener && this._conf){
      this._conf.off(this.onChangeListener);
      this.onChangeListener = null;
    }
    if(this.onChangeSubject){
      this.onChangeSubject.complete();
    }
  }
}

/**
 * creates an IAppSettings wrapper for `localStorage` with fallback for mmir.ConfigurationManager:
 * `get()` will first check `localStorage` and if there is no value, lookup the value in the
 * configuration manager.
 *
 * By default `get()` will parse retrieved values as JSON objects, and `set()`
 * will convert values to their JSON string representation.
 *
 * The other functions `set()` and `remove()` will directly access `localStorage`
 *
 * @param  mmirConf the configuartion manager instance
 */
export class PersistentAppSettingsConfig extends AppSettingsConfig {

  constructor(
    configService: MmirService<any> | ConfigurationManager,
  ) {
    super(configService);
  }

  public async get(key: string, preventJsonParsing?: boolean): Promise<any> {
    let val = localStorage.getItem(key);
    if(val !== null){
      return preventJsonParsing? Promise.resolve(val) : this._fromJSON(val);
    }
    return this.conf.then(c => preventJsonParsing? Promise.resolve(c.get([key])) : this._fromJSON(c.get([key])));
  }

  public async set(key: string, value: any, preventJsonConversion?: boolean): Promise<any> {
    let oldValue = localStorage.getItem(key);
    const promise = (preventJsonConversion? Promise.resolve(value) : this._toJSON(value)).then(json => localStorage.setItem(key, json));
    return promise.then(() => {
      if(oldValue && !preventJsonConversion){
        try { oldValue = JSON.parse(oldValue) } catch(_err){}
      }
      this.onChangeSubject.next(new SettingsChange(key, value, oldValue));
    });
  }

  public async remove(key: string): Promise<any> {
    let oldValue = localStorage.getItem(key);
    const promise = Promise.resolve(localStorage.removeItem(key));
    return promise.then(() => {
      this.onChangeSubject.next(new SettingsChange(key, void(0), oldValue));
    });
  }

  protected _fromJSON(val: string): Promise<any> {
    if(!val){
      return Promise.resolve(val);
    }
    return new Promise<any>((resolve, reject) => {
      try {
        resolve(JSON.parse(val));
      } catch(err){
        reject(err);
      }
    });
  }

  protected _toJSON(val: any): Promise<string> {
    if(!val){
      return Promise.resolve(val);
    }
    return new Promise<string>((resolve, reject) => {
      try {
        resolve(JSON.stringify(val));
      } catch(err){
        reject(err);
      }
    });
  }
}
