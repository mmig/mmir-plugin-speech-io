"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createInstance = createInstance;
exports.upgrade = upgrade;
exports.createSpeechioManager = createSpeechioManager;
exports.raiseInternal = raiseInternal;
var consts_1 = require("../consts");
var managerFactory;
var speechIoUri;
var speechIoInputUri;
function getGeneratedStateModelUrl(mmirLib, id) {
    //extract ID of state-model ~> "mmirf/state/<id>":
    var name = id.replace(/^.*\//, "");
    var path = mmirLib.res.getGeneratedStateModelsPath();
    return (path +
        mmirLib.util.listDir(path, function (entry) {
            //get entry that has same file name as the state-model ID, i.e. file name starts with the ID:
            return entry.indexOf(name) === 0;
        })[0]);
}
function init(mmirLib) {
    if (!managerFactory) {
        managerFactory = new Promise(function (resolve, reject) {
            mmirLib.require(['mmirf/managerFactory'], function (factory) { return resolve(factory); }, function (err) { return reject(err); });
        });
        if (typeof WEBPACK_BUILD !== "undefined" && WEBPACK_BUILD) {
            speechIoUri = consts_1.SPEECH_IO_STATES_ID;
            speechIoInputUri = consts_1.SPEECH_IO_INPUT_STATES_ID;
        }
        else {
            speechIoUri = getGeneratedStateModelUrl(mmirLib, consts_1.SPEECH_IO_STATES_ID);
            speechIoInputUri = getGeneratedStateModelUrl(mmirLib, consts_1.SPEECH_IO_INPUT_STATES_ID);
        }
    }
}
function createInstance(mmirLib) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            init(mmirLib);
            return [2 /*return*/, managerFactory.then(function (factory) { return factory(); })];
        });
    });
}
/**
 * HELPER: extend a state manager instance with an emit() method according to the EventManager interface
 *
 * @param  mng the state manager to upgrade (NOTE in-out parameter)
 * @return the upgraded state manager
 */
function upgrade(mng) {
    var speechMng = mng;
    speechMng.emit = function (actionName, data) {
        if (this._log.isd()) {
            var d = void 0;
            try {
                d = JSON.stringify(data);
            }
            catch (err) { }
            this._log.log('emit action for ' + actionName + ' ' + d);
        }
        var speechEmitter = this.eventEmitter[actionName];
        if (speechEmitter) {
            if (typeof data !== 'undefined') {
                speechEmitter.next(data);
            }
            else {
                speechEmitter.next();
            }
        }
        else if (this._log.isw()) {
            var d = void 0;
            if (data)
                try {
                    d = JSON.stringify(data);
                }
                catch (err) { }
            this._log.warn('could not emit UNKNWON action "' + actionName + '"' + (data ? ' with data ' : '') + d);
        }
    };
    return speechMng;
}
function createSpeechioManager(mmirLib, logLevel) {
    var mmir = mmirLib;
    return Promise.all([
        createInstance(mmirLib).then(function (stateManager) { return stateManager._init(consts_1.SPEECH_IO_MANAGER_ID, { modelUri: speechIoUri, engineId: consts_1.SPEECH_IO_ENGINE_ID, logLevel: logLevel }, true).then(function (res) {
            mmir.speechioManager = upgrade(res.manager);
            mmir.speechioEngine = res.engine;
            return res;
        }); }),
        createInstance(mmirLib).then(function (stateManager) { return stateManager._init(consts_1.SPEECH_IO_INPUT_ID, { modelUri: speechIoInputUri, engineId: consts_1.SPEECH_IO_INPUT_ENGINE_ID, logLevel: logLevel }, true).then(function (res) {
            mmir.speechioInput = res.manager;
            mmir.speechioInputEngine = res.engine;
            return res;
        }); }),
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
function raiseInternal(dlgEngine, eventName, eventData) {
    return dlgEngine.worker._engineGen.call(dlgEngine.worker._engineInstance, eventName, eventData);
}
//# sourceMappingURL=SpeechIoManager.js.map