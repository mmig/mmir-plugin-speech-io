import { MmirModule, DialogManager } from 'mmir-lib';
import { StateManager } from '../typings/';
import { ExtStateEngine, EventManager } from '../typings/';
export declare function createInstance(mmirLib: MmirModule): Promise<StateManager>;
/**
 * HELPER: extend a state manager instance with an emit() method according to the EventManager interface
 *
 * @param  mng the state manager to upgrade (NOTE in-out parameter)
 * @return the upgraded state manager
 */
export declare function upgrade<T extends EventManager>(mng: DialogManager): T;
export declare function createSpeechioManager(mmirLib: MmirModule, logLevel: string | number): Promise<any>;
/**
 * HELPER for using a state-machine's internal raise function:
 *        this allows to pass-in "behavioral objects", that is objects with functions etc.
 *        and not only "mere" data/JSON-like objects as with the normal raise-function
 *
 * @param  dlgEngine the DialogManager with WebWorker-engine, i.e. must have <code>dlgEngine.worker._engineGen</code>
 * @param  eventName the event-name to be raised
 * @param  eventData the event data
 * @return the engine configuration/state
 */
export declare function raiseInternal(dlgEngine: ExtStateEngine, eventName: string, eventData?: {
    [field: string]: any;
}): any;
