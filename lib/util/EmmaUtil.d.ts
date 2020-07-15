import { Emma, RecognitionEmma, UnderstandingEmma, TactileEmma, SpeechRecognitionResult, Cmd } from '../typings/';
import { EventLike, AnyEmma, RecognitionData, UnderstandingData, EmmaFunctionType } from '../typings/';
import { ExtMmirModule } from '../typings/';
/**
 * @class
 *  @name Emma
 */
export declare class EmmaUtil<CmdImpl extends Cmd> {
    /** @memberOf Emma.prototype */
    toEmma(event: MouseEvent | TouchEvent | Emma | RecognitionEmma | UnderstandingEmma<CmdImpl> | EventLike, data?: any): RecognitionEmma | UnderstandingEmma<CmdImpl> | TactileEmma;
    isTactileEvent(emmaData: AnyEmma<CmdImpl>): boolean;
    isSpeechEvent(emmaData: AnyEmma<CmdImpl>): boolean;
    setSpeechRecognition(emmaData: AnyEmma<CmdImpl>, event: any, data: RecognitionData): void;
    setSpeechUnderstanding(emmaData: AnyEmma<CmdImpl>, event: any, data: UnderstandingData): void;
    addTarget(emmaData: AnyEmma<CmdImpl>, target: any, isOverwrite?: boolean): AnyEmma<CmdImpl>;
    addProperty(emmaData: AnyEmma<CmdImpl>, name: string, value: any, isOverwrite?: boolean): AnyEmma<CmdImpl>;
    getTarget(emmaData: AnyEmma<CmdImpl>): any;
    getProperty(emmaData: AnyEmma<CmdImpl>, name: string): any;
    _setEmmaFuncData(emmaEvent: AnyEmma<CmdImpl>, funcName: EmmaFunctionType, funcData: any, isOverwrite?: boolean): void;
    _extractAsrData(asrEmmaEvent: AnyEmma<CmdImpl>): SpeechRecognitionResult;
    _extractAllAsrData(asrEmmaEvent: AnyEmma<CmdImpl>): SpeechRecognitionResult[];
    _extractEmmaFuncData(emmaEvent: AnyEmma<CmdImpl>, func: EmmaFunctionType): any;
    static create<CmdImpl extends Cmd>(mmirCore: ExtMmirModule<CmdImpl>, deepCloneFunc?: Function): EmmaUtil<CmdImpl>;
}
