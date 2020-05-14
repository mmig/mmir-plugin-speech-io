"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionUtil = void 0;
var SubscriptionUtil = /** @class */ (function () {
    function SubscriptionUtil() {
    }
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
    SubscriptionUtil.subscribe = function (eventEmitter, subscriptions, handler) {
        var speechSubs = new Map();
        subscriptions.forEach(function (name) {
            speechSubs.set(name, eventEmitter[name].subscribe(function () {
                //DEBUG
                // let args = arguments.length === 1? arguments[0] : (arguments.length? arguments.length : void(0));
                // console.log(name +' -> ', args);
                if (handler[name]) {
                    handler[name].apply(handler, arguments);
                }
                else {
                    console.warn('No function "' + name + '" in View available!');
                }
            }));
        });
        return speechSubs;
    };
    SubscriptionUtil.unsubscribe = function (speechEventSubscriptions) {
        speechEventSubscriptions.forEach(function (subscription) {
            if (subscription && !subscription.closed) {
                subscription.unsubscribe();
            }
        });
    };
    return SubscriptionUtil;
}());
exports.SubscriptionUtil = SubscriptionUtil;
//# sourceMappingURL=SubscriptionUtil.js.map