"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReadHandler = exports.ReadTargetHandler = void 0;
var Utils_1 = require("../util/Utils");
var consts_1 = require("../consts");
var ReadTargetHandler = /** @class */ (function () {
    function ReadTargetHandler() {
        this.targets = new Map();
    }
    ReadTargetHandler.prototype.get = function (id) {
        return this.targets.get(id);
    };
    ReadTargetHandler.prototype.tryGetAndPut = function (targetId, event) {
        var handler;
        if (typeof targetId === 'string') {
            handler = this.get(targetId);
        }
        if (!handler) {
            var elem = (0, Utils_1.getHtmlElement)(targetId, event);
            if (elem) {
                if (typeof targetId !== 'string') {
                    targetId = elem.id;
                }
                handler = new ReadHandler(targetId, elem);
                this.put(handler.id, handler);
            }
        }
        return handler;
    };
    ReadTargetHandler.prototype.has = function (id) {
        return this.targets.has(id);
    };
    ReadTargetHandler.prototype.put = function (id, el) {
        this.targets.set(id, el);
    };
    ReadTargetHandler.prototype.reset = function () {
        if (this.targets.size > 0) {
            this.targets.forEach(function (handler) { return handler.destroy(); });
            this.targets.clear();
        }
        this.activeHandler = null;
    };
    ReadTargetHandler.prototype.apply = function (func) {
        if (this.targets.size > 0) {
            this.targets.forEach(func);
        }
    };
    ReadTargetHandler.prototype.destroy = function () {
        if (this.activeHandler) {
            var handler = this.activeHandler;
            this.activeHandler = null;
            this.targets.delete(handler.id);
            handler.destroy();
        }
        this.reset();
    };
    return ReadTargetHandler;
}());
exports.ReadTargetHandler = ReadTargetHandler;
var ReadHandler = /** @class */ (function () {
    function ReadHandler(id, ctrl) {
        this.id = id;
        this.ctrl = ctrl;
        this.ctrl.classList.add(consts_1.READ_CONTROL);
    }
    ReadHandler.prototype.destroy = function () {
        this.ctrl = null;
    };
    return ReadHandler;
}());
exports.ReadHandler = ReadHandler;
//# sourceMappingURL=SpeechReading.js.map