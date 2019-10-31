
export type ManagerFactory = () => StateManager;

export interface StateManager {
  raise: (eventName: string, data?: any) => void;
  _init: (moduleId: string, config: StateManagerConfig, isRegisterEngine?: boolean) => Promise<{manager: StateManager, engine: any}>;
}

export interface StateManagerConfig {
  modelUri: string;
  mode?: 'simple' | 'extended';
  engineId?: string;
  logLevel?: number | string;
}
