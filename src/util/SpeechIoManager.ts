import { Subject } from 'rxjs';
import { MmirModule, DialogManager } from 'mmir-lib';
import { StateManager, ManagerFactory } from '../typings/';
import { ExtMmirModule , SpeechIoManager , ExtStateEngine } from '../typings/';
import { SPEECH_IO_INPUT_STATES_ID , SPEECH_IO_INPUT_ID , SPEECH_IO_STATES_ID , SPEECH_IO_MANAGER_ID , SPEECH_IO_ENGINE_ID , SPEECH_IO_INPUT_ENGINE_ID } from '../consts';

declare var WEBPACK_BUILD: boolean;

var managerFactory: Promise<ManagerFactory>;
var speechIoUri: string;
var speechIoInputUri: string;

function getGeneratedStateModelUrl(mmirLib: MmirModule, id: string): string {
  //extract ID of state-model ~> "mmirf/state/<id>":
  const name = id.replace(/^.*\//, "");
  const path = (mmirLib.res as any).getGeneratedStateModelsPath();
  return (
    path +
    (mmirLib.util as any).listDir(path, (entry: string) => {
      //get entry that has same file name as the state-model ID, i.e. file name starts with the ID:
      return entry.indexOf(name) === 0;
    })[0]
  );
}

function init(mmirLib: MmirModule){
  if(!managerFactory){
    managerFactory = new Promise<ManagerFactory>((resolve, reject) => {
      mmirLib.require(['mmirf/managerFactory'], (factory: ManagerFactory) => resolve(factory), (err: Error) => reject(err));
    });
    if (typeof WEBPACK_BUILD !== "undefined" && WEBPACK_BUILD) {
      speechIoUri = SPEECH_IO_STATES_ID;
      speechIoInputUri = SPEECH_IO_INPUT_STATES_ID;
    } else {
      speechIoUri = getGeneratedStateModelUrl(mmirLib, SPEECH_IO_STATES_ID);
      speechIoInputUri = getGeneratedStateModelUrl(mmirLib, SPEECH_IO_INPUT_STATES_ID);
    }
  }
}

export async function createInstance(mmirLib: MmirModule): Promise<StateManager> {
  init(mmirLib);
  return managerFactory.then(factory => factory());
}

function upgrade(mng: DialogManager) : SpeechIoManager<any> {
  const speechMng = mng as SpeechIoManager<any>;
  speechMng.emit = function(this: SpeechIoManager<any>, actionName: string, data?: any) {

    if (this._isDebugVui) console.log('SpeechIOManager: emit action for '+actionName+' ', data);
    let speechEmitter: Subject<any> = this.eventEmitter[actionName];
    if(speechEmitter){
      if(typeof data !== 'undefined'){
        speechEmitter.next(data);
      } else {
        speechEmitter.next();
      }
    } else {
      console.warn('SpeechIOManager: could not emit UNKNWON action "'+actionName+'"'+(data? ' with data ' : ''), data);
    }
  };
  return speechMng;
}

export function createSpeechioManager(mmirLib: MmirModule, logLevel: string | number): Promise<any>{

  const mmir = mmirLib as MmirModule as ExtMmirModule<any>;

  return Promise.all([
    createInstance(mmirLib).then(stateManager => stateManager._init(SPEECH_IO_MANAGER_ID, {modelUri: speechIoUri, engineId: SPEECH_IO_ENGINE_ID, logLevel: logLevel}, true).then(res => {
      mmir.speechioManager = upgrade(res.manager);
      mmir.speechioEngine = res.engine;
      return res;
    })),
    createInstance(mmirLib).then(stateManager => stateManager._init(SPEECH_IO_INPUT_ID, {modelUri: speechIoInputUri, engineId: SPEECH_IO_INPUT_ENGINE_ID, logLevel: logLevel}, true).then(res => {
      mmir.speechioInput = res.manager;
      mmir.speechioInputEngine = res.engine;
      return res;
    })),
  ]);
}

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
export function raiseInternal(dlgEngine: ExtStateEngine, eventName: string, eventData?: {[field: string]: any}): any {
  return dlgEngine.worker._engineGen.call(dlgEngine.worker._engineInstance, eventName, eventData);
}
