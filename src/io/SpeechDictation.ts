
import { Observable , Subscription } from 'rxjs';

// import { EmmaUtil } from '../util/EmmaUtil';
// import { SpeechInputController } from '../ctrl/SpeechInputController';
import { DisplayText } from '../ctrl/SpeechInputController';
import { SelectionUtil } from '../util/SelectionUtil';
import { DICTATION_CONTROL , SPEECH_ACTIVE } from '../consts';
import { getHtmlElement } from '../util/Utils';
import { GuiElement , FormControl } from '../typings/';


export const UNSTABLE_RESULT_HTML_PREFIX = '<span class="unstable">';
export const UNSTABLE_RESULT_HTML_SUFFIX = '</span>';

export class DictationTargetHandler {

  private targets: Map<string, DictationHandler>;

  constructor(){
    this.targets = new Map<string, DictationHandler>()
  }

  public get(id: string): DictationHandler | undefined {
    return this.targets.get(id);
  }

  public has(id: string): boolean {
    return this.targets.has(id);
  }

  public put(id: string, el: DictationHandler): void {
    this.targets.set(id, el);
  }

  public delete(elem: DictationHandler | string): boolean {
    const id = typeof elem === 'string'? elem : elem.id;
    return this.targets.delete(id);
  }

  public reset(){
    if(this.targets.size > 0){
      this.targets.forEach(handler => {
        handler.destroy();
      });
      this.targets.clear();
    }
  }

  public apply(func: (handler: DictationHandler) => void){
    if(this.targets.size > 0){
      this.targets.forEach(func);
    }
  }

  public destroy() {
    this.reset();
  }
}

export class DictationHandler {

  private asrResultSubs: Subscription;

  private target: DictationTarget;
  private textfield: GuiElement;
  public nativeInput: HTMLElement;
  public nativeCtrl: HTMLElement;

  private onTextChangeSubs: Subscription;

  // private stableDictText: string;

  private _selectionListener: (event: Event) => void;
  private _focusListener: (event: Event) => void;

  isBrowserEnv: boolean;
  _isNeedFixFocus: boolean;
  isPlainText: boolean;
  isTextInputEl: boolean;
  isIntegerInput: boolean;
  isNativeSelectable: boolean;
  _isAutocomplete?: boolean;
  _inputData: CurrentInputData;

  selectionMode: SelectionMode;

  private _debug: boolean = false;

  public get debug(): boolean { return this._debug; }
  public set debug(value: boolean) {
    this._debug = value;
    this._inputData._debug = value;
  }

  get activationCtrl(): HTMLElement { return this.nativeCtrl; }
  // set activationCtrl(value: HTMLElement) { this.target.ctrl = value; }

  constructor(public readonly id: string, private selectUtil: SelectionUtil){
    this.selectionMode = 'unstable';
    this._inputData = new CurrentInputData();//TODO lazy-create?
    this._inputData._debug = this._debug;
  }

  protected setInputTarget(textfield: GuiElement){

    this.textfield = textfield;
    const textEl: HTMLElement = getHtmlElement(textfield);
    this.nativeInput = textEl;

    const tagType = textEl.tagName;
    this.isPlainText = tagType === 'TEXTAREA' || tagType === 'INPUT'? true : false;
    this.isTextInputEl = tagType === 'INPUT'? true : false;
    this.isIntegerInput = this.getData('accept') === 'integer' || this.getData('accepts') === 'integer';//FIXME should really be only "accept", but current on regisration-pages (PLZ field) "accepts" is used ...

    //FIXME need more elaborate detection: this should be true for Android (are there version where it is not needed? is it needed on iOS?
    this._isNeedFixFocus = this.isPlainText && false;//TODO: this._env.isCordovaEnv && !wik.tools.isAutoCompleteEl(textEl);//<- if Cordova-env, text-input element (but not for autocomplete widgets!)


    const sel: InputSelection = this.getInputSelection();
    this._inputData.selection = sel;
    if(sel){
      this.setSelection(sel.start, sel.end);
    }

    //if native input element is "selectable" (i.e. native event support for selecting text)
    const selectable = this.isTextInputEl && /text|search|password|url|tel/i.test((textEl as HTMLInputElement).type);

    //if input element can be selected (i.e. selection-marker can be applied: for non-text-input fields this is done by <span> elements)
    this.isNativeSelectable = !this.isTextInputEl || selectable;

    //if native text input element is "selectable" do init select change listener(s)
    if(this.isPlainText || selectable){
      this.doInitSelectionChange();
    }
  }

  protected doInitSelectionChange(){

    const self = this;
    this._selectionListener = function(this: HTMLInputElement, event: Event): void {

      let sel: InputSelection = self.getInputSelection();
      if(!sel){
        //do not need to continue, if position is at input-text's end

        if(this.dataset['MMMIR_PREV_SEL_START'] || this.dataset['MMMIR_PREV_SEL_END']){
          sel = self.getInputSelection(true);
          if(sel){
            if(self._debug) console.log('onselection['+event.type+']: selection changed to zero-length range (position) at '+sel.start+', resetting selection markers ');
            self.setSelection(null);
          }

          //reset markers for previous position/selection
          this.dataset['MMMIR_PREV_SEL_START'] = '';
          this.dataset['MMMIR_PREV_SEL_END'] = '';
        }

        return;///////////////// EARLY EXIT //////////////
      }

      const start: number = sel.start;
      const end: number = sel.end;

      const prevStart: number = parseInt(this.dataset['MMMIR_PREV_SEL_START'], 10);
      const prevEnd: number = parseInt(this.dataset['MMMIR_PREV_SEL_END'], 10);

      if(isFinite(prevStart) && isFinite(prevEnd)){
        if(self._debug) console.log('onselection: PREV ['+prevStart+', '+prevEnd+'], CURR ', sel);
        if(start === prevStart && end === prevEnd){
          //only need to continue, if selection has changed
          return;///////////////// EARLY EXIT //////////////
        }
      }
      if(self._debug) console.log('onselection['+event.type+']: selection/position changed ', sel);

      this.dataset['MMMIR_PREV_SEL_START'] = (start||'').toString();
      this.dataset['MMMIR_PREV_SEL_END'] = (end||'').toString();

      const idata = self._inputData;
      const text: string = idata.interim || idata.unstable? idata.getCurrentText() + (self.selectionMode === 'interim'? idata.interim : '') + idata.getRestText() : this.value;
      idata.set(text);//need to reset for new selection
      idata.selection = sel;
      self.setSelection(start, end);
    }
    this.nativeInput.addEventListener('select', this._selectionListener, false);
    this.nativeInput.addEventListener('keyup', this._selectionListener, false);
    this.nativeInput.addEventListener('click', this._selectionListener, false);

    this._focusListener = function(this: HTMLInputElement, _event: Event): void {
      self.setSelection(null);
    };
    this.nativeInput.addEventListener('focus', this._focusListener, false);
  }

  protected setCtrl(ctrl: GuiElement){
    this.nativeCtrl = getHtmlElement(ctrl);
    this.nativeCtrl.classList.add(DICTATION_CONTROL);
  }

  protected initFromTarget(currentText: string, textChangeObservable: Observable<string>){
    if(currentText){
      this._inputData.set(currentText, false);
    }
    this.onTextChangeSubs = textChangeObservable.subscribe(text => {
      if(this._debug) console.log('onInputChange: ', text);//DEBUG
      this._inputData.set(text, false);
    });
  }

  public setTargetRef(target: DictationTarget){

    this.target = target;

    if(target.input){
      this.setInputTarget(target.input);
    } else {
      this.isPlainText = true;
    }

    if(target.ctrl){
      this.setCtrl(target.ctrl);
    }

    if(target.form){
      this.initFromTarget(target.form.value, target.form.valueChanges);
    } else if(target.onInputChange){
      this.initFromTarget(this.getText(), target.onInputChange);
    }

  }

  // public update(){
  //   if(this.target){
  //     this.target.changeDect.detectChanges();
  //     this.stableDictText = this.target.container[this.target.fieldName];
  //   } else {
  //     this.stableDictText = this.textfield.nativeElement.value;
  //   }
  // }

  /**
   * release dictation-handler & (interal) dictation-target resources
   *
   * @param  [doNotResetActiveCss]  OPTIONAL if `true`, do not reset CSS classes on HTMLElement that indication `speech-active`
   *                                (e.g. if HTMLElements will be dispose anyway, there is no need to reset their state)
   * @param  [keepDictationTarget]  OPTIONAL if specified, will not destroy the `DictationTarget`, if it is the same instance as
   *                                `keepDictationTarget` (by reference or its ID)
   *                                (can/should be used, if the dictation-target will still be used later on).
   */
  public destroy(doNotResetActiveCss?: boolean, keepDictationTarget?: DictationTarget | string | boolean): void {
    if(this.asrResultSubs){
      this.asrResultSubs.unsubscribe();
      this.asrResultSubs = null;
    }
    if(this.onTextChangeSubs){
      this.onTextChangeSubs.unsubscribe();
      this.onTextChangeSubs = null;
    }
    if(this.target){
      const isDestroyTarget = (typeof keepDictationTarget === 'string' && keepDictationTarget !== this.target.id) || keepDictationTarget !== this.target;
      if(isDestroyTarget && keepDictationTarget !== true){
        // unlink all fields from DictationTarget, except `id`:
        for(const key in this.target){
          if(key === 'id'){
            continue;
          }
          this.target[key] = void(0);
        }
      }
      // in any case: de-reference target from the handler itself
      this.target = null;
    }
    if(this._inputData){
      this._inputData.reset();
    }
    if(this.nativeInput){
      if(!doNotResetActiveCss){
        this.nativeInput.classList.remove(SPEECH_ACTIVE);
      }
      if(this._selectionListener){
        this.nativeInput.removeEventListener('select', this._selectionListener, false);
        this.nativeInput.removeEventListener('keyup', this._selectionListener, false);
        this.nativeInput.removeEventListener('click', this._selectionListener, false);
        this._selectionListener = null;
      }
      if(this._focusListener){
        this.nativeInput.removeEventListener('focus', this._focusListener, false);
        this._focusListener = null;
      }
    }
    if(this.nativeCtrl && !doNotResetActiveCss){
      this.nativeCtrl.classList.remove(SPEECH_ACTIVE);
    }
    this.textfield = null;
    this.nativeInput = null;
    this.nativeCtrl = null;
    // this.stableDictText = null;
  }

  public prepare(){
    // this.selectUtil.resetSelectionCalc();
  }

  public showDictationFeedback(display: boolean){
    if(display){
      const sel = this.getInputSelection();
      if(sel){
        this.setSelection(sel.start, sel.end);
      }
    } else if(this.selectUtil) {
      this.selectUtil.resetSelectionCalc();
    }
  }

  private getInputSelection(includePosition?: boolean): InputSelection | null {
    if(this.isPlainText && this.nativeInput){
      const input: HTMLTextAreaElement = this.nativeInput as HTMLTextAreaElement;
      const len = input.value.length;
      const start = input.selectionStart;
      if(len !== start || includePosition){
        const end = input.selectionEnd;
        return {start: start, end: end};
      }
    }
    return null;
  }

  // public handleDictationResult(dictation: RecognitionEmma){//FIXM remove?
  //
  //   if(this._debug) console.log('dicatation result: ', dictation);
  //
  //   let asr = this.emma._extractAsrData(dictation);
  //   let text = asr.text;
  //   if(text){
  //     if(asr.type === 'INTERMEDIATE'){
  //       this.stableDictText = this.append(this.stableDictText, text);
  //       this.setText(this.stableDictText);//doSetTarget(this.stableDictText);
  //     } else {
  //       text = this.append(this.stableDictText, text) + (asr.unstable? ' ' + asr.unstable : '');
  //       this.setText(text);//.doSetTarget(text);
  //     }
  //   }
  // }
  //
  // // private doSetTarget(text: string){
  // //   if(this.target){
  // //     this.target.container[this.target.fieldName] = text;
  // //     this.target.changeDect.detectChanges();
  // //   } else {
  // //     (this.native as HTMLInputElement).value = text;
  // //   }
  // // }
  //
  // private endsWithWhitespace(stableText: string): boolean {
  //   return !stableText || /(\s|\r?\n)$/.test(stableText);
  // }
  //
  // private append(str: string, addition: string){
  //   return (str + (this.endsWithWhitespace(str)? '' : ' ') + addition);
  // }

  /////////////////////////////////// MIGRATE /////////////////////////////////
  setText(str: string | DisplayText, isCommitAutoComplete?: boolean){

      let text: string;
      let unstable: string;
      let rest: string;
      let _isAutoCompl: boolean = true;

      //normalize arguments
      if(typeof str !== 'string'){

        text = str.text;
        unstable = str.unstable;
        rest = str.rest;
        if(typeof str.isAutoComplete !== 'undefined'){
          // (and if present in 1st options-style argument)
          _isAutoCompl = str.isAutoComplete;
        }

        //append space, if there is an unstable part
        if( unstable && (! /\s$/igm.test(text)) ){
          unstable = ' ' + unstable;
        }

        if(unstable){
          text += unstable;
        }

        if(rest){
          text += rest;
        }
      }
      else {
        text = str;
      }

      //the explicit 2nd argument overwrites options for isCommitAutoComplete, if it is present:
      _isAutoCompl = typeof isCommitAutoComplete !== 'undefined'? isCommitAutoComplete : _isAutoCompl;
      if(_isAutoCompl && this.isAutocomplete()){
        //trigger autocomplete FIXME this is still the old jQuery implementation:
        (this.textfield as any).autocomplete('search',text);
      }

      let applied: boolean = false;
      if(this.target){

        const form: FormControl = this.target.form;
        if(this.target.applyRecognition){

          this.target.applyRecognition(text, this.id);
          applied = true;

        } else if (form){

          form.setValue(text, {
            emitEvent: false
          });
          if(!form.dirty){
            form.markAsDirty();
          }
          applied = true;

        } else if(this.target.container){

          this.target.container[this.target.fieldName] = text;
          applied = true;
        }
      }

      if(!applied && this.nativeInput){

        if(this.isPlainText){
          (this.nativeInput as HTMLInputElement).value = text;
        }
        else {
          if(unstable){
            text += UNSTABLE_RESULT_HTML_PREFIX + unstable + UNSTABLE_RESULT_HTML_SUFFIX;
          }
          this.nativeInput.innerHTML = text;
        }
      }

      if(this.nativeInput && this.isPlainText){
        if(this.selectionMode === 'none'){

          this.setSelection(null);//TODO only clear, if there is currently a selection

        } else {

          if(this.selectionMode === 'interim' && typeof str !== 'string' && isFinite(str.interimIndex)){

            //select the interim (+ unstable) part of the string:
            const selStart = str.interimIndex;
            const selEnd = (str as DisplayText).text.length + (unstable? unstable.length : 0);//<- use the original text here (with appended unstable part);

            this.setSelection(selStart, selEnd, text);

          } else if((this.selectionMode === 'unstable' || this.selectionMode === 'interim') && unstable){
            //ASSERT if unstable => str is DisplayText

            //select the unstable part of the string:
            const selStart = (str as DisplayText).text.length;//<- use the original text here (without appended unstable part)
            const selEnd = selStart + unstable.length;

            this.setSelection(selStart, selEnd, text);

          } else {

            this.setSelection(null);//TODO only clear, if there is currently a selection
          }
        }
      }

    }

    getText() : string {
      if(this.target){
        if(this.target.form){
          return this.target.form.value;
        }
        if(this.target.container){
          return this.target.container[this.target.fieldName];
        }
      }

      if(this.isPlainText){
        return (this.nativeInput as HTMLInputElement).value;
      }
      else {
        return this.nativeInput.textContent;
      }
    }

    isAutocomplete(): boolean {//is jQuery.UI autocomplete?
      if(typeof this._isAutocomplete === 'undefined'){
        this._isAutocomplete = this.isPlainText && false;//TODO: wik.tools.isAutoCompleteEl(this.textfield);
      }
      return this._isAutocomplete;
    }

    getAutocompleteMenu(): any {//would return: jQuery-wrapped element
      //FIXME impl.:
      // if(this.isAutocomplete()){
      // 	return this.textfield.autocomplete('widget').find('.ui-menu-item:visible').filter(function(index){
      // 		if(jQuery(this).find('.'+wik.NO_AUTOCOMPLETE_RESULTS_CLASS).length === 0){
      // 			return true;
      // 		}
      // 		return false;
      // 	});
      // }
      // return jQuery();//return empty jQuery collection otherwise
    }

    isAutocompleteNoResult(): boolean {
      //FIXME impl.:
      // if(this.isAutocomplete()){
      // 	return this.textfield.autocomplete('widget').find('.ui-menu-item:visible .'+wik.NO_AUTOCOMPLETE_RESULTS_CLASS).length > 0;
      // }
      return false;
    }

    /**
     * HELPER: set state "system-initiated selection in progress"
     *
     * NOTE: some browsers fire a FOCUS event when text is selected, some do not
     * 		-> this HELPER sets a marker to the text-element, so that:
     *
     * isActive === true => $(text-element).data('isSystemSelection') === true
     * isActive === false => $(text-element).data('isSystemSelection') === FALSY
     */
    setSysSel(isActive: boolean) {
      this.setData('isSystemSelection', !!isActive);
    }

    isSysSel(): boolean {
      const isActive: string = this.getData('isSystemSelection');
      return isActive? JSON.parse(isActive) : false;
    }

    getData(field: string): string {
      return this.nativeInput? this.nativeInput.dataset[field] : void(0);
    }

    setData(field: string, value: any){
      if(this.nativeInput){
        this.nativeInput.dataset[field] = JSON.stringify(value);
      }
    }

    removeData(field: string){
      if(this.nativeInput){
        this.nativeInput.dataset[field] = '';//NOTE do not really delete entries from a DOMStringMap, only "empty" them
        // delete this.nativeInput.dataset[field];
      }
    }

    /**
     * HELPER for fixing the issue, that some Android devices will "pull" focus to the input-element
     * 			when text is entered / a selection is made
     * @param isForce
     * @returns
     */
    doSetUnfocused(isForce?: boolean){

      if(this.textfield && this.isPlainText && (this._isNeedFixFocus || isForce)){

        if(document.activeElement === this.nativeInput || !document.activeElement){
          const evt = new Event('blur', {bubbles: false});
          this.nativeInput.dispatchEvent(evt);
        }

      }
    }

    /**
     * HELPER for fixing the issue, that some Android devices will "pull" focus to the input-element
     * 			when text is entered / a selection is made
     * @param isForce
     * @returns
     */
    isFocused(input?: HTMLElement): boolean {

      input = input || this.nativeInput;
      if(input){
        return input === document.activeElement;
      }
      return false;
    }

    /**
     * HELPER: set "system initiated" selection (see #setSysSel)
     *
     * select all text
     */
    setSelection(): void;
    /**
     * HELPER: set "system initiated" selection (see #setSysSel)
     *
     * clear selection
     */
    setSelection(start: null): void;
    /**
     * HELPER: set "system initiated" selection (see #setSysSel)
     *
     * set selection from start to end of text
     */
    setSelection(start: number): void;
    /**
     * HELPER: set "system initiated" selection (see #setSysSel)
     *
     * set selection range
     */
    setSelection(start: number, end: number, text?: string): void;
    /**
     * HELPER: set "system initiated" selection (see #setSysSel)
     *
     * IF arguments start and end are omitted -> select ALL
     *
     * setSelection() -> select all
     * setSelection(null) -> clear selection
     * setSelection(start: number, end: number, text?: string)
     */
    setSelection(start?: number | null, end?: number, text?: string): void {

      if(!this.nativeInput){
        return;
      }

      if(this.isPlainText){

        if(start === null && this.selectUtil){
          //clear visual selection (visible when text-element is not focused):
          this.selectUtil.clearSelectionMarker();
          return;
        }

        text = text || this.getText();//<- get text without HTML tags/formatting (for text-field/area: the text is always plain)

        if(typeof start !== 'number'){
          start = 0;
        }

        if(typeof end !== 'number'){
          end = text.length;
        }

// 				//FIX: avoid strange "select-all" behavior in Chrome: do not select ending linebreak
// 				//     ... although this may leave a linebreak(s) (e.g. in case it ends with "\n\n" -> "\n")
// 				//     removing 1 seems to fix the unwanted select-all behavior...
// 				if(this.isBrowserEnv){
//
// 					var ln: RegExpMatchArray, lnLen: number;
// 					if( (ln = /(\r?\n)$/.exec(text)) ){
//
// //						if(this._debug) console.info('adjust selection ['+start+','+end+']: ends with a linebreak!');
//
// 						lnLen = ln[1].length;
// 						if(end > lnLen){
// 							end -= lnLen;
// 						} else {
// 							//nothing to select -> return
// 							return;
// 						}
//
// 					}
//
// 				}

        const input = this.nativeInput as HTMLInputElement;//NOTE may also be a HTMLTextAreaElement, but here the difference does not matter

        let omitNativeSel: boolean = false;
        if(end <= start){

          omitNativeSel = true;

        } else {

          //check if the this range is already selected
          var currStart = input.selectionStart;
          if(isFinite(currStart)){
            var currEnd = input.selectionEnd;
            if(currEnd === end && currStart === start){
              if(this._debug)  console.info('already selected: ['+start+','+end+']');
              omitNativeSel = true;
            }
          }
        }

        this.setSysSel(true);
        if(this._isNeedFixFocus){
          input.disabled = true;
        }
        try{

          let applied: boolean = false;
          if(this.isNativeSelectable && this.isFocused(input)){

            //NOTE regarding focus & setSelectionRange():
            //      in recent Chrome versions, setting a selection range will trigger select-events asynchronously
            //     -> in case the actual text is set later applied to the native control than this selection is made
            //          (which unfortunately is currently done when used in angular; see FIXME note below),
            //          upon event-emitting, the selection will have changes to "end-cursor" range
            //     -> then the _selectionListener() cannot determine correctly anymore, if the selection should be updated/cleared
            //  -> WORKAROUND for now: do not set native selection, if element is not focused

            if(!omitNativeSel){

              if(this._debug)  console.info('setSelection('+start+', '+end+')');

              //FIX: the select-text and the actual text in the input may not (yet) be the same
              //    -> prevent selection reset, by only selecting the maximal available text length
              //FIXME should set selection when text is updated in control (e.g. by framework like angular), not directly when set by speech-recognition
              const currLen = input.value.length;
              if(end > currLen){
                end = currLen;
              }

              input.setSelectionRange(start, end);
              applied = true;
            }

          } else if(this.selectUtil){

            //set visual selection, even when text-element is not focused:
            this.selectUtil.setSelectionMarker(input, start, end - start, text);
            applied = true;
          }

          if(applied) {
            input.dataset['MMMIR_PREV_SEL_START'] = ''+start;
            input.dataset['MMMIR_PREV_SEL_END'] = ''+end;
          }

        } catch(err){
          //setSelectionRange is not available for all <input> types!
          console.error('InputElement(id='+(input?input.id:'NIL')+'): could not set selection ['+start+','+end+']: '+err);
        }
        if(this._isNeedFixFocus){
          input.disabled = false;
        }
        this.setSysSel(false);

      } else {
        //else: if(this.isPlainText)

        text = text || this.getText();//<- get text without HTML tags/formatting (for text-field/area: the text is always plain)

        var len = text.length;
        if(typeof start !== 'number' && typeof start !== 'number'){
          start = 0;
          end = len;
        }

        if(end <= start){
          return;
        }

        text =  (start > 0?       text.substring(0, start)   : '') + UNSTABLE_RESULT_HTML_PREFIX +
            (start + 1 > end? text.substring(start + 1, end) : '') + UNSTABLE_RESULT_HTML_SUFFIX +
            (end   + 1 > len? text.substring(end + 1)        : '');

        const input = this.nativeInput;
        input.innerHTML = text;

      }
    }//END setSelection(){...}
}

export type SelectionMode = 'none' | 'unstable' | 'interim';

export type InputSelection = {start: number, end: number, index?: number};

export class CurrentInputData {

      _debug: boolean;

      result: Array<string> = [];
      interim: string = '';
      unstable: string = '';

      selection: InputSelection | null = null;

      reset(): void {
        this.interim = '';
        this.unstable = '';
        this.result.splice(0, this.result.length);
      }

      /**
       * sets current input to 1 single, stable result (and removes unstable & interim parts)
       *
       * @param {string} text
       *                     the (stable) text
       * @param {boolean} [isPreprocessText]
       *                     indicates, if text is already prepocessed: if not, preprocessing is applied
       *                     (transform punctuation-words, captialize at beginning of sentence etc)
       *                     DEFAULT: true
       */
      set(text: string, isPreprocessText?: boolean){//text STRING, isPreprocessText BOOLEAN OPTIONAL (default: true)
        if(text === null || typeof text === 'undefined'){
          this.reset();
          return;
        }
        this.interim = '';
        this.unstable = '';
        if(isPreprocessText !== false){
          text = this._processPunctuation(text);
        }
        this.result.splice(0, this.result.length, text);
      }

      getCurrentText(): string {
        // const len = this.result.length;
        if(this.selection){
          const sel = this.selection.index;
          if(isFinite(sel)){
            return this.result.slice(0, sel).join('');
          } else if(isFinite(this.selection.start)){
            //-> not converted [star,end]-selection to index yet -> do this now by adding an empty-string into the current [star,end]-selection
            this._add('');
            if(this.selection && isFinite(this.selection.index)){
              return this.getCurrentText();
            }
          }
        }
        return this.result.join('');
      }

      getRestText(): string {
        // const len = this.result.length;
        if(this.selection){
          const sel = this.selection.index;
          if(isFinite(sel)){
            return this.result.slice(sel).join('');
          } else if(isFinite(this.selection.start)){
            //-> not converted [star,end]-selection to index yet -> do this now by adding an empty-string into the current [star,end]-selection
            this._add('');
            if(isFinite(this.selection.index)){
              return this.getRestText();
            }
          }
        }
        return '';
      }

      /**
       * add an additional stable part to the current input
       *
       * @param {String} result
       * 			the (paritial but stable) result to add/append
       */
      add(result: string): void {

        if(this._debug) console.log('add "'+result+'" -> ', this.result, ' ', this.selection);

        result = this._processPunctuation(result);

        const insertIndex: number = this._getTargetIndex();
        const beginsWithWhitespace: boolean = /^\s/ig.test(result);
        let prev: string;
        let isAddSpace: boolean = false, isToUpperCase: boolean = false;

        if(insertIndex > 0){

          prev = this.result[insertIndex-1];

          if(prev.length > 0){

            //add space if previous String does not end with one
            // (and if the result itself does not begin with punctuation)
            if(!beginsWithWhitespace  && !/\s$/ig.test(prev) && ! /^[.,;?!:]/ig.test(result) ){
              isAddSpace = true;
            }

            //make first Char to upper case, if previous ends with
            // new line or with a "sentence ending punctuation"
            if(/(^|[.?!])\s*$/ig.test(prev)){
              isToUpperCase = true;
            }
          }
        }
        else {
          //if it is the very first result:
          //  make first Char upper case
          isToUpperCase = /^/ig.test(result);
        }

        if(isToUpperCase){
          result = result.replace(/^(\s*)(\w)(\w+)/ig, function(_m, s, ch, word){
            return (s? s : '') + ch.toUpperCase() + word;
          });
        }

        if(isAddSpace){
          result = ' ' + result;
        }

        this._add(result);

      }//END: add(result)


      private _add(result: string): void {

        if(this.selection){

          if(!isFinite(this.selection.index)){

            //if there are more than 1 results -> join them into 1
            if(this.result.length > 1){
              const text = this.result.join('');
              this.result.splice(0, this.result.length, text);
            }

            //insert into 1 result at the selection
            const inserted = this._insertText(this.result[0] || '', result, this.selection);

            //"convert" insertion:
            // * result[0]: text before selection-start
            // * result[1]: text after selection-end
            // * update this.selection.index, so that new results will be
            //   inserted between result[0] and result[1]
            this.result[0] = inserted[0];
            if(inserted[1]){
              this.result[1] = inserted[1];
              this.selection.index = 1;
            } else {
              //-> insertion was at the very end: continue by append text normally
              this.selection = null;
            }

            return;///////// EARLY EXIT /////////////
          }

        }

        this._addResult(result);
      }

      private _addResult(text: string): void {
        const insertIndex = this.selection? this.selection.index : -1;
        const res: Array<string> = this.result;
        const len: number = res.length;
        if(insertIndex === len || insertIndex < 0 || !isFinite(insertIndex)){
          res.push(text);
        } else {

          //check, if a space should be appended to new text
          if(text[text.length - 1] !== ' ' && res[insertIndex][0] !== ' ' && !/^[.,;?!:]/ig.test(res[insertIndex])){
            //if new text does not end with a space AND the next part does not start with one (or isn't punctuation) -> insert space
            text += ' ';
          }

          //increase array for new entry
          res.push('');

          //move entries at insertIndex and later up by 1:
          for(let i=len-1; i >= insertIndex; --i){
            res[i+1] = res[i];
          }
          res[insertIndex] = text;
          ++this.selection.index;
        }
      }

      _processPunctuation(text: string): string {//TODO move this function to an separate text-processing module

        var str = text.replace(/\s?\bKomma\b/ig, ',')
              .replace(/\s?\bFrage ?zeichen\b/ig, '?')
              .replace(/\s?\bAusrufe ?zeichen\b/ig, '!')
              .replace(/\s?\bDoppelpunkt\b/ig, ':')
              .replace(/\s?\bSemikolon\b/ig, ';')
              .replace(/\s?\bAnführungs ?(zeichen|striche)\b/ig, '"')
              .replace(/\b(Binde|Gedanken) ?strich\b/ig, '-')
              .replace(/(\s|^)?\.(\s|\r?\n)/g, function(_matchStr, spaceBefore, spaceAfter, _offset, _origStr){//<- "revert" dots that were converted by the recognizer back to the word (and process them uniformly with "rule" below)
                spaceBefore = spaceBefore || ' ';//may need to insert a space
                return spaceBefore + 'Punkt' + spaceAfter;
              });

        //if "Punkt" is last word, then replace it too
        str = str.replace(/\s?\bPunkt\b(\s|\r|\n)*$/igm, '.');

        return str;
    }

    /**
     * [_insertText description]
     * @param  text [description]
     * @param  newStr [description]
     * @param  selection [description]
     * @return an array with 2 entries: first with appended newText, second with rest of text
     */
    _insertText(text: string, newStr: string, selection: InputSelection): Array<string> {

      const tlen = text.length;
      let start: number = selection.start;
      //ignore leading whithespace of newText, if it would introduce 2 consecutive space chars
      if(text[start-1] === ' ' && newStr[0] === ' '){
        newStr = newStr.substring(1);
      }
      const end = selection.end;
      let newText: string = (start > 0? text.substring(0, start) : '') + newStr;
      const rest = (tlen > end? text.substring(end) : '');

      //add whitespace if REST starts with a letter or number
      if(rest && /^\w|\d/.test(rest)){
        newText += ' ';
      }

      if(this._debug) console.log('_inserted ',[newStr, rest], ''+(!newStr? new Error().stack.replace(/Error\*/i, '') : ''));

      return [newText, rest];
    }

    _getTargetIndex(): number {
      if(this.selection && this.selection.index > -1){
        return this.selection.index;
      }
      return this.result.length;
    }
}

export interface DictationTarget {
  /** the identifier for the dictation target:
   *  must be unique w.r.t. active dictation targets
   *
   *  (i.e. usually only the dictation targets for the current page/view)
   */
  id: string;
  /** the text-input (<input> or <textarea>) for this dictation target */
  input?: GuiElement;
  /** GUI control for starting/stopping dictation to this target */
  ctrl?: GuiElement;


  //TODO remove? NOTE container and fieldName are still used in SelectionUtil... replace by getter?
  /** containing object of the target field that will receive dictation results (NOTE must also specify fieldName) */
  container?: any;
  /** the name of the target field (within the container) that will receive dictation results (NOTE must also specify container) */
  fieldName?: string;
  /** an optional observable for tracking changes in input
   *  (e.g. when specifying target via container & fieldName)
   *
   *  NOTE:
   *  if not specified, speech input will not be able to be aware of changes made by other input types e.g. keyboard
   */
  onInputChange?: Observable<string>;
  /**
   * custom handler for applying text of the speech recognition to the input field/textara control
   *
   *  If not specified, the default mechanism is (and if container is specified) to set the <code>container[fieldName]</code> with the ASR result value.
   *  If container & fieldName are not specified, the (native) text field value is updated with the new value.
   */
  applyRecognition?: (newText: string, targetId: string) => void;

  /** alternative for specifying target via container & fieldName:
   *  if sepcified, uses the form's <code>valueChanges</code> observable for tracking input changes
   *  (i.e. <code>onInputChange</code> will be ignored, if specified), and handles <code>applyRecognition</code>
   *  (this may be overriden, by explicitly specifying the <code>applyRecognition</code> handler).
   *
   *  NOTE: should not be used in combination with <code>container</code> and <code>fieldName</code>
   */
  form?: FormControl;
}
