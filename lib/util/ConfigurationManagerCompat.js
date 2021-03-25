"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeConfigurationManagerCompat = void 0;
/**
 * HELPER add backwards support for `ConfigurationManager.on(..., emitOnAdding?: boolean )`
 *        (i.e. trigger listener with current value when adding listener and `emitOnAdding` is true)
 */
function makeConfigurationManagerCompat(config) {
    if (config.on.length === 2) {
        var newConfig = config;
        newConfig.__on = config.on;
        newConfig.on = function (propertyName, listener, emitOnAdding) {
            this.__on(propertyName, listener);
            if (propertyName && typeof propertyName !== 'function' && emitOnAdding) {
                // use empty string as "any change" event type:
                var path = typeof propertyName === 'string' ? propertyName.split('.') : propertyName;
                listener(this.get(path), void (0), path.join('.')); // NOTE convert path from new API argument format (string[]) to old format (dot-seprated string)
            }
        };
        // do replace alias, too:
        newConfig.addListener = newConfig.on;
        return newConfig;
    }
    return config;
}
exports.makeConfigurationManagerCompat = makeConfigurationManagerCompat;
//# sourceMappingURL=ConfigurationManagerCompat.js.map