"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var consts_1 = require("../consts");
function createConfigSettingsImpl(mmirConf) {
    return {
        _conf: mmirConf,
        get: function (key) {
            return Promise.resolve(this._conf.get([consts_1.PLUGIN_ID, key]));
        },
        set: function (key, value) {
            return Promise.resolve(this._conf.set([consts_1.PLUGIN_ID, key], value));
        },
        remove: function (key) {
            return this.set(key, null);
        }
    };
}
exports.createConfigSettingsImpl = createConfigSettingsImpl;
//# sourceMappingURL=SettingsUtils.js.map