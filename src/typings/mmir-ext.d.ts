
import type { LogLevel , LogLevelNum } from 'mmir-lib';

export type ManagerFactory = () => StateManager;

export interface StateManager {//FIXME  when updating to mmir >= v6.2: remove/replace with typing from mmir-lib
  raise: (eventName: string, data?: any) => void;
  _init: (moduleId: string, config: StateManagerConfig, isRegisterEngine?: boolean) => Promise<{manager: StateManager, engine: any}>;
  _log: Logger;
}

export interface StateManagerConfig {//FIXME  when updating to mmir >= v6.2: remove/replace with typing from mmir-lib
  modelUri: string;
  mode?: 'simple' | 'extended';
  engineId?: string;
  logLevel?: number | string;
}

export interface Logger {//FIXME  when updating to mmir >= v6.2: remove/replace with typing from mmir-lib

	verbose(msg: string): void;
	verbose(className: string, msg?: string): void;
	verbose(className: string, funcName?: string, msg?: string): void;
	v(msg: string): void;
	v(className: string, msg?: string): void;
	v(className: string, funcName?: string, msg?: string): void;

	debug(msg: string): void;
	debug(className: string, msg?: string): void;
	debug(className: string, funcName?: string, msg?: string): void;
	d(msg: string): void;
	d(className: string, msg?: string): void;
	d(className: string, funcName?: string, msg?: string): void;

	log(msg: string): void;
	log(className: string, msg?: string): void;
	log(className: string, funcName?: string, msg?: string): void;
	l(msg: string): void;
	l(className: string, msg?: string): void;
	l(className: string, funcName?: string, msg?: string): void;

	info(msg: string): void;
	info(className: string, msg?: string): void;
	info(className: string, funcName?: string, msg?: string): void;
	i(msg: string): void;
	i(className: string, msg?: string): void;
	i(className: string, funcName?: string, msg?: string): void;

	warn(msg: string): void;
	warn(className: string, msg?: string): void;
	warn(className: string, funcName?: string, msg?: string): void;
	w(msg: string): void;
	w(className: string, msg?: string): void;
	w(className: string, funcName?: string, msg?: string): void;

	error(msg: string, error?: any): void;
	error(className: string, msg?: string, error?: any): void;
	error(className: string, funcName?: string, msg?: string, error?: any): void;
	e(msg: string, error?: any): void;
	e(className: string, msg?: string, error?: any): void;
	e(className: string, funcName?: string, msg?: string, error?: any): void;

	critical(msg: string, error?: any): void;
	critical(className: string, msg?: string, error?: any): void;
	critical(className: string, funcName?: string, msg?: string, error?: any): void;
	c(msg: string, error?: any): void;
	c(className: string, msg?: string, error?: any): void;
	c(className: string, funcName?: string, msg?: string, error?: any): void;

	getLevel(): LogLevelNum;
	setLevel(loggingLevel: LogLevel | LogLevelNum): void;

	isCritical(): boolean;
	isDebug(): boolean;
	isDisabled(): boolean;
	isError(): boolean;
	isInfo(): boolean;
	isVerbose(): boolean;
	isWarn(): boolean;
	isc(): boolean;
	isd(): boolean;
	ise(): boolean;
	isi(): boolean;
	isv(): boolean;
	isw(): boolean;
}
