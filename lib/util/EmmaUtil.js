"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmmaUtil = void 0;
var extend;
// var mmir: ExtMmirModule<any>;
/** @memberOf Emma# */
var defaultTactileInterpretation = {
    mode: "gui",
    medium: "tactile",
    confidence: 1.0,
    'function': 'gesture',
    value: {}
};
/** @memberOf Emma# */
var defaultSpeechInterpretation = {
    mode: "voice",
    medium: "acoustic",
    value: {}
};
/** @memberOf Emma# */
var EVENT_SUFFIXES = ['start', 'move', 'end', 'cancel'];
/** @memberOf Emma# */
var EVENT_SUFFIXES_HORIZONTAL = ['left', 'right'];
/** @memberOf Emma# */
var EVENT_SUFFIXES_VERTICAL = ['up', 'down'];
/** @memberOf Emma# */
var RE_TACTILE_SUB_TYPES = new RegExp('(' + EVENT_SUFFIXES.concat(EVENT_SUFFIXES_HORIZONTAL, EVENT_SUFFIXES_VERTICAL).join('|') + ')$', 'i');
/** @memberOf Emma# */
var DEFAULT_TACTILE_TYPES = {
    click: 'click',
    mouse: 'mouse',
    pan: 'pan',
    pinch: 'pitch',
    press: 'press',
    rotate: 'rotate',
    swipe: 'swipe',
    tap: 'tap',
    touch: 'touch'
};
/** @memberOf Emma# */
var DEFAULT_SPEECH_TYPE = 'speech';
// /** @memberOf Emma# */
// const SPEECH_RECOGNITION_RESULT_NAME = 'text';
/** @memberOf Emma# */
var SPEECH_UNDERSTANDING_RESULTS_NAME = 'nlu';
/** @memberOf Emma# */
var SPEECH_UNDERSTANDING_SEMANTICS_NAME = 'semantic'; // <- asr.semantic
/** @memberOf Emma# */
var SPEECH_UNDERSTANDING_PREPROCESSED_PHRASE_NAME = 'preproc'; // <- asr.phrase
/** @memberOf Emma# */
var SPEECH_UNDERSTANDING_SEMANTICS_PARTS_NAME = 'phrases'; // <- asr.phrases
//	/** @memberOf Emma# */
//	function nextId() {
//        var d = new Date().getTime();
//        var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
//            var r = (d + Math.random() * 16) % 16 | 0;
//            d = Math.floor(d / 16);
//            return (c == 'x' ? r : (r & 0x7 | 0x8)).toString(16);
//        });
//        return uuid;
//    }
/** @memberOf Emma# */
var _iGuid = new Date().getTime();
/** @memberOf Emma# */
function nextId() {
    return ++_iGuid; //NOTE this does not create a "global ID" but within this session/runtime it will be unique...
}
//INTERNAL typeguard: does not extensively check, if obj is an alternative RecognitionResult, but only if it "could" be a alternitve RecognitionResult
function _isAlternativeRecognitionResult(obj) {
    return obj && typeof obj === 'object';
}
/** @memberOf Emma# */
function isTactile(event, _data) {
    var evt = event;
    return DEFAULT_TACTILE_TYPES[evt.type] === evt.type || (evt.type && DEFAULT_TACTILE_TYPES[evt.type.replace(RE_TACTILE_SUB_TYPES, '')]);
}
/** @memberOf Emma# */
function isSpeech(event, _data) {
    //FIXME implement real detection?!?
    var evt = event;
    return evt.type === DEFAULT_SPEECH_TYPE ||
        (evt.interpretation && evt.interpretation.mode === 'voice');
}
////////////////////// HELPER functions for click/touch events //////////////////////////////////
/** @memberOf Emma# */
function getType(evt, _data) {
    return evt.originalEvent ? evt.originalEvent.type : evt.type;
}
/** @memberOf Emma# */
function setModality(emmaIntp, func, evt) {
    if (!emmaIntp.value) {
        emmaIntp.value = {};
    }
    if (!emmaIntp.value[func]) {
        emmaIntp.value[func] = {};
    }
    extend(emmaIntp.value[func], {
        type: getType(evt)
    });
}
/** @memberOf Emma# */
function setSource(emmaIntp, func, evt) {
    if (!emmaIntp.value) {
        emmaIntp.value = {};
    }
    if (!emmaIntp.value[func]) {
        emmaIntp.value[func] = {};
    }
    var src = evt.currentTarget || evt.target;
    if (!src) {
        return; ////////// EARLY EXIT ///////////////////////
    }
    var classesSet = {};
    src['className'].split(/\s+/gm).filter(function (value) {
        return !!value;
    }).forEach(function (value) {
        classesSet[value] = value;
    });
    var data = {};
    for (var n in src.dataset) {
        data[n] = src.dataset[n];
    }
    extend(emmaIntp.value[func], {
        reference: {
            type: src['tagName'],
            id: src['id'],
            name: src['name'],
            classes: classesSet,
            data: data
        }
    });
}
////////////////////// HELPER functions for speech events //////////////////////////////////
/** @memberOf Emma# */
function isRecognition(evt, data) {
    //FIXME should check the data argument!!!
    return !isUnderstanding(evt, data);
}
/** @memberOf Emma# */
function isUnderstanding(evt, data) {
    //FIXME should check the data argument!!!
    return _isGrammarUnderstanding(evt, data); //FIXME: add, when implementd: || _isUnderstanding(evt, data);
}
/** @memberOf Emma# */
function _isGrammarUnderstanding(_evt, data) {
    //FIXME should check the data argument!!!
    return typeof data.semantic !== 'undefined';
}
//FIXME impl. detection for "remote interpreter"
//	/** @memberOf Emma# */
//	function _isUnderstanding(evt, data){
//
//	}
/** @memberOf Emma# */
function setSpeechRecognition(emmaData, data, keepExistingFunction) {
    //		emma.interpretation.value.recognition = {
    //				confidence: 0.0,
    //				id: nextId(),
    //				//....
    //		}
    //extract data from speech-arguments (see callback-spec. for recognize/startRecord in MediaManager)
    var result = data[0], score = data[1], type = data[2], alternatives = data[3], unstable = data[4], custom = data[5];
    var asrList = [];
    addRecognition(asrList, result, score, type, unstable, custom);
    if (alternatives)
        for (var i = 0, size = alternatives.length; i < size; ++i) {
            addRecognition(asrList, alternatives[i]);
        }
    if (!emmaData['function'] || keepExistingFunction !== true) {
        emmaData['function'] = 'recognition';
    }
    emmaData.value['recognition'] = asrList;
}
/** @memberOf Emma# */
function addRecognition(emmaRecogList, result, score, resultType, unstablePart, custom) {
    //normalize arguments
    if (_isAlternativeRecognitionResult(result)) {
        //convert object argument
        score = result.score;
        result = result.result;
    }
    //create data object
    var data = {
        id: nextId(),
        text: result,
        confidence: score,
        type: resultType,
        unstable: unstablePart,
        custom: custom
    };
    // data[SPEECH_RECOGNITION_RESULT_NAME] = result;
    emmaRecogList.push(data);
}
/** @memberOf Emma# */
function setSpeechUnderstanding(emmaData, data, keepExistingFunction) {
    //		emma.interpretation.value.understanding = {
    //        id: nextId(),//number;		//INT "server-wide" ID
    //        start: number;	//INT UNIX timestamp (incl. milli-seconds)
    //        sourceId: number;		//INT interpretation-ID from the request (i.e. req.interpretation.id)
    //        nlu: event//or semantic? Array<CmdImpl>;
    //		}
    var semantics = {
        confidence: 1.0
    };
    semantics[SPEECH_UNDERSTANDING_SEMANTICS_NAME] = data.semantic;
    semantics[SPEECH_UNDERSTANDING_PREPROCESSED_PHRASE_NAME] = data.phrase;
    semantics[SPEECH_UNDERSTANDING_SEMANTICS_PARTS_NAME] = data.phrases;
    var understanding = {
        id: nextId(),
        // start: ,//TODO from recoginition emma
        // startId: //TODO from recoginition emma
    };
    understanding[SPEECH_UNDERSTANDING_RESULTS_NAME] = [semantics];
    if (!emmaData['function'] || keepExistingFunction !== true) {
        emmaData['function'] = 'understanding';
    }
    emmaData.value['understanding'] = understanding;
}
////////////////////// public / exported functions and properties  //////////////////////////////////
/**
 * @class
 *  @name Emma
 */
var EmmaUtil = /** @class */ (function () {
    function EmmaUtil() {
    }
    EmmaUtil.prototype.toEmma = function (event, data) {
        var emma;
        if (isTactile(event, data)) {
            emma = {
                interpretation: {
                    start: event.timeStamp || Date.now(),
                    id: nextId()
                }
            };
            extend(true, emma.interpretation, defaultTactileInterpretation);
            if (data) {
                this._setEmmaFuncData(emma, 'gesture', { data: data });
            }
            setModality(emma.interpretation, 'gesture', event);
            setSource(emma.interpretation, 'gesture', event);
        }
        if (isSpeech(event, data)) {
            if (event.interpretation) {
                //extend speech event data...
                emma = event;
                emma.interpretation.end = new Date().getTime();
            }
            else {
                //start new speech event data...
                emma = {
                    interpretation: {
                        start: new Date().getTime(), //really is not really the start-time ...
                        id: nextId()
                    },
                };
                extend(true, emma.interpretation, defaultSpeechInterpretation);
            }
            //HACK see emma.addTarget()
            //     (included here as a shortcut, so that no extra call to addTarget() is necessary)
            if (event.target) {
                //FIXME make this spec-compliant!!! (probably needs modality etc ... as interpretation???)
                emma.interpretation.target = event.target;
            }
            //HACK
            if (event.mode) {
                //FIXME make this spec-compliant!!! -> EMMA standard...
                emma.interpretation.speechMode = event.mode;
            }
            if (isRecognition(event, data)) {
                setSpeechRecognition(emma.interpretation, data);
            }
            else if (isUnderstanding(event, data)) {
                setSpeechUnderstanding(emma.interpretation, data);
            }
            else {
                console.error('unknown speech event: ', event, data);
            }
        }
        //console.info(emma);//FIXM DEBUG
        return emma;
    };
    // fire(rawEvent: MouseEvent | TouchEvent | Emma | RecognitionEmma | UnderstandingEmma<CmdImpl> | EventLike, data?: any): RecognitionEmma | UnderstandingEmma<CmdImpl> | TactileEmma {
    // 	var emmaEvt = this.toEmma(rawEvent, data);
    // 	mmir.speechioInput.raise('event', emmaEvt);
    // 	return emmaEvt;
    // }
    EmmaUtil.prototype.isTactileEvent = function (emmaData) {
        if (emmaData.interpretation.value && emmaData.interpretation.value.gesture)
            return true;
        return false;
    };
    EmmaUtil.prototype.isSpeechEvent = function (emmaData) {
        if (emmaData.interpretation.value && (emmaData.interpretation.value.recognition || emmaData.interpretation.value.understanding))
            return true;
        return false;
    };
    EmmaUtil.prototype.setSpeechRecognition = function (emmaData, data, keepExistingFunction) {
        setSpeechRecognition(emmaData.interpretation, data, keepExistingFunction);
    };
    EmmaUtil.prototype.setSpeechUnderstanding = function (emmaData, data, keepExistingFunction) {
        setSpeechUnderstanding(emmaData.interpretation, data, keepExistingFunction);
    };
    EmmaUtil.prototype.addTarget = function (emmaData, target, isOverwrite) {
        if (!emmaData || !emmaData.interpretation) {
            return emmaData;
        }
        //do not overwrite existing target-field (except if explicitly specified)
        if (!emmaData.interpretation.target || isOverwrite) {
            //FIXME make this spec-compliant!!! (probably needs modality etc ... as interpretation???)
            emmaData.interpretation.target = target;
        }
        //			emmaData.getTarget = function(){
        //				return this.target;
        //			};
        return emmaData;
    };
    EmmaUtil.prototype.addProperty = function (emmaData, name, value, isOverwrite) {
        if (!emmaData || !emmaData.interpretation) {
            return emmaData;
        }
        //do not overwrite existing target-field (except if explicitly specified)
        if (!emmaData.interpretation[name] || isOverwrite) {
            //FIXME make this spec-compliant!!! (probably needs modality etc ... as interpretation???)
            emmaData.interpretation[name] = value;
        }
        //			emmaData.getTarget = function(){
        //				return this.target;
        //			};
        return emmaData;
    };
    EmmaUtil.prototype.getTarget = function (emmaData) {
        if (emmaData && emmaData.interpretation) {
            return emmaData.interpretation.target;
        }
    };
    EmmaUtil.prototype.getProperty = function (emmaData, name) {
        if (emmaData && emmaData.interpretation) {
            return emmaData.interpretation[name];
        }
    };
    EmmaUtil.prototype._setEmmaFuncData = function (emmaEvent, funcName, funcData, mode) {
        if (!emmaEvent.interpretation) {
            emmaEvent.interpretation = {};
        }
        if (!emmaEvent.interpretation.value) {
            emmaEvent.interpretation.value = {};
        }
        if (!emmaEvent.interpretation.value[funcName]) {
            emmaEvent.interpretation.value[funcName] = {};
        }
        else if (mode === 'override') {
            return; ///////////////////////;
        }
        emmaEvent.interpretation['function'] = funcName;
        if (emmaEvent.interpretation.value[funcName]) {
            extend(emmaEvent.interpretation.value[funcName], funcData);
        }
        else {
            emmaEvent.interpretation.value[funcName] = funcData;
        }
    };
    EmmaUtil.prototype._extractAsrData = function (asrEmmaEvent) {
        var recog = this._extractAllAsrData(asrEmmaEvent);
        if (recog.length > 0) {
            return recog[0];
        }
        return {};
    };
    EmmaUtil.prototype._extractAllAsrData = function (asrEmmaEvent) {
        var recog;
        if (asrEmmaEvent && (recog = this._extractEmmaFuncData(asrEmmaEvent, 'recognition'))) {
            return recog;
        }
        return [];
    };
    EmmaUtil.prototype._extractEmmaFuncData = function (emmaEvent, func) {
        if (emmaEvent && emmaEvent.interpretation && emmaEvent.interpretation.value && emmaEvent.interpretation.value[func]) {
            return emmaEvent.interpretation.value[func];
        }
        return {};
    };
    EmmaUtil.prototype._nextId = function () {
        return nextId();
    };
    EmmaUtil.create = function (mmirCore, deepCloneFunc) {
        // mmir = mmirCore;
        extend = deepCloneFunc ? deepCloneFunc : mmirCore.require('mmirf/util/extendDeep');
        var emma = new EmmaUtil();
        return emma;
    };
    return EmmaUtil;
}());
exports.EmmaUtil = EmmaUtil;
//# sourceMappingURL=EmmaUtil.js.map