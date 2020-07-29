import { Observable, Subscription } from 'rxjs';
import { RecognitionEmma, UnderstandingEmma, RecognitionType, SpeechRecognitionResult } from '../typings/';
import { EmmaUtil } from '../util/EmmaUtil';
import { DictationTargetHandler, DictationHandler, DictationTarget, CurrentInputData, SelectionMode } from '../io/SpeechDictation';
import { SelectionUtil } from '../util/SelectionUtil';
import { SpeechEventName, ExtMmirModule, SpeechIoManager } from '../typings/';
import { MmirService } from '../mmir-service';
export declare type RecognitionTypeExt = RecognitionType | 'RECOGNITION_ERROR';
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
export declare class SpeechInputController {
    protected mmirProvider: MmirService<any>;
    protected dictTargetHandler: DictationTargetHandler;
    protected _debugMsg: boolean;
    dictationResults: Observable<RecognitionEmma>;
    protected _speechEventSubscriptions: Map<SpeechEventName, Subscription>;
    protected _emma: EmmaUtil<any>;
    protected _manager: SpeechIoManager<any>;
    protected _mmir: ExtMmirModule<any>;
    protected _selectionUtil: SelectionUtil;
    protected _stopDictWord: string | {
        [languageId: string]: string;
    };
    /**stop-expression for stopping dictation-input*/
    protected _stopDictExpr: RegExp | {
        [languageId: string]: RegExp;
    };
    protected _cancelDictWord: string | {
        [languageId: string]: string;
    };
    protected _cancelDictExpr: RegExp | {
        [languageId: string]: RegExp;
    };
    debug: boolean;
    constructor(mmirProvider: MmirService<any>, dictTargetHandler: DictationTargetHandler);
    destroy(): void;
    createDictationTarget(target: DictationTarget, id: string, feedbackStyle?: SelectionMode): DictationHandler;
    setDictationCommand(stopCommandWord: string, cancelCommandWord?: string): void;
    protected doUpdateDictationCmd(): void;
    protected doUpdateDictationCmdRegExp(stopCmd: string | {
        [language: string]: string;
    }, cancelCmd: string | {
        [language: string]: string;
    }): Array<RegExp | {
        [language: string]: RegExp;
    }>;
    protected doTest(str: string, dictCmdExpr: RegExp | {
        [language: string]: RegExp;
    }): boolean;
    protected doTest(str: string, dictCmdExpr: RegExp | {
        [language: string]: RegExp;
    }, isRemove: true): string;
    /**
     * Called for processing dictated text.
     *
     * E.g. text could  be visualized/shown in GUI, and/or stored internally etc.
     *
     * @param  {RecognitionEmma} emma the EMMA event contain an ASR result(s) from
     *                                 speech recognition.
     */
    showDictationResult(asrEmmaEvent: RecognitionEmma): void;
    protected _processDictationResult(asrEmmaEvent: RecognitionEmma): RecognitionEmma;
    /**
     * Called for determining the understanding of an ASR result.
     *
     * E.g. apply a grammar to the ASR text, or keyword spotting, or some other
     * kind of "natural language understanding" (NLU).
     *
     * With the NLU result, this function should invoke
     * <pre>
     * InputManager.raise('speech', understandingResult);
     * </pre>
     * for the understood ASR, where understandingResult should have type UnderstandigResult.
     *
     * NOTE: for "not understood" ASR text, there could be a corresponding Command
     *       (i.e. calling InputManager.raise('speech', notUnderstoodCmd)) or some
     *       other form of feedback/processing should be triggered.
     *
     * @param  {RecognitionEmma} emma the EMMA event contain an ASR result(s) from
     *                                 speech recognition.
     */
    determineSpeechCmd(asrEmmaEvent: RecognitionEmma): void;
    /**
     * Called for "applying" an understood command.
     *
     * This function should select the "best" command(s) from semanticEmmaEvent and
     * execute it/them.
     *
     * When selecting / before executing, it should be checked, if the commands can
     * actually be executed.
     *
     * If no "best" command can be selected/executed, this function should instead invoke
     * a diambiguation dialog (when there are some potential, but no clear command candiates)
     * or a feedback should be triggerd, stating that there was no corresponding command
     * found for the user input.
     *
     * @param  {semanticEmmaEvent} emma the EMMA event contain an understanding result with a list
     *                                    understood Cmd(s)
     */
    execSpeechCmd(semanticEmmaEvent: UnderstandingEmma<any>): void;
    protected doHandleDictationResult(asrEmmaEvent: RecognitionEmma, inputElem: DictationHandler): void;
    protected _printCurrentInput(targetId: string, isCommitAutoComplete: boolean, inputElem: DictationHandler): void;
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
    protected _getCurrentInputText(targetId: string, isPlainText: boolean, isRemoveAllWhitespaces: boolean, isWithExtraUnstable: boolean, inputData?: CurrentInputData): DisplayText | string;
    protected _isEvalDictStopWord(asrEmmaEvent: RecognitionEmma): boolean;
    protected isDictAutoProceed(): boolean;
}
