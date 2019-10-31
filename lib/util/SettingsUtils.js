"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function createConfigSettingsImpl(mmirConf) {
    return {
        _conf: mmirConf,
        get: function (key) {
            return Promise.resolve(this._conf.get(key));
        },
        set: function (key, value) {
            return Promise.resolve(this._conf.set(key, value));
        },
        remove: function (key) {
            return this.set(key, null);
        }
    };
}
exports.createConfigSettingsImpl = createConfigSettingsImpl;
//# sourceMappingURL=SettingsUtils.js.map