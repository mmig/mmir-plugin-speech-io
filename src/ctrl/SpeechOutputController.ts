
import { Subscription } from 'rxjs';

import { PromptReader } from '../io/PromptReader';

import { SubscriptionUtil } from '../util/SubscriptionUtil';
import { ReadingOptions , StopReadingOptions } from '../typings/mmir-base-dialog.d';
import { SpeechEventName } from '../typings/mmir-ext-dialog.d';
import { MmirService } from '../mmir-service';

export class SpeechOutputController {

  protected _debugMsg: boolean = false;

  protected _speechEventSubscriptions: Map<SpeechEventName, Subscription>;

  public get debug(): boolean { return this._debugMsg; }
  public set debug(value: boolean) {
    this._debugMsg = value;
  }

  constructor(
    protected prompt: PromptReader,
    // protected subsUtil: SubscriptionUtil,
    mmirProvider: MmirService<any>
  ) {

    mmirProvider.ready().then(_mmirp => {

      // const mmir = _mmirp.mmir;
      this._speechEventSubscriptions = SubscriptionUtil.subscribe(mmirProvider.speechEvents, ['read'], this);

    });
  }

  public destroy() {
    SubscriptionUtil.unsubscribe(this._speechEventSubscriptions);
  }

  ////////////////////////////////////////// Speech Output Event Handlers ///////////////////////


  /**
   * Called when text should should be read.
   *
   * When reading starts, the function must trigger the "reading-started" event:
   *
   * <pre>
   * mmir.speechioManager.raise('reading-started')
   * </pre>
   *
   * After reading the text (or an error occured, preventing to read the text),
   * the function must trigger the "reading-stopped" event:
   *
   * <pre>
   * mmir.speechioManager.raise('reading-stopped')
   * </pre>
   *
   *
   * @param  {string|ReadingOptions} data the data for determining the text the should be read
   *                                      (if string: corresponds to the ReadingOptions.dialogId)
   *
   * @returns {void|boolean} if data.test === true, the function return TRUE, if the
   *                            reading-request is valid (e.g. if reading is context-sensitive)
   */
  public read(data: string|ReadingOptions): void | boolean {

    if(this._debugMsg){

      console.log('read -> ', data);

      if(!this.prompt.handler){
        console.warn('SpeechOutputController.read(): no IPromptHandler set!');
      }
    }

    let isConsumed = false;
    let isTest = false;
    let promptText: string | Array<string>;
    if(typeof data !== 'string'){

      isTest = data.test;

      if(!this.prompt.handler || this.prompt.handler.willReadPrompt(data.contextId, data.readingId)){

        if(isTest){
          return true;/////////////////// EARYL EXIT ///////////////////
        }

        if(this.prompt.handler){
          promptText = this.prompt.handler.preparePrompt(data);
        } else {
          promptText = this.getText(data);
        }

        isConsumed = !!((Array.isArray(promptText) && promptText.length > 0) || promptText);
      }

    } else {

      promptText = data;
      isConsumed = !!((Array.isArray(promptText) && promptText.length > 0) || promptText);
    }

    if(isConsumed && !isTest){
      this.prompt.readPrompt(promptText);
    }

    if(!isConsumed && !isTest){
      console.error('read: unknown read target ', data);
      const readData: StopReadingOptions = data && typeof data === 'object'? Object.assign({active: false, contextId: ''}, data) : {active: false, contextId: ''};
      this.prompt.stoppedPrompt(readData);
    }

    return false;
  }

  protected getText(data: ReadingOptions): string | Array<string> {
    if(data && data.readingData){
      return data.readingData.promptText;
    }
    return null;
  }

}
