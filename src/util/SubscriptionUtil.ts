
import { Subscription } from 'rxjs';
import { SpeechEventName , SpeechEventEmitter } from '../typings/mmir-ext-dialog.d';

export class SubscriptionUtil {

  // constructor(private mmir: ExtMmirModule<any>){}
  //
  //
  // public subscribe(subscriptions: Array<SpeechEventName>, handler: any): Map<SpeechEventName, Subscription> {
  //   return SubscriptionUtil.subscribe(this.mmir, subscriptions, handler);
  // }
  //
  // public unsubscribe(speechEventSubscriptions: Map<SpeechEventName, Subscription>): void {
  //   return SubscriptionUtil.unsubscribe(speechEventSubscriptions);
  // }

  public static subscribe(eventEmitter: SpeechEventEmitter<any>, subscriptions: Array<SpeechEventName>, handler: any): Map<SpeechEventName, Subscription> {
    const speechSubs: Map<SpeechEventName, Subscription> = new Map<SpeechEventName, Subscription>();
    subscriptions.forEach(name => {
      speechSubs.set(name, eventEmitter[name].subscribe(function() {
        //DEBUG
        // let args = arguments.length === 1? arguments[0] : (arguments.length? arguments.length : void(0));
        // console.log(name +' -> ', args);
        if(handler[name]){
          handler[name].apply(handler, arguments);
        } else {
          console.warn('No function "'+name+'" in View available!');
        }
      }));
    });
    return speechSubs;
  }

  public static unsubscribe(speechEventSubscriptions: Map<SpeechEventName, Subscription>): void {
    speechEventSubscriptions.forEach((subscription) => {
      if(subscription && !subscription.closed){
        subscription.unsubscribe();
      }
    });
  }

}
