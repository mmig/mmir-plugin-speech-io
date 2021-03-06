
import { Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';

import { RecognitionEmma , RecognitionType , SpeechRecognitionResult } from '../typings/';
import { EmmaUtil } from '../util/EmmaUtil';

import { SubscriptionUtil } from '../util/SubscriptionUtil';
import { DictationTargetHandler , DictationHandler , DictationTarget , CurrentInputData , UNSTABLE_RESULT_HTML_PREFIX , UNSTABLE_RESULT_HTML_SUFFIX , SelectionMode } from '../io/SpeechDictation';
import { triggerClickFeedback } from '../io/HapticFeedback';

import * as CaretPositionModule from '../lib/caretPosition.d';
import * as LengthModule from '../lib/length.d';
import { SelectionUtil } from '../util/SelectionUtil';

import { SpeechEventName , ExtMmirModule , SpeechIoManager } from '../typings/';
import { MmirService } from '../mmir-service';
import { PLUGIN_ID } from '../consts';

declare var require: Function;


export type RecognitionTypeExt = RecognitionType | 'RECOGNITION_ERROR';

export interface ASRResult extends SpeechRecognitionResult {
  isAutoComplete?: boolean;
}

export interface DisplayText {
  text: string;
  rest?: string;
  interimIndex?: number;
  unstable?: string;
  isAutoComplete?: boolean;
}

export class SpeechInputController {

  protected _debugMsg: boolean = false;

  protected _speechEventSubscriptions: Map<SpeechEventName, Subscription>;

  protected _emma: EmmaUtil<any>;
  protected _manager: SpeechIoManager<any>;
  protected _mmir: ExtMmirModule<any>;

  protected _selectionUtil: SelectionUtil;

  protected _stopDictWord: string | {[languageId: string]: string};
  /**stop-expression for stopping dictation-input*/
  protected _stopDictExpr: RegExp | {[languageId: string]: RegExp};
  protected _cancelDictWord: string | {[languageId: string]: string};
  protected _cancelDictExpr: RegExp | {[languageId: string]: RegExp};

  public get debug(): boolean { return this._debugMsg; }
  public set debug(value: boolean) {
    this._debugMsg = value;
    this.dictTargetHandler.apply(handler => handler.debug = value);
  }

  public dictationResults: Observable<RecognitionEmma>;//TODO remove?

  public get dicationTargets(): DictationTargetHandler {
    return this.dictTargetHandler;
  }

  public get emma(): EmmaUtil<any> {
    return this._emma;
  }

  constructor(
    protected mmirProvider: MmirService<any>,
    protected dictTargetHandler: DictationTargetHandler,
    ignoreMmirReady?: boolean
  ) {

    if(ignoreMmirReady){
      this.init(mmirProvider);
    } else {
      mmirProvider.ready().then(mmirp => {
        this.init(mmirp);
      });
    }
  }

  private init(mmirp: MmirService<any>): void {

    this._mmir = mmirp.mmir as ExtMmirModule<any>;
    this._emma = mmirp.mmir.emma;
    this._manager = mmirp.mmir.speechioManager;

    this._speechEventSubscriptions = SubscriptionUtil.subscribe(mmirp.speechEvents, [
      'dictationResult',
      // 'speechCommand',
      // 'commandAction'
      //'resetGuidedInputForCurrentControl' , 'startGuidedInput' , 'resetGuidedInput' , 'isDictAutoProceed'
    ], this);

    this.dictationResults = mmirp.speechEvents.dictationResult.pipe(map(dictation => this._processDictationResult(dictation)));

    //FIXME should get configuration from somewhere else?
    const stopWord = this._mmir.conf.get([PLUGIN_ID, 'dictStopWord'], '');
    if(stopWord){
      const cancelWord: string = this._mmir.conf.get([PLUGIN_ID, 'dictAbortWord'], '');
      this.setDictationCommand(stopWord, cancelWord);
    }

    if(!this._mmir.conf.getBoolean([PLUGIN_ID, 'disableUnstableFeedback'], false)){
      const len = require('../lib/length.js') as typeof LengthModule;
      const pos = require('../lib/caretPosition.js') as typeof CaretPositionModule;
      this._selectionUtil = new SelectionUtil(len, pos);

      //TODO move this, since it's application specific...
      //style faux-span: must force some global-styling for SPAN to use the selection's own style
      //                 -> set ID for faux SPAN and specify style for "reseting" global styling
      const fauxId = PLUGIN_ID+'-sel-marker-faux';
      const opt = this._selectionUtil.getSelectionOptions();
      opt.fauxId = fauxId;

      const fauxStyle = document.createElement('style');
      fauxStyle.textContent = '#'+fauxId+' {font-size:inherit;text-align:inherit;}';
      document.head.appendChild(fauxStyle);
    }
  }

  public destroy() {
    SubscriptionUtil.unsubscribe(this._speechEventSubscriptions);
  }

  //DISABLED would need change-detection, in case textfield is edited manually!!!
  // public createDictationHandler(textfield: ElementRef, id: string, feedbackStyle?: SelectionMode|boolean, isHandleStandalone?: boolean): DictationHandler {
  //
  //   if(typeof feedbackStyle === 'boolean'){
  //     isHandleStandalone = feedbackStyle;
  //     feedbackStyle = void(0);
  //   }
  //
  //   const handler = new DictationHandler(id, this._emma, this, this._selectionUtil);
  //
  //   if(feedbackStyle){
  //     handler.selectionMode = feedbackStyle as SelectionMode;
  //   }
  //
  //   if(isHandleStandalone){
  //     handler.init(textfield);
  //   } else {
  //     handler.setTarget(textfield);
  //   }
  //
  //   return handler;
  // }

  public createDictationTarget(target: DictationTarget, id: string, feedbackStyle?: SelectionMode): DictationHandler {

    const handler = new DictationHandler(id, this._selectionUtil);
    handler.debug = this._debugMsg;

    if(feedbackStyle){
      handler.selectionMode = feedbackStyle;
    }

    handler.setTargetRef(target);

    return handler;
  }

  public setDictationCommand(stopCommandWord: string, cancelCommandWord?: string){
    this._stopDictWord = stopCommandWord || '';
    this._cancelDictWord = cancelCommandWord || '';
    this.doUpdateDictationCmd();
  }

  protected doUpdateDictationCmd(){
    const expr = this.doUpdateDictationCmdRegExp(this._stopDictWord, this._cancelDictWord);
    this._stopDictExpr = expr[0];
    this._cancelDictExpr = expr[1];
  }

  protected doUpdateDictationCmdRegExp(stopCmd: string | {[language: string]: string}, cancelCmd: string | {[language: string]: string}): Array<RegExp | {[language: string]: RegExp}> {
    let stopWord: string = stopCmd as string;
    let cancelWord: string = cancelCmd && typeof cancelCmd === 'string'? cancelCmd : '';
    let reStop: RegExp | {[language: string]: RegExp};
    let count: number = 0;
    if(stopCmd && typeof stopCmd !== 'string'){
      reStop = {};
      for(const s in stopCmd){
        stopWord = stopCmd[s];
        if(stopWord){
          if(cancelWord){
            //if there is a single cancel word (i.e. no dictionary):
            // do include it in all stop-expressions
            stopWord = '('+stopWord+'|'+cancelWord+')';
          }
          reStop[s] = new RegExp('^\\s*'+stopWord+'\\s*$', 'i');
        }
        ++count;
      }
      stopWord = '';//<- signal that we have a dictionary of stop-commands
    }

    if(stopWord){
      reStop = new RegExp('^\\s*'+stopWord+'\\s*$', 'i');
    } else if(!stopCmd || count === 0){
      //if no stop-command or dictionary was empty: reset expression
      reStop = void(0);
    }

    let reCancel: RegExp | {[language: string]: RegExp};
    let isUpdateStopWord: boolean = false;
    count = 0;
    if(cancelCmd && typeof cancelCmd !== 'string'){
      reCancel = {};
      for(const s in cancelCmd){
        cancelWord = cancelCmd[s];
        if(cancelWord){
          //if there is stopword:
          // do add the cancel word, so that it detect both cancel & stop words
          if(stopCmd && stopCmd[s]){
            reStop[s] = new RegExp('^\\s*('+stopCmd[s]+'|'+cancelWord+')\\s*$', 'i');
          } else if (stopWord){
            //add cancel-word to single-stopword (i.e. non-dictionary) expression
            stopWord += '|' + cancelWord;
            isUpdateStopWord = true;
          }
          reCancel[s] = new RegExp('^\\s*'+cancelWord+'\\s*$', 'i');
          ++count;
        }
      }
      cancelWord = '';//<- signal that we have a dictionary of cancel-commands
    }

    if(cancelWord){
      reCancel = new RegExp('^\\s*'+cancelWord+'\\s*$', 'i');
      if(stopWord){
        stopWord += '|' + cancelWord;
        isUpdateStopWord = true;
      }
    } else if(!cancelCmd || count === 0){
      //if no cancel-command or dictionary was empty: reset expression
      reCancel = void(0);
    }

    if(isUpdateStopWord){
      //we had dictionary of cancel-words, but only single string for stop-words -> include all cancel words in stop-expression test:
      reStop = new RegExp('^\\s*('+stopWord+')\\s*$', 'i');
    }

    return [reStop, reCancel];
  }

  protected doTest(str: string, dictCmdExpr: RegExp | {[language: string]: RegExp}): boolean;
  protected doTest(str: string, dictCmdExpr: RegExp | {[language: string]: RegExp}, isRemove: true): string;
  protected doTest(str: string, dictCmdExpr: RegExp | {[language: string]: RegExp}, isRemove?: boolean): boolean | string {
    if(dictCmdExpr){
      let re: RegExp;
      if(dictCmdExpr instanceof RegExp){
        re = dictCmdExpr;
      } else {
        re = dictCmdExpr[this._mmir.lang.getLanguage()];
      }
      if(re){
        return isRemove? (str? str.replace(re, '') : '') : re.test(str);
      }
    }
    return isRemove? '' : false;
  }

  ////////////////////////////////////////// Speech Input Event Handler ////////////////////////

  /**
   * Called for processing dictated text.
   *
   * E.g. text could  be visualized/shown in GUI, and/or stored internally etc.
   *
   * @param  {RecognitionEmma} emma the EMMA event contain an ASR result(s) from
   *                                 speech recognition.
   */
  public dictationResult(asrEmmaEvent: RecognitionEmma): void {
    if(this._debugMsg) console.log('dictationResult -> ', asrEmmaEvent);

    let targetId = this._emma.getTarget(asrEmmaEvent);
    let target = this.dictTargetHandler.get(targetId);
    if(target){

      asrEmmaEvent = this._processDictationResult(asrEmmaEvent);

      // target.handleDictationResult(asrEmmaEvent);

      this.doHandleDictationResult(asrEmmaEvent, target);

    } else {
      console.warn('no dictation target initilized for "'+targetId+'"');
    }
  }


  protected _processDictationResult(asrEmmaEvent: RecognitionEmma): RecognitionEmma {//TODO remove?
    if(this._debugMsg) console.log('_processDictationResult -> ', asrEmmaEvent);
    return asrEmmaEvent;
  }

  protected doHandleDictationResult(asrEmmaEvent: RecognitionEmma, inputElem: DictationHandler){

    const asr = this._emma._extractAsrData(asrEmmaEvent) as ASRResult;
    // var targetId = this._extractTargetElementId(asrEmmaEvent);

    const currentInputData: CurrentInputData = inputElem._inputData;// this._getCurrentInput(targetId);
    // const inputElem = this._getCurrentInputElement(targetId);

    let result: string = asr.text;
    const	//score: number = asr.confidence,
      type: RecognitionTypeExt = asr.type as RecognitionTypeExt,
  //		alternatives = asr.alternatives,
      unstable: string = asr.unstable,
      isAutoComplete: boolean = asr.isAutoComplete;//<- flag: if omitted or TRUE: do "commit" result to autocomplete (if the targeted DOM-element is an autocomplete widget)

    let isStopped: boolean = false;

    //process non-guided "selection mode" for autocomplete
    const isGuided: boolean = false;//TODO: asrEmmaEvent && asrEmmaEvent.interpretation && asrEmmaEvent.interpretation.isGuided;
    let isConsumed: boolean = false;
    if(! isGuided){

      //TODO: impl.:  autocomplete-widget handling
  // 		if(inputElem && inputElem.isAutocomplete()){//} && inputElem.input.attr('disamb') == 'true'){
  //
  // 			var foundOptions = inputElem.getAutocompleteMenu();
  //
  // 			// mmir.DialogManager.performHelper('WikSite', 'setHelpHint', null, {enable: true, mode: 'dictation', 'helpHint': {
  // 			// 	'text': 'Zum Auswählen, nennen Sie bitte einen Eintrag.',
  // 			// 	'cmd': ''
  // 			// }});
  // 			// this.repositionSpeechDictDlg();
  //
  //
  // 			if(type == 'INTERIM'){
  // 				if(foundOptions.length > 0){
  // 	//				isAutoComplete = false;
  // 					return;//do not apply interim-results when there is already one result displayed
  // 				}
  // 			} else {
  //
  // 	//			inputElem.input.attr('disamb', 'false');
  //
  // 				var isReset = false;
  // 	//			var foundOptions = inputElem.getAutocompleteMenu();
  // 				if(foundOptions.length < 1){
  // 	//				isReset = true;
  // 					if(currentInputData.result.length > 0){
  // 						isReset = true;
  // 					}
  // 				} else {
  //
  // 					var options = wik.tools.createAutoCompleteChooseCommand(foundOptions);
  // 					if(options && !$.isArray(options)){
  // 						options = [options];
  // 					}
  // 					var textTriple = wik.tools.getAsTriple(result);
  // 					var optionText, optionTriple, max;
  // 					if(options.length > 0){
  //
  // 						for(var i=0, size = options.length; i < size; ++i){
  //
  // 							optionText = options[i].param.title;
  // 							optionTriple = wik.tools.getAsTriple(optionText);
  // 							score = wik.tools.calculate(optionTriple, textTriple);
  //
  // 							if(!max || (score > 0 && score > max.score)){
  // 								max = {
  // 									score: score,
  // 									//TODO calc coverage & require min. converage for exec max cmd
  // 									index: i
  // 								};
  // 							}
  // 						}
  //
  // 					}
  //
  // 					if(max && max.score > 0){//TODO use more strict limit? or coverage with some limit?
  //
  // 						inputElem.setSysSel(true);
  // 	//					$(options[max.index]).trigger('click');
  //
  // 						this.execCmd(options[max.index], result);
  // 						//since execCmd is async: need to clear sys-sel in one-time select-handler for autocomplet ctrl:
  // 						inputElem.input.one('autocompleteselect', function(event){
  // 							inputElem.setSysSel(false);
  // 						});
  //
  // 						isStopped = true;
  // 						isConsumed = true;
  //
  // 					} else {
  // 						isReset = true;
  // 					}
  //
  // 				}
  //
  // 				var isNoResult = inputElem.isAutocompleteNoResult();
  // 				if(isReset || isNoResult){
  //
  // 					//reset by removing previous results/text and setting the current one as UNSTABLE (and treating input as INTERIM):
  // 					currentInputData.reset();
  // 					unstable = result;
  // 					result = '';
  // 					type = 'INTERIM';
  //
  // //					this.resetDictText(targetId);
  // 					if(!isNoResult){
  // 						inputElem.input.autocomplete('close');
  // 					}
  //
  // //					isConsumed = true;
  // 				}
  //
  // 			}//END if(type == 'INTERIM'){}else{}
  //
  // 		}//END: if(isAutocomplete)

    }//END: if(!isGuided)

    let isCanceled: boolean = false;
    if(!isStopped && type !== 'INTERIM'){

      const isEvalStopWord: boolean = this._isEvalDictStopWord(asrEmmaEvent);
      if(isEvalStopWord && this.doTest(result, this._stopDictExpr)){

        if(this.doTest(result, this._cancelDictExpr)){
          isCanceled = true;

        }

        result = this.doTest(result, this._stopDictExpr, true);

        //remove trainling whithespace, if there is one:
        if(/\s$/.test(result)){
          result = result.substring(0, result.length - 1);
        }

        isStopped = true;

        //isStopped due to stop-word, but already consumed:
        // need to update input-text -> "un-consume"!
        if(isConsumed){
          isConsumed = false;
        }
      }

    }

    let isUpdateControl: boolean = false;
    if(!isConsumed){

      if(type == 'INTERIM'){
        currentInputData.interim = result;
        currentInputData.unstable = unstable;
      }
      else if(result || isStopped) {

        currentInputData.interim = '';
        currentInputData.unstable = '';
    //		currentInputData.result.push(result.replace(/  /gm, ' '));
        if(result){
          currentInputData.add(result);
        }

    //		currentInputData.score.push(score);
    //		currentInputData.result.alternatives.push(alternatives);
      }

      if(type !== 'RECOGNITION_ERROR'){

        //FIXME only should do this when neccessary (-> "focus fix for selecting text on Android": do blur() if non-stable results are contained, so that text-input loses focus)
        isUpdateControl = isUpdateControl || type !== 'INTERIM';

        this._printCurrentInput(inputElem.id, isAutoComplete, inputElem);//TODO currentInputData);
      }
    }

    if(isStopped){

      if(isCanceled || !inputElem.getText().trim()){

        //input-text is empty due to stop-word-removal, or dict was canceled
        // -> restore original-text (if there is one)

        const originalText: string = inputElem.getData('original-text');
        if(originalText){
          currentInputData.set(originalText);
          inputElem.setText(originalText);
        }
      }

      let isActivateCommandInput: boolean = false;

  //		if(inputElem && inputElem.isAutocomplete()){
  //
  //			var foundOptions = inputElem.getAutocompleteMenu();
  //
  //			if(foundOptions.length === 1){
  //
  //				//-> found unique match -> select this
  //				triggerClickFeedback();
  //				mmir.speechioManager.emit('execCmd', wik.tools.createAutoCompleteChooseCommand(foundOptions));
  //
  //			} else if(foundOptions.length > 1){
  //
  //				//-> trigger disambiguation for entries (interpreted as options)
  //				isActivateCommandInput = true;
  //				mmir.dialog.raise('nonUniqueCmd', wik.tools.createAutoCompleteChooseCommand(foundOptions));
  //
  //////				inputElem._autocompleteDisamb = true;
  ////				inputElem.input.attr('disamb', 'true');
  //			}
  //		}

        //TODO impl. auto-proceed, i.e. go-to-next
      // if(this.isDictAutoProceed()){
  // 			var dicts = $('.wik-speech.speech-dict');
  // 			var currIndex = -1;
  // 			var size = dicts.length;
  // 			if(size > 1){
  // 				for(var i=0; i < size; ++i){
  // 					if(dicts[i].id == targetId){
  // 						currIndex = i;
  // 						break;
  // 					}
  // 				}
  // 			}
  // 			if(currIndex > -1 && currIndex + 1 < size){
  // 				$(dicts[currIndex+1]).trigger('click');
  // 			}
  // 			else {
  // //				$('#mc-speech-command').trigger('click');
  // 				isActivateCommandInput = true;
  // 			}
  // 		}
  // 		else {

        if(inputElem.getData('speech') === 'restart-command'){
          inputElem.removeData('speech');//reset element
  //				$('#mc-speech-command').trigger('click');//restart command-mode
          isActivateCommandInput = true;
        }
        else if(!isActivateCommandInput) {
          //close dictation
          this._manager.raise('cancel-dictation');
          isUpdateControl = true;
        }
      // }//END: if(this.isDictAutoProceed()){...

      if(isActivateCommandInput){
        triggerClickFeedback();//FIXME should we use impl. from VoiceUIController here instead?
        this._manager.raise('toggleSpeechInputState', {mode: 'command', targetId: 'mc-speech-command'});
        this._manager.raise('showSpeechState');
        isUpdateControl = true;
      }

  //		if(isUpdateControl){
  //			inputElem.doSetUnfocused();
  //		}

    }//END: if(isStopped)

    //FIXME must/should this be done for asr-engines with interim-results (i.e. Google ASR), so that on Android tablets focus is freed after selection (would only be needed, if unstable was present!)
    if(isUpdateControl){// !isUpdateControl && unstable){
      inputElem.doSetUnfocused();
    }
  }

  protected _printCurrentInput(targetId: string, isCommitAutoComplete: boolean, inputElem: DictationHandler){

    inputElem = inputElem || this.dictTargetHandler.get(targetId);

    const output = this._getCurrentInputText(targetId, inputElem.isPlainText, inputElem.isIntegerInput, true, inputElem._inputData);

    if(output){

      if(typeof output === 'object'){
        output.isAutoComplete = isCommitAutoComplete;
        isCommitAutoComplete = void(0);
      }

      inputElem.setText(output, isCommitAutoComplete);
    }
  }


/**
 * get the text (String) of current input (i.e. everything that was inserted
 * by text or speech up to now).
 *
 *
 * @param {String} targetId
 * 				the ID of the dictation button (without the leading #}
 *
 * @param {Boolean} [isPlainText] OPTIONAL
 * 				if <code>true</code> the returns the current-input-text
 * 				as plain text String.
 * 				If <code>falsy</code> or omitted, returns the current-input-text
 * 				as HTML formatted String (i.e. with HTML tags) which are:
 *  			  <ul>
 *  				<li>for <em>unstable</em> part: if present, unstable text will be
 *  					wrapped in a SPAN tag with <code>class</code> "unstable".
 *  				</li>
 *  			  </ul>
 *
 *
 *  @param {Boolean} [isRemoveAllWhitespaces] OPTIONAL
 *  			IFF true, all whitespaces are removed from the returned (stable part of the) output text
 *
 *  @param {Boolean} [isWithExtraUnstable] OPTIONAL
 *  			if this argument is used, then isPlainText MUST be given too.
 *  			If FALSE and the current data-input for <code>targetId</code> contains
 *  			unstable text, then this unstable part is simply appended to the returned text
 *  			(and the <code>unstable</code> field in the retruned object will be empty).
 *  			Otherwise, the unstable part (if present in the current data-input for <code>targetId</code>)
 *  			will be set as <code>unstable</code> field in the retruned object.
 *
 *  @param {CurrentInputData} [inputData] OPTIONAL
 *  			if omitted, the corresponding CurrentInputData for targetId will be used
 *
 *
 *  @returns {String|Object} the current input text as String or an Object {text: String, unstable: String}
 */
protected _getCurrentInputText(targetId: string, isPlainText: boolean, isRemoveAllWhitespaces: boolean, isWithExtraUnstable: boolean, inputData?: CurrentInputData): DisplayText | string {

  let output: string;
  let rest: string;
  let unstable: string;
  let interimIndex: number;
  let currentInputData: CurrentInputData = inputData || this.dictTargetHandler.get(targetId)._inputData;
  if(isPlainText){

    output = currentInputData.getCurrentText();
    rest = currentInputData.getRestText();

    if(isRemoveAllWhitespaces === true){
      output = output.replace(/\s+/gm, '');
    }

    if(currentInputData.interim){
      interimIndex = output.length;
      output = output + ' ' + currentInputData.interim;
    }

    if(currentInputData.unstable){

      if(!isWithExtraUnstable){
        output = output + ' ' + currentInputData.unstable;
      }
      else {
        unstable = currentInputData.unstable;
      }
    }



    output = output.replace(/  /gm, ' ');
  }
  else {

      output = currentInputData.getCurrentText();
      rest = currentInputData.getRestText();

      if(currentInputData.interim){
        interimIndex = output.length;
        if( ! /\s$/igm.test(output)){
          output += ' ';
        }
        output += currentInputData.interim;
      }

      // if(output){
      //
      // 	//TODO russa: do this on adding the results to the inputData object (and not *every* time when it is printed!)
      // 	output = output.
      // 		//remove space before puntuation:
      // 		replace(/ ([.,;?!:])/igm, '$1').
      // 		//force upper case on new line and after "sentence ending punctuation"
      // 		replace(/(^|[.?!]\s)\s?(\w)(\w+)/igm, function(m, p1, w1, w2){ return p1 + w1.toUpperCase() + w2; });
      //
      // }

      if(currentInputData.unstable){

        if(!isWithExtraUnstable){

          if( ! /\s$/igm.test(output)){
            output += ' ';
          }
          output += UNSTABLE_RESULT_HTML_PREFIX + currentInputData.unstable + UNSTABLE_RESULT_HTML_SUFFIX;

        } else {
          unstable = currentInputData.unstable;
        }
      }
      output = output.replace(/\r?\n/gm, '<br>');
    }

    if(isWithExtraUnstable){
      return {
        text: output,
        rest: rest,
        interimIndex: interimIndex,
        unstable: unstable
      };
    }
    else {
      return output + (rest? ' ' + rest : rest);
    }
  }

  protected _isEvalDictStopWord(asrEmmaEvent: RecognitionEmma): boolean {
    //TODO impl. & "global" setting on SpeechInput, in case emmaEvent has no info set? -> this.isEvalDictStopWord
    return !(asrEmmaEvent && asrEmmaEvent.interpretation && asrEmmaEvent.interpretation.inputMode === 'guided');
  }

  protected isDictAutoProceed(): boolean {
    return false;//TODO (move to more appropriate place?): mmir.User.isDictAutoProceed();
  };

}
