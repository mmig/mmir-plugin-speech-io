import { Observable, Subject } from 'rxjs';
import type { ConfigurationManager, ConfigurationChangeListener } from 'mmir-lib';
import type { MmirService } from '../mmir-service';
import { IAppSettings } from '../typings/';
export declare class SettingsChange {
    readonly propertyName: string;
    readonly newValue: any;
    readonly oldValue: any;
    constructor(propertyName: string, newValue: any, oldValue: any);
}
/**
 * creates an IAppSettings wrapper for mmir.ConfigurationManager
 * @param  mmirConf the configuartion manager instance
 */
export declare class AppSettingsConfig implements IAppSettings {
    protected _conf: ConfigurationManager;
    protected conf: Promise<ConfigurationManager>;
    protected onChangeListener: ConfigurationChangeListener;
    protected onChangeSubject: Subject<SettingsChange>;
    constructor(configService: MmirService<any> | ConfigurationManager);
    protected init(configService: MmirService<any> | ConfigurationManager): void;
    get(key: string): Promise<any>;
    set(key: string, value: any): Promise<any>;
    remove(key: string): Promise<any>;
    onChange(): Observable<SettingsChange>;
    destroy(): void;
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
export declare class PersistentAppSettingsConfig extends AppSettingsConfig {
    constructor(configService: MmirService<any> | ConfigurationManager);
    get(key: string, preventJsonParsing?: boolean): Promise<any>;
    set(key: string, value: any, preventJsonConversion?: boolean): Promise<any>;
    remove(key: string): Promise<any>;
    protected _fromJSON(val: string): Promise<any>;
    protected _toJSON(val: any): Promise<string>;
}
