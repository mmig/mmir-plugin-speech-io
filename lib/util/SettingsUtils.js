"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PersistentAppSettingsConfig = exports.AppSettingsConfig = exports.SettingsChange = void 0;
var rxjs_1 = require("rxjs");
var SettingsChange = /** @class */ (function () {
    function SettingsChange(propertyName, newValue, oldValue) {
        this.propertyName = propertyName;
        this.newValue = newValue;
        this.oldValue = oldValue;
    }
    return SettingsChange;
}());
exports.SettingsChange = SettingsChange;
/**
 * creates an IAppSettings wrapper for mmir.ConfigurationManager
 * @param  mmirConf the configuartion manager instance
 */
var AppSettingsConfig = /** @class */ (function () {
    function AppSettingsConfig(configService) {
        this.init(configService);
    }
    AppSettingsConfig.prototype.init = function (configService) {
        var _this = this;
        this.onChangeSubject = new rxjs_1.Subject();
        if (configService.mmir) {
            this.conf = configService.ready().then(function (mmirService) {
                _this._conf = mmirService.mmir.conf;
                return _this._conf;
            });
        }
        else {
            this.conf = Promise.resolve(configService);
        }
        this.conf.then(function () {
            _this.onChangeListener = function (newValue, oldValue, propertyPath) {
                _this.onChangeSubject.next(new SettingsChange(propertyPath.join('.'), newValue, oldValue));
            };
            _this._conf.on(_this.onChangeListener);
        });
    };
    AppSettingsConfig.prototype.get = function (key) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.conf.then(function (c) { return c.get([key]); })];
            });
        });
    };
    AppSettingsConfig.prototype.set = function (key, value) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.conf.then(function (c) { return c.set([key], value); })];
            });
        });
    };
    AppSettingsConfig.prototype.remove = function (key) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.set(key, null)];
            });
        });
    };
    AppSettingsConfig.prototype.onChange = function () {
        return this.onChangeSubject.asObservable();
    };
    AppSettingsConfig.prototype.destroy = function () {
        if (this.onChangeListener && this._conf) {
            this._conf.off(this.onChangeListener);
            this.onChangeListener = null;
        }
        if (this.onChangeSubject) {
            this.onChangeSubject.complete();
        }
    };
    return AppSettingsConfig;
}());
exports.AppSettingsConfig = AppSettingsConfig;
/**
 * creates an IAppSettings wrapper for `localStorage` with fallback for mmir.ConfigurationManager:
 * `get()` will first check `localStorage` and if there is no value, lookup the value in the
 * configuration manager.
 *
 * By default `get()` will parse retrieved values as JSON objects, and `set()`
 * will convert values to their JSON string representation.
 *
 * The other functions `set()` and `remove()` will directly access `localStorage`
 *
 * @param  mmirConf the configuartion manager instance
 */
var PersistentAppSettingsConfig = /** @class */ (function (_super) {
    __extends(PersistentAppSettingsConfig, _super);
    function PersistentAppSettingsConfig(configService) {
        return _super.call(this, configService) || this;
    }
    PersistentAppSettingsConfig.prototype.get = function (key, preventJsonParsing) {
        return __awaiter(this, void 0, void 0, function () {
            var val;
            var _this = this;
            return __generator(this, function (_a) {
                val = localStorage.getItem(key);
                if (val !== null) {
                    return [2 /*return*/, preventJsonParsing ? Promise.resolve(val) : this._fromJSON(val)];
                }
                return [2 /*return*/, this.conf.then(function (c) { return preventJsonParsing ? Promise.resolve(c.get([key])) : _this._fromJSON(c.get([key])); })];
            });
        });
    };
    PersistentAppSettingsConfig.prototype.set = function (key, value, preventJsonConversion) {
        return __awaiter(this, void 0, void 0, function () {
            var oldValue, promise;
            var _this = this;
            return __generator(this, function (_a) {
                oldValue = localStorage.getItem(key);
                promise = (preventJsonConversion ? Promise.resolve(value) : this._toJSON(value)).then(function (json) { return localStorage.setItem(key, json); });
                return [2 /*return*/, promise.then(function () {
                        if (oldValue && !preventJsonConversion) {
                            try {
                                oldValue = JSON.parse(oldValue);
                            }
                            catch (_err) { }
                        }
                        _this.onChangeSubject.next(new SettingsChange(key, value, oldValue));
                    })];
            });
        });
    };
    PersistentAppSettingsConfig.prototype.remove = function (key) {
        return __awaiter(this, void 0, void 0, function () {
            var oldValue, promise;
            var _this = this;
            return __generator(this, function (_a) {
                oldValue = localStorage.getItem(key);
                promise = Promise.resolve(localStorage.removeItem(key));
                return [2 /*return*/, promise.then(function () {
                        _this.onChangeSubject.next(new SettingsChange(key, void (0), oldValue));
                    })];
            });
        });
    };
    PersistentAppSettingsConfig.prototype._fromJSON = function (val) {
        if (!val) {
            return Promise.resolve(val);
        }
        return new Promise(function (resolve, reject) {
            try {
                resolve(JSON.parse(val));
            }
            catch (err) {
                reject(err);
            }
        });
    };
    PersistentAppSettingsConfig.prototype._toJSON = function (val) {
        if (!val) {
            return Promise.resolve(val);
        }
        return new Promise(function (resolve, reject) {
            try {
                resolve(JSON.stringify(val));
            }
            catch (err) {
                reject(err);
            }
        });
    };
    return PersistentAppSettingsConfig;
}(AppSettingsConfig));
exports.PersistentAppSettingsConfig = PersistentAppSettingsConfig;
//# sourceMappingURL=SettingsUtils.js.map