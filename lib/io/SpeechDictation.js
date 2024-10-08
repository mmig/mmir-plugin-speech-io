"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrentInputData = exports.DictationHandler = exports.DictationTargetHandler = exports.UNSTABLE_RESULT_HTML_SUFFIX = exports.UNSTABLE_RESULT_HTML_PREFIX = void 0;
var consts_1 = require("../consts");
var Utils_1 = require("../util/Utils");
exports.UNSTABLE_RESULT_HTML_PREFIX = '<span class="unstable">';
exports.UNSTABLE_RESULT_HTML_SUFFIX = '</span>';
var DictationTargetHandler = /** @class */ (function () {
    function DictationTargetHandler() {
        this.targets = new Map();
    }
    DictationTargetHandler.prototype.get = function (id) {
        return this.targets.get(id);
    };
    DictationTargetHandler.prototype.has = function (id) {
        return this.targets.has(id);
    };
    DictationTargetHandler.prototype.put = function (id, el) {
        this.targets.set(id, el);
    };
    DictationTargetHandler.prototype.delete = function (elem) {
        var id = typeof elem === 'string' ? elem : elem.id;
        return this.targets.delete(id);
    };
    DictationTargetHandler.prototype.reset = function () {
        if (this.targets.size > 0) {
            this.targets.forEach(function (handler) {
                handler.destroy();
            });
            this.targets.clear();
        }
    };
    DictationTargetHandler.prototype.apply = function (func) {
        if (this.targets.size > 0) {
            this.targets.forEach(func);
        }
    };
    DictationTargetHandler.prototype.destroy = function () {
        this.reset();
    };
    return DictationTargetHandler;
}());
exports.DictationTargetHandler = DictationTargetHandler;
var DictationHandler = /** @class */ (function () {
    // set activationCtrl(value: HTMLElement) { this.target.ctrl = value; }
    function DictationHandler(id, selectUtil) {
        this.id = id;
        this.selectUtil = selectUtil;
        this._debug = false;
        this.selectionMode = 'unstable';
        this._inputData = new CurrentInputData(); //TODO lazy-create?
        this._inputData._debug = this._debug;
    }
    Object.defineProperty(DictationHandler.prototype, "debug", {
        get: function () { return this._debug; },
        set: function (value) {
            this._debug = value;
            this._inputData._debug = value;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(DictationHandler.prototype, "activationCtrl", {
        get: function () { return this.nativeCtrl; },
        enumerable: false,
        configurable: true
    });
    DictationHandler.prototype.setInputTarget = function (textfield) {
        this.textfield = textfield;
        var textEl = (0, Utils_1.getHtmlElement)(textfield);
        this.nativeInput = textEl;
        var tagType = textEl.tagName;
        this.isPlainText = tagType === 'TEXTAREA' || tagType === 'INPUT' ? true : false;
        this.isTextInputEl = tagType === 'INPUT' ? true : false;
        this.isIntegerInput = this.getData('accept') === 'integer' || this.getData('accepts') === 'integer'; //FIXME should really be only "accept", but current on regisration-pages (PLZ field) "accepts" is used ...
        //FIXME need more elaborate detection: this should be true for Android (are there version where it is not needed? is it needed on iOS?
        this._isNeedFixFocus = this.isPlainText && false; //TODO: this._env.isCordovaEnv && !wik.tools.isAutoCompleteEl(textEl);//<- if Cordova-env, text-input element (but not for autocomplete widgets!)
        var sel = this.getInputSelection();
        this._inputData.selection = sel;
        if (sel) {
            this.setSelection(sel.start, sel.end);
        }
        //if native input element is "selectable" (i.e. native event support for selecting text)
        var selectable = this.isTextInputEl && /text|search|password|url|tel/i.test(textEl.type);
        //if input element can be selected (i.e. selection-marker can be applied: for non-text-input fields this is done by <span> elements)
        this.isNativeSelectable = !this.isTextInputEl || selectable;
        //if native text input element is "selectable" do init select change listener(s)
        if (this.isPlainText || selectable) {
            this.doInitSelectionChange();
        }
    };
    DictationHandler.prototype.doInitSelectionChange = function () {
        var self = this;
        this._selectionListener = function (event) {
            var sel = self.getInputSelection();
            if (!sel) {
                //do not need to continue, if position is at input-text's end
                if (this.dataset['MMMIR_PREV_SEL_START'] || this.dataset['MMMIR_PREV_SEL_END']) {
                    sel = self.getInputSelection(true);
                    if (sel) {
                        if (self._debug)
                            console.log('onselection[' + event.type + ']: selection changed to zero-length range (position) at ' + sel.start + ', resetting selection markers ');
                        self.setSelection(null);
                    }
                    //reset markers for previous position/selection
                    this.dataset['MMMIR_PREV_SEL_START'] = '';
                    this.dataset['MMMIR_PREV_SEL_END'] = '';
                }
                return; ///////////////// EARLY EXIT //////////////
            }
            var start = sel.start;
            var end = sel.end;
            var prevStart = parseInt(this.dataset['MMMIR_PREV_SEL_START'], 10);
            var prevEnd = parseInt(this.dataset['MMMIR_PREV_SEL_END'], 10);
            if (isFinite(prevStart) && isFinite(prevEnd)) {
                if (self._debug)
                    console.log('onselection: PREV [' + prevStart + ', ' + prevEnd + '], CURR ', sel);
                if (start === prevStart && end === prevEnd) {
                    //only need to continue, if selection has changed
                    return; ///////////////// EARLY EXIT //////////////
                }
            }
            if (self._debug)
                console.log('onselection[' + event.type + ']: selection/position changed ', sel);
            this.dataset['MMMIR_PREV_SEL_START'] = (start || '').toString();
            this.dataset['MMMIR_PREV_SEL_END'] = (end || '').toString();
            var idata = self._inputData;
            var text = idata.interim || idata.unstable ? idata.getCurrentText() + (self.selectionMode === 'interim' ? idata.interim : '') + idata.getRestText() : this.value;
            idata.set(text); //need to reset for new selection
            idata.selection = sel;
            self.setSelection(start, end);
        };
        this.nativeInput.addEventListener('select', this._selectionListener, false);
        this.nativeInput.addEventListener('keyup', this._selectionListener, false);
        this.nativeInput.addEventListener('click', this._selectionListener, false);
        this._focusListener = function (_event) {
            self.setSelection(null);
        };
        this.nativeInput.addEventListener('focus', this._focusListener, false);
    };
    DictationHandler.prototype.setCtrl = function (ctrl) {
        this.nativeCtrl = (0, Utils_1.getHtmlElement)(ctrl);
        this.nativeCtrl.classList.add(consts_1.DICTATION_CONTROL);
    };
    DictationHandler.prototype.initFromTarget = function (currentText, textChangeObservable) {
        var _this = this;
        if (currentText) {
            this._inputData.set(currentText, false);
        }
        this.onTextChangeSubs = textChangeObservable.subscribe(function (text) {
            if (_this._debug)
                console.log('onInputChange: ', text); //DEBUG
            _this._inputData.set(text, false);
        });
    };
    DictationHandler.prototype.setTargetRef = function (target) {
        this.target = target;
        if (target.input) {
            this.setInputTarget(target.input);
        }
        else {
            this.isPlainText = true;
        }
        if (target.ctrl) {
            this.setCtrl(target.ctrl);
        }
        if (target.form) {
            this.initFromTarget(target.form.value, target.form.valueChanges);
        }
        else if (target.onInputChange) {
            this.initFromTarget(this.getText(), target.onInputChange);
        }
    };
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
    DictationHandler.prototype.destroy = function (doNotResetActiveCss, keepDictationTarget) {
        if (this.asrResultSubs) {
            this.asrResultSubs.unsubscribe();
            this.asrResultSubs = null;
        }
        if (this.onTextChangeSubs) {
            this.onTextChangeSubs.unsubscribe();
            this.onTextChangeSubs = null;
        }
        if (this.target) {
            var isDestroyTarget = (typeof keepDictationTarget === 'string' && keepDictationTarget !== this.target.id) || keepDictationTarget !== this.target;
            if (isDestroyTarget && keepDictationTarget !== true) {
                // unlink all fields from DictationTarget, except `id`:
                for (var key in this.target) {
                    if (key === 'id') {
                        continue;
                    }
                    this.target[key] = void (0);
                }
            }
            // in any case: de-reference target from the handler itself
            this.target = null;
        }
        if (this._inputData) {
            this._inputData.reset();
        }
        if (this.nativeInput) {
            if (!doNotResetActiveCss) {
                this.nativeInput.classList.remove(consts_1.SPEECH_ACTIVE);
            }
            if (this._selectionListener) {
                this.nativeInput.removeEventListener('select', this._selectionListener, false);
                this.nativeInput.removeEventListener('keyup', this._selectionListener, false);
                this.nativeInput.removeEventListener('click', this._selectionListener, false);
                this._selectionListener = null;
            }
            if (this._focusListener) {
                this.nativeInput.removeEventListener('focus', this._focusListener, false);
                this._focusListener = null;
            }
        }
        if (this.nativeCtrl && !doNotResetActiveCss) {
            this.nativeCtrl.classList.remove(consts_1.SPEECH_ACTIVE);
        }
        this.textfield = null;
        this.nativeInput = null;
        this.nativeCtrl = null;
        // this.stableDictText = null;
    };
    DictationHandler.prototype.prepare = function () {
        // this.selectUtil.resetSelectionCalc();
    };
    DictationHandler.prototype.showDictationFeedback = function (display) {
        if (display) {
            var sel = this.getInputSelection();
            if (sel) {
                this.setSelection(sel.start, sel.end);
            }
        }
        else if (this.selectUtil) {
            this.selectUtil.resetSelectionCalc();
        }
    };
    DictationHandler.prototype.getInputSelection = function (includePosition) {
        if (this.isPlainText && this.nativeInput) {
            var input = this.nativeInput;
            var len = input.value.length;
            var start = input.selectionStart;
            if (len !== start || includePosition) {
                var end = input.selectionEnd;
                return { start: start, end: end };
            }
        }
        return null;
    };
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
    DictationHandler.prototype.setText = function (str, isCommitAutoComplete) {
        var text;
        var unstable;
        var rest;
        var _isAutoCompl = true;
        //normalize arguments
        if (typeof str !== 'string') {
            text = str.text;
            unstable = str.unstable;
            rest = str.rest;
            if (typeof str.isAutoComplete !== 'undefined') {
                // (and if present in 1st options-style argument)
                _isAutoCompl = str.isAutoComplete;
            }
            //append space, if there is an unstable part
            if (unstable && (!/\s$/igm.test(text))) {
                unstable = ' ' + unstable;
            }
            if (unstable) {
                text += unstable;
            }
            if (rest) {
                text += rest;
            }
        }
        else {
            text = str;
        }
        //the explicit 2nd argument overwrites options for isCommitAutoComplete, if it is present:
        _isAutoCompl = typeof isCommitAutoComplete !== 'undefined' ? isCommitAutoComplete : _isAutoCompl;
        if (_isAutoCompl && this.isAutocomplete()) {
            //trigger autocomplete FIXME this is still the old jQuery implementation:
            this.textfield.autocomplete('search', text);
        }
        var applied = false;
        if (this.target) {
            var form = this.target.form;
            if (this.target.applyRecognition) {
                this.target.applyRecognition(text, this.id);
                applied = true;
            }
            else if (form) {
                form.setValue(text, {
                    emitEvent: false
                });
                if (!form.dirty) {
                    form.markAsDirty();
                }
                applied = true;
            }
            else if (this.target.container) {
                this.target.container[this.target.fieldName] = text;
                applied = true;
            }
        }
        if (!applied && this.nativeInput) {
            if (this.isPlainText) {
                this.nativeInput.value = text;
            }
            else {
                if (unstable) {
                    text += exports.UNSTABLE_RESULT_HTML_PREFIX + unstable + exports.UNSTABLE_RESULT_HTML_SUFFIX;
                }
                this.nativeInput.innerHTML = text;
            }
        }
        if (this.nativeInput && this.isPlainText) {
            if (this.selectionMode === 'none') {
                this.setSelection(null); //TODO only clear, if there is currently a selection
            }
            else {
                if (this.selectionMode === 'interim' && typeof str !== 'string' && isFinite(str.interimIndex)) {
                    //select the interim (+ unstable) part of the string:
                    var selStart = str.interimIndex;
                    var selEnd = str.text.length + (unstable ? unstable.length : 0); //<- use the original text here (with appended unstable part);
                    this.setSelection(selStart, selEnd, text);
                }
                else if ((this.selectionMode === 'unstable' || this.selectionMode === 'interim') && unstable) {
                    //ASSERT if unstable => str is DisplayText
                    //select the unstable part of the string:
                    var selStart = str.text.length; //<- use the original text here (without appended unstable part)
                    var selEnd = selStart + unstable.length;
                    this.setSelection(selStart, selEnd, text);
                }
                else {
                    this.setSelection(null); //TODO only clear, if there is currently a selection
                }
            }
        }
    };
    DictationHandler.prototype.getText = function () {
        if (this.target) {
            if (this.target.form) {
                return this.target.form.value;
            }
            if (this.target.container) {
                return this.target.container[this.target.fieldName];
            }
        }
        if (this.isPlainText) {
            return this.nativeInput.value;
        }
        else {
            return this.nativeInput.textContent;
        }
    };
    DictationHandler.prototype.isAutocomplete = function () {
        if (typeof this._isAutocomplete === 'undefined') {
            this._isAutocomplete = this.isPlainText && false; //TODO: wik.tools.isAutoCompleteEl(this.textfield);
        }
        return this._isAutocomplete;
    };
    DictationHandler.prototype.getAutocompleteMenu = function () {
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
    };
    DictationHandler.prototype.isAutocompleteNoResult = function () {
        //FIXME impl.:
        // if(this.isAutocomplete()){
        // 	return this.textfield.autocomplete('widget').find('.ui-menu-item:visible .'+wik.NO_AUTOCOMPLETE_RESULTS_CLASS).length > 0;
        // }
        return false;
    };
    /**
     * HELPER: set state "system-initiated selection in progress"
     *
     * NOTE: some browsers fire a FOCUS event when text is selected, some do not
     * 		-> this HELPER sets a marker to the text-element, so that:
     *
     * isActive === true => $(text-element).data('isSystemSelection') === true
     * isActive === false => $(text-element).data('isSystemSelection') === FALSY
     */
    DictationHandler.prototype.setSysSel = function (isActive) {
        this.setData('isSystemSelection', !!isActive);
    };
    DictationHandler.prototype.isSysSel = function () {
        var isActive = this.getData('isSystemSelection');
        return isActive ? JSON.parse(isActive) : false;
    };
    DictationHandler.prototype.getData = function (field) {
        return this.nativeInput ? this.nativeInput.dataset[field] : void (0);
    };
    DictationHandler.prototype.setData = function (field, value) {
        if (this.nativeInput) {
            this.nativeInput.dataset[field] = JSON.stringify(value);
        }
    };
    DictationHandler.prototype.removeData = function (field) {
        if (this.nativeInput) {
            this.nativeInput.dataset[field] = ''; //NOTE do not really delete entries from a DOMStringMap, only "empty" them
            // delete this.nativeInput.dataset[field];
        }
    };
    /**
     * HELPER for fixing the issue, that some Android devices will "pull" focus to the input-element
     * 			when text is entered / a selection is made
     * @param isForce
     * @returns
     */
    DictationHandler.prototype.doSetUnfocused = function (isForce) {
        if (this.textfield && this.isPlainText && (this._isNeedFixFocus || isForce)) {
            if (document.activeElement === this.nativeInput || !document.activeElement) {
                var evt = new Event('blur', { bubbles: false });
                this.nativeInput.dispatchEvent(evt);
            }
        }
    };
    /**
     * HELPER for fixing the issue, that some Android devices will "pull" focus to the input-element
     * 			when text is entered / a selection is made
     * @param isForce
     * @returns
     */
    DictationHandler.prototype.isFocused = function (input) {
        input = input || this.nativeInput;
        if (input) {
            return input === document.activeElement;
        }
        return false;
    };
    /**
     * HELPER: set "system initiated" selection (see #setSysSel)
     *
     * IF arguments start and end are omitted -> select ALL
     *
     * setSelection() -> select all
     * setSelection(null) -> clear selection
     * setSelection(start: number, end: number, text?: string)
     */
    DictationHandler.prototype.setSelection = function (start, end, text) {
        if (!this.nativeInput) {
            return;
        }
        if (this.isPlainText) {
            if (start === null && this.selectUtil) {
                //clear visual selection (visible when text-element is not focused):
                this.selectUtil.clearSelectionMarker();
                return;
            }
            text = text || this.getText(); //<- get text without HTML tags/formatting (for text-field/area: the text is always plain)
            if (typeof start !== 'number') {
                start = 0;
            }
            if (typeof end !== 'number') {
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
            var input = this.nativeInput; //NOTE may also be a HTMLTextAreaElement, but here the difference does not matter
            var omitNativeSel = false;
            if (end <= start) {
                omitNativeSel = true;
            }
            else {
                //check if the this range is already selected
                var currStart = input.selectionStart;
                if (isFinite(currStart)) {
                    var currEnd = input.selectionEnd;
                    if (currEnd === end && currStart === start) {
                        if (this._debug)
                            console.info('already selected: [' + start + ',' + end + ']');
                        omitNativeSel = true;
                    }
                }
            }
            this.setSysSel(true);
            if (this._isNeedFixFocus) {
                input.disabled = true;
            }
            try {
                var applied = false;
                if (this.isNativeSelectable && this.isFocused(input)) {
                    //NOTE regarding focus & setSelectionRange():
                    //      in recent Chrome versions, setting a selection range will trigger select-events asynchronously
                    //     -> in case the actual text is set later applied to the native control than this selection is made
                    //          (which unfortunately is currently done when used in angular; see FIXME note below),
                    //          upon event-emitting, the selection will have changes to "end-cursor" range
                    //     -> then the _selectionListener() cannot determine correctly anymore, if the selection should be updated/cleared
                    //  -> WORKAROUND for now: do not set native selection, if element is not focused
                    if (!omitNativeSel) {
                        if (this._debug)
                            console.info('setSelection(' + start + ', ' + end + ')');
                        //FIX: the select-text and the actual text in the input may not (yet) be the same
                        //    -> prevent selection reset, by only selecting the maximal available text length
                        //FIXME should set selection when text is updated in control (e.g. by framework like angular), not directly when set by speech-recognition
                        var currLen = input.value.length;
                        if (end > currLen) {
                            end = currLen;
                        }
                        input.setSelectionRange(start, end);
                        applied = true;
                    }
                }
                else if (this.selectUtil) {
                    //set visual selection, even when text-element is not focused:
                    this.selectUtil.setSelectionMarker(input, start, end - start, text);
                    applied = true;
                }
                if (applied) {
                    input.dataset['MMMIR_PREV_SEL_START'] = '' + start;
                    input.dataset['MMMIR_PREV_SEL_END'] = '' + end;
                }
            }
            catch (err) {
                //setSelectionRange is not available for all <input> types!
                console.error('InputElement(id=' + (input ? input.id : 'NIL') + '): could not set selection [' + start + ',' + end + ']: ' + err);
            }
            if (this._isNeedFixFocus) {
                input.disabled = false;
            }
            this.setSysSel(false);
        }
        else {
            //else: if(this.isPlainText)
            text = text || this.getText(); //<- get text without HTML tags/formatting (for text-field/area: the text is always plain)
            var len = text.length;
            if (typeof start !== 'number' && typeof start !== 'number') {
                start = 0;
                end = len;
            }
            if (end <= start) {
                return;
            }
            text = (start > 0 ? text.substring(0, start) : '') + exports.UNSTABLE_RESULT_HTML_PREFIX +
                (start + 1 > end ? text.substring(start + 1, end) : '') + exports.UNSTABLE_RESULT_HTML_SUFFIX +
                (end + 1 > len ? text.substring(end + 1) : '');
            var input = this.nativeInput;
            input.innerHTML = text;
        }
    }; //END setSelection(){...}
    return DictationHandler;
}());
exports.DictationHandler = DictationHandler;
var CurrentInputData = /** @class */ (function () {
    function CurrentInputData() {
        this.result = [];
        this.interim = '';
        this.unstable = '';
        this.selection = null;
    }
    CurrentInputData.prototype.reset = function () {
        this.interim = '';
        this.unstable = '';
        this.result.splice(0, this.result.length);
    };
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
    CurrentInputData.prototype.set = function (text, isPreprocessText) {
        if (text === null || typeof text === 'undefined') {
            this.reset();
            return;
        }
        this.interim = '';
        this.unstable = '';
        if (isPreprocessText !== false) {
            text = this._processPunctuation(text);
        }
        this.result.splice(0, this.result.length, text);
    };
    CurrentInputData.prototype.getCurrentText = function () {
        // const len = this.result.length;
        if (this.selection) {
            var sel = this.selection.index;
            if (isFinite(sel)) {
                return this.result.slice(0, sel).join('');
            }
            else if (isFinite(this.selection.start)) {
                //-> not converted [star,end]-selection to index yet -> do this now by adding an empty-string into the current [star,end]-selection
                this._add('');
                if (this.selection && isFinite(this.selection.index)) {
                    return this.getCurrentText();
                }
            }
        }
        return this.result.join('');
    };
    CurrentInputData.prototype.getRestText = function () {
        // const len = this.result.length;
        if (this.selection) {
            var sel = this.selection.index;
            if (isFinite(sel)) {
                return this.result.slice(sel).join('');
            }
            else if (isFinite(this.selection.start)) {
                //-> not converted [star,end]-selection to index yet -> do this now by adding an empty-string into the current [star,end]-selection
                this._add('');
                if (isFinite(this.selection.index)) {
                    return this.getRestText();
                }
            }
        }
        return '';
    };
    /**
     * add an additional stable part to the current input
     *
     * @param {String} result
     * 			the (paritial but stable) result to add/append
     */
    CurrentInputData.prototype.add = function (result) {
        if (this._debug)
            console.log('add "' + result + '" -> ', this.result, ' ', this.selection);
        result = this._processPunctuation(result);
        var insertIndex = this._getTargetIndex();
        var beginsWithWhitespace = /^\s/ig.test(result);
        var prev;
        var isAddSpace = false, isToUpperCase = false;
        if (insertIndex > 0) {
            prev = this.result[insertIndex - 1];
            if (prev.length > 0) {
                //add space if previous String does not end with one
                // (and if the result itself does not begin with punctuation)
                if (!beginsWithWhitespace && !/\s$/ig.test(prev) && !/^[.,;?!:]/ig.test(result)) {
                    isAddSpace = true;
                }
                //make first Char to upper case, if previous ends with
                // new line or with a "sentence ending punctuation"
                if (/(^|[.?!])\s*$/ig.test(prev)) {
                    isToUpperCase = true;
                }
            }
        }
        else {
            //if it is the very first result:
            //  make first Char upper case
            isToUpperCase = /^/ig.test(result);
        }
        if (isToUpperCase) {
            result = result.replace(/^(\s*)(\w)(\w+)/ig, function (_m, s, ch, word) {
                return (s ? s : '') + ch.toUpperCase() + word;
            });
        }
        if (isAddSpace) {
            result = ' ' + result;
        }
        this._add(result);
    }; //END: add(result)
    CurrentInputData.prototype._add = function (result) {
        if (this.selection) {
            if (!isFinite(this.selection.index)) {
                //if there are more than 1 results -> join them into 1
                if (this.result.length > 1) {
                    var text = this.result.join('');
                    this.result.splice(0, this.result.length, text);
                }
                //insert into 1 result at the selection
                var inserted = this._insertText(this.result[0] || '', result, this.selection);
                //"convert" insertion:
                // * result[0]: text before selection-start
                // * result[1]: text after selection-end
                // * update this.selection.index, so that new results will be
                //   inserted between result[0] and result[1]
                this.result[0] = inserted[0];
                if (inserted[1]) {
                    this.result[1] = inserted[1];
                    this.selection.index = 1;
                }
                else {
                    //-> insertion was at the very end: continue by append text normally
                    this.selection = null;
                }
                return; ///////// EARLY EXIT /////////////
            }
        }
        this._addResult(result);
    };
    CurrentInputData.prototype._addResult = function (text) {
        var insertIndex = this.selection ? this.selection.index : -1;
        var res = this.result;
        var len = res.length;
        if (insertIndex === len || insertIndex < 0 || !isFinite(insertIndex)) {
            res.push(text);
        }
        else {
            //check, if a space should be appended to new text
            if (text[text.length - 1] !== ' ' && res[insertIndex][0] !== ' ' && !/^[.,;?!:]/ig.test(res[insertIndex])) {
                //if new text does not end with a space AND the next part does not start with one (or isn't punctuation) -> insert space
                text += ' ';
            }
            //increase array for new entry
            res.push('');
            //move entries at insertIndex and later up by 1:
            for (var i = len - 1; i >= insertIndex; --i) {
                res[i + 1] = res[i];
            }
            res[insertIndex] = text;
            ++this.selection.index;
        }
    };
    CurrentInputData.prototype._processPunctuation = function (text) {
        var str = text.replace(/\s?\bKomma\b/ig, ',')
            .replace(/\s?\bFrage ?zeichen\b/ig, '?')
            .replace(/\s?\bAusrufe ?zeichen\b/ig, '!')
            .replace(/\s?\bDoppelpunkt\b/ig, ':')
            .replace(/\s?\bSemikolon\b/ig, ';')
            .replace(/\s?\bAnführungs ?(zeichen|striche)\b/ig, '"')
            .replace(/\b(Binde|Gedanken) ?strich\b/ig, '-')
            .replace(/(\s|^)?\.(\s|\r?\n)/g, function (_matchStr, spaceBefore, spaceAfter, _offset, _origStr) {
            spaceBefore = spaceBefore || ' '; //may need to insert a space
            return spaceBefore + 'Punkt' + spaceAfter;
        });
        //if "Punkt" is last word, then replace it too
        str = str.replace(/\s?\bPunkt\b(\s|\r|\n)*$/igm, '.');
        return str;
    };
    /**
     * [_insertText description]
     * @param  text [description]
     * @param  newStr [description]
     * @param  selection [description]
     * @return an array with 2 entries: first with appended newText, second with rest of text
     */
    CurrentInputData.prototype._insertText = function (text, newStr, selection) {
        var tlen = text.length;
        var start = selection.start;
        //ignore leading whithespace of newText, if it would introduce 2 consecutive space chars
        if (text[start - 1] === ' ' && newStr[0] === ' ') {
            newStr = newStr.substring(1);
        }
        var end = selection.end;
        var newText = (start > 0 ? text.substring(0, start) : '') + newStr;
        var rest = (tlen > end ? text.substring(end) : '');
        //add whitespace if REST starts with a letter or number
        if (rest && /^\w|\d/.test(rest)) {
            newText += ' ';
        }
        if (this._debug)
            console.log('_inserted ', [newStr, rest], '' + (!newStr ? new Error().stack.replace(/Error\*/i, '') : ''));
        return [newText, rest];
    };
    CurrentInputData.prototype._getTargetIndex = function () {
        if (this.selection && this.selection.index > -1) {
            return this.selection.index;
        }
        return this.result.length;
    };
    return CurrentInputData;
}());
exports.CurrentInputData = CurrentInputData;
//# sourceMappingURL=SpeechDictation.js.map