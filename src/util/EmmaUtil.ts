
import { Emma , RecognitionEmma , UnderstandingEmma , TactileEmma, SpeechRecognitionResult , Cmd , Interpretation } from '../typings/mmir-base-dialog.d';
import { EventLike , AnyEmma , RecognitionData , UnderstandingData , EmmaFunctionType } from '../typings/emma.d';
import { ExtMmirModule } from '../typings/mmir-ext-dialog.d';


  var extend: Function;
  // var mmir: ExtMmirModule<any>;

	/** @memberOf Emma# */
	var defaultTactileInterpretation = {
			mode: "gui",
			medium: "tactile",
			confidence: 1.0,
			gesture: {}
	};
	/** @memberOf Emma# */
	var defaultSpeechInterpretation = {
			mode: "voice",
			medium: "acoustic",
			'function': {}
	};

	/** @memberOf Emma# */
	var EVENT_SUFFIXES = ['start', 'move', 'end', 'cancel'];
	/** @memberOf Emma# */
	var EVENT_SUFFIXES_HORIZONTAL = ['left', 'right'];
	/** @memberOf Emma# */
	var EVENT_SUFFIXES_VERTICAL = ['up', 'down'];
	/** @memberOf Emma# */
	var RE_TACTILE_SUB_TYPES = new RegExp('('+EVENT_SUFFIXES.concat(EVENT_SUFFIXES_HORIZONTAL, EVENT_SUFFIXES_VERTICAL).join('|')+')$', 'i');

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
	/** @memberOf Emma# */
	var SPEECH_RECOGNITION_RESULT_NAME = 'text';
	/** @memberOf Emma# */
	var SPEECH_UNDERSTANDING_RESULTS_NAME = 'nlu';
	/** @memberOf Emma# */
	var SPEECH_UNDERSTANDING_SEMANTICS_NAME = 'semantic';// <- asr.semantic
	/** @memberOf Emma# */
	var SPEECH_UNDERSTANDING_PREPROCESSED_PHRASE_NAME = 'preproc'; // <- asr.phrase
	/** @memberOf Emma# */
	var SPEECH_UNDERSTANDING_SEMANTICS_PARTS_NAME = 'phrases';// <- asr.phrases

//	/** @memberOf Emma# */
//	function guid() {
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
	function guid(){
		return ++_iGuid;//FIXME this is not really "global" but within this session it will be unique...
	}

	/** @memberOf Emma# */
	function isTactile<CmdImpl extends Cmd>(event: MouseEvent | TouchEvent | Emma | RecognitionEmma | UnderstandingEmma<CmdImpl> | EventLike, _data: any): event is TactileEmma {
    const evt: EventLike = event as EventLike;
		return DEFAULT_TACTILE_TYPES[evt.type] === evt.type || (evt.type && DEFAULT_TACTILE_TYPES[evt.type.replace(RE_TACTILE_SUB_TYPES, '')]);
	}

	/** @memberOf Emma# */
	function isSpeech<CmdImpl extends Cmd>(event: MouseEvent | TouchEvent | Emma | RecognitionEmma | UnderstandingEmma<CmdImpl> | EventLike, _data: any): event is RecognitionEmma {
		//FIXME implement real detection?!?
    const evt: EventLike = event as EventLike;
		return evt.type === DEFAULT_SPEECH_TYPE ||
				(evt.interpretation && evt.interpretation.mode === 'voice');
	}

	////////////////////// HELPER functions for click/touch events //////////////////////////////////

	/** @memberOf Emma# */
	function getType(evt, _data?: any): string {
		return evt.originalEvent? evt.originalEvent.type : evt.type;
	}

	/** @memberOf Emma# */
	function setModality(emmaIntp, modality, evt){

		if( ! emmaIntp[modality]){
			emmaIntp[modality] = {};
		}

		extend(emmaIntp[modality], {
			type: getType(evt)
		});
	}

	/** @memberOf Emma# */
	function setSource(emmaIntp, modality, evt){

		if( ! emmaIntp[modality]){
			emmaIntp[modality] = {};
		}

		var src = evt.currentTarget || evt.target;
		if(!src){
			return;////////// EARLY EXIT ///////////////////////
		}

		var classesSet = {
			keys: src['className'].split(/\s+/gm).filter(function(value){
				if(value) return true;
				return false;
			})
		};
		classesSet.keys.forEach(function(value){
			classesSet[value] = true;
		});

		var data = {};
		for(var n in src.dataset){
			data[n] = src.dataset[n];
		}

		extend(emmaIntp[modality], {
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
	function isRecognition(evt, data){
		//FIXME should check the data argument!!!
		return ! isUnderstanding(evt, data);
	}

	/** @memberOf Emma# */
	function isUnderstanding(evt, data){
		//FIXME should check the data argument!!!
		return _isGrammarUnderstanding(evt,data);//FIXME: add, when implementd: || _isUnderstanding(evt, data);
	}

	/** @memberOf Emma# */
	function _isGrammarUnderstanding(_evt: any, data: any){
		//FIXME should check the data argument!!!
		return typeof data.semantic !== 'undefined';
	}

	//FIXME impl. detection for "remote interpreter"
//	/** @memberOf Emma# */
//	function _isUnderstanding(evt, data){
//
//	}

	/** @memberOf Emma# */
	function setSpeechRecognition(emmaData: Interpretation, _event: any, data: RecognitionData): void {

//		emma.interpretation['function'].recognition = {
//				confidence: 0.0,
//				id: guid(),
//				//....
//		}

		//extract data from speech-arguments (see callback-spec. for recognize/startRecord in MediaManager)
		var result = data[0],
			score = data[1],
			type = data[2],
			alternatives = data[3],
			unstable = data[4];

		var asrList = [];
		addRecognition(asrList, result, score, type, unstable);

		if(alternatives) for(var i=0,size=alternatives.length; i < size; ++i){
			addRecognition(asrList, alternatives[i]);
		}

		emmaData['function']['recognition'] = asrList;
	}

	/** @memberOf Emma# */
	function addRecognition(emmaRecogList, result, score?, resultType?, unstablePart?){

		//normalize arguments
		if(typeof result === 'object' && result !== null){
			//convert object argument
			score = result.score;
			result = result.result;
		}

		//create data object
		var data = {
				id: guid(),
				confidence: score,
				unstable: unstablePart,
				type: resultType
		};
		data[SPEECH_RECOGNITION_RESULT_NAME] = result;

		emmaRecogList.push(data);
	}

	/** @memberOf Emma# */
	function setSpeechUnderstanding(emmaData: Interpretation, _event: any, data: UnderstandingData): void {

//		emma.interpretation['function'].understanding = {
//        id: guid(),//number;		//INT "server-wide" ID
//        start: number;	//INT UNIX timestamp (incl. milli-seconds)
//        sourceId: number;		//INT interpretation-ID from the request (i.e. req.interpretation.id)
//        nlu: event//or semantic? Array<CmdImpl>;
//		}

    var semantics = {
				confidence: 1.0
    };
    semantics[SPEECH_UNDERSTANDING_SEMANTICS_NAME] 				= data.semantic;
    semantics[SPEECH_UNDERSTANDING_PREPROCESSED_PHRASE_NAME]	= data.phrase;
    semantics[SPEECH_UNDERSTANDING_SEMANTICS_PARTS_NAME]		= data.phrases;

		var understanding = {
				id: guid(),
        // start: ,//TODO from recoginition emma
        // startId: //TODO from recoginition emma
		};
		understanding[SPEECH_UNDERSTANDING_RESULTS_NAME] 				= [semantics];

		emmaData['function']['understanding'] = understanding;
	}


	////////////////////// public / exported functions and properties  //////////////////////////////////
	/**
	 * @class
	 *  @name Emma
	 */
	export class EmmaUtil<CmdImpl extends Cmd> {

		/** @memberOf Emma.prototype */
		toEmma(event: MouseEvent | TouchEvent | Emma | RecognitionEmma | UnderstandingEmma<CmdImpl> | EventLike, data?: any): RecognitionEmma | UnderstandingEmma<CmdImpl> | TactileEmma {

			var emma;

			if(isTactile<CmdImpl>(event, data)){

				emma = {};
				emma.interpretation = {
						start: (event as unknown as MouseEvent).timeStamp
	//					, end: event.timeStamp
						, id: guid()
				};

				extend(true, emma.interpretation, defaultTactileInterpretation);

				setModality(emma.interpretation, 'gesture', event);
				setSource(emma.interpretation, 'gesture', event);

//		        emma.interpretation.action = {};
//
//		        emma.interpretation.action.name = args[1].event.target.name;
//
//		        emma.interpretation.action.data = args[1].data;
//
//		        // @chsc03 FIXME div element cannot be converted to JSON due to circular reference
//
//		        emma.interpretation.action.source = new XMLSerializer().serializeToString(args[1].source);
			}

			if(isSpeech(event, data)){


				if(event.interpretation){
					//extend speech event data...
					emma = event;
					emma.interpretation.end = new Date().getTime();
				}
				else {
					//start new speech event data...
					emma = {};
					emma.interpretation = {
							start: new Date().getTime()//really is not really the start-time ...
//							, end: event.timeStamp
							, id: guid()
					};
					extend(true, emma.interpretation, defaultSpeechInterpretation);
				}

				//HACK see emma.addTarget()
				//     (included here as a shortcut, so that no extra call to addTarget() is necessary)
				if((event as unknown as MouseEvent).target){
					//FIXME make this spec-compliant!!! (probably needs modality etc ... as interpretation???)
					emma.interpretation.target = (event as unknown as MouseEvent).target;
				}

				//HACK
				if((event as any).mode){
					//FIXME make this spec-compliant!!! -> EMMA standard...
					emma.interpretation.speechMode = (event as any).mode;
				}


				if(isRecognition(event, data)){

					setSpeechRecognition(emma.interpretation, event, data);

				}
				else if(isUnderstanding(event, data)){

					setSpeechUnderstanding(emma.interpretation, event, data);

				}
				else {
					console.error('unknown speech event: ', event, data);
				}
			}

			//console.info(emma);//FIXM DEBUG

			return emma;
		}

		// fire(rawEvent: MouseEvent | TouchEvent | Emma | RecognitionEmma | UnderstandingEmma<CmdImpl> | EventLike, data?: any): RecognitionEmma | UnderstandingEmma<CmdImpl> | TactileEmma {
		// 	var emmaEvt = this.toEmma(rawEvent, data);
		// 	mmir.speechioInput.raise('event', emmaEvt);
		// 	return emmaEvt;
		// }

		isTactileEvent(emmaData: AnyEmma<CmdImpl>) : boolean {
			if( (emmaData as TactileEmma as any).interpretation.gesture ) return true;
			return false;
		}

		isSpeechEvent(emmaData: AnyEmma<CmdImpl>) : boolean {
			if( emmaData.interpretation['function'] ) return true;
			return false;
		}

		setSpeechRecognition(emmaData: AnyEmma<CmdImpl>, event: any, data: RecognitionData): void {
			setSpeechRecognition(emmaData.interpretation, event, data);
		}

		setSpeechUnderstanding(emmaData: AnyEmma<CmdImpl>, event: any, data: UnderstandingData): void {
			setSpeechUnderstanding(emmaData.interpretation, event, data);
		}

		addTarget(emmaData: AnyEmma<CmdImpl>, target: any, isOverwrite?: boolean): AnyEmma<CmdImpl> {
			if(! emmaData || !emmaData.interpretation){
				return emmaData;
			}

			//do not overwrite existing target-field (except if explicitly specified)
			if(!emmaData.interpretation.target || isOverwrite){

				//FIXME make this spec-compliant!!! (probably needs modality etc ... as interpretation???)
				emmaData.interpretation.target = target;
			}

//			emmaData.getTarget = function(){
//				return this.target;
//			};

			return emmaData;
		}

    addProperty(emmaData: AnyEmma<CmdImpl>, name: string, value: any, isOverwrite?: boolean): AnyEmma<CmdImpl> {//}(emmaData, name, value, isOverwrite){

			if(! emmaData || !emmaData.interpretation){
				return emmaData;
			}

			//do not overwrite existing target-field (except if explicitly specified)
			if(!emmaData.interpretation[name] || isOverwrite){

				//FIXME make this spec-compliant!!! (probably needs modality etc ... as interpretation???)
				emmaData.interpretation[name] = value;
			}

//			emmaData.getTarget = function(){
//				return this.target;
//			};

			return emmaData;
		}

		getTarget(emmaData: AnyEmma<CmdImpl>): any {
			if(emmaData && emmaData.interpretation){
				return emmaData.interpretation.target;
			}
		}

		getProperty(emmaData: AnyEmma<CmdImpl>, name: string): any {
			if(emmaData && emmaData.interpretation){
				return emmaData.interpretation[name];
			}
		}

		_setEmmaFuncData(emmaEvent: AnyEmma<CmdImpl>, funcName: EmmaFunctionType, funcData: any, isOverwrite?: boolean): void {
			if(!emmaEvent.interpretation){
				emmaEvent.interpretation = {} as Interpretation;
			}
			if(!emmaEvent.interpretation['function']){
				emmaEvent.interpretation['function'] = {};
			}
			if(!emmaEvent.interpretation['function'][funcName]){
				emmaEvent.interpretation['function'][funcName] = {};
			} else if(!isOverwrite){
				return;///////////////////////;
			}
			emmaEvent.interpretation['function'][funcName] = funcData;
		}

    _extractAsrData(asrEmmaEvent: AnyEmma<CmdImpl>): SpeechRecognitionResult {
			var recog = this._extractAllAsrData(asrEmmaEvent);
			if(recog.length > 0){
				return recog[0];
			}
			return {} as SpeechRecognitionResult;
		}

    _extractAllAsrData(asrEmmaEvent: AnyEmma<CmdImpl>): SpeechRecognitionResult[] {
			var recog;
			if(asrEmmaEvent && (recog = this._extractEmmaFuncData(asrEmmaEvent, 'recognition'))){
				return recog;
			}
			return [];
		}

    _extractEmmaFuncData(emmaEvent: AnyEmma<CmdImpl>, func: EmmaFunctionType): any {//}(emmaEvent, func){//func: 'recognition' | 'understanding'
			if(emmaEvent && emmaEvent.interpretation && emmaEvent.interpretation['function'] && emmaEvent.interpretation['function'][func]){
				return emmaEvent.interpretation['function'][func];
			}
			return {};
		}

    static create<CmdImpl extends Cmd>(mmirCore: ExtMmirModule<CmdImpl>, deepCloneFunc?: Function): EmmaUtil<CmdImpl> {//WORKAROUND for "converting" mmir/requirejs impl. to node module-like
      // mmir = mmirCore;
      extend = deepCloneFunc? deepCloneFunc : mmirCore.require('mmirf/util/extendDeep');
      const emma = new EmmaUtil<CmdImpl>();
      return emma;
    }
  }
