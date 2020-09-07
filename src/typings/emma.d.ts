
import type { Emma , RecognitionEmma , UnderstandingEmma , TactileEmma , Cmd , EmmaFunction } from './';

export type EmmaFunctionType = 'recognition' | 'understanding' | 'gesture' | EmmaFunction;
export type AnyEmma<CmdImpl extends Cmd> = Emma | RecognitionEmma | UnderstandingEmma<CmdImpl> | TactileEmma;
export type RecognitionData = Array<any>;//really: argument-list of recognition-callback, see ASROnStatus
export type UnderstandingData = {semantic: any, phrase: string, phrases: Array<string>};

export interface EventLike {
  type: 'click' | 'speech' | string;
  [additionalFields: string]: any;
}
