import { Subscription } from 'rxjs';
import { SpeechEventName, SpeechEventEmitter } from '../typings/mmir-ext-dialog.d';
export declare class SubscriptionUtil {
    static subscribe(eventEmitter: SpeechEventEmitter<any>, subscriptions: Array<SpeechEventName>, handler: any): Map<SpeechEventName, Subscription>;
    static unsubscribe(speechEventSubscriptions: Map<SpeechEventName, Subscription>): void;
}
