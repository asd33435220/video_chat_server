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
        while (_) try {
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
var _this = this;
var WSocket = require('ws');
var wsMap = new Map();
var fnMap = new Map();
var wss = new WSocket.Server({ port: 8010 });
wss.on('connection', function (ws, request) {
    var code = String(Math.floor(Math.random() * (999999 - 100000)) + 100000);
    console.log("new connection room code: ".concat(code));
    wsMap.set(code, ws);
    ws.sendData = function (option) {
        ws.send(JSON.stringify(option));
    };
    ws.getResponse = function (option) {
        return new Promise(function (resolve) {
            setTimeout(function () {
                resolve('timeout');
            }, 1000);
            option.callbackId = Math.random().toString(36);
            fnMap.set(option.callbackId, function (data) {
                resolve(data);
            });
            ws.sendData(option);
        });
    };
    ws.on('message', function (message) { return __awaiter(_this, void 0, void 0, function () {
        var parsedMessage, event, data, callbackId, callId, fn, _a, offer, liveRoom, liveWs, answer, candidate, liveRoom, liveWs;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    try {
                        parsedMessage = JSON.parse(message);
                    }
                    catch (e) {
                        console.log('e', e);
                        return [2 /*return*/];
                    }
                    event = parsedMessage.event, data = parsedMessage.data, callbackId = parsedMessage.callbackId, callId = parsedMessage.callId;
                    if (callbackId && fnMap.has(callbackId)) {
                        fn = fnMap.get(callbackId);
                        fn(data);
                    }
                    _a = event;
                    switch (_a) {
                        case 'startLive': return [3 /*break*/, 1];
                        case 'getAnswer': return [3 /*break*/, 2];
                        case 'addCandidate': return [3 /*break*/, 6];
                    }
                    return [3 /*break*/, 7];
                case 1:
                    ws.sendData({ event: event, data: code, code: code, callId: callId });
                    return [3 /*break*/, 8];
                case 2:
                    offer = data.offer, liveRoom = data.code;
                    if (!!wsMap.has(liveRoom)) return [3 /*break*/, 3];
                    ws.sendData({ event: event, data: '不存在的直播间', code: code, callId: callId });
                    return [3 /*break*/, 5];
                case 3:
                    liveWs = wsMap.get(liveRoom);
                    return [4 /*yield*/, liveWs.getResponse({ code: liveRoom, event: 'offer2answer', data: offer })];
                case 4:
                    answer = _b.sent();
                    ws.sendData({ code: code, callId: callId, data: answer, event: event });
                    _b.label = 5;
                case 5: return [3 /*break*/, 8];
                case 6:
                    {
                        candidate = data.candidate, liveRoom = data.code;
                        if (!wsMap.has(liveRoom)) {
                            ws.sendData({ event: event, data: '不存在的直播间', code: code, callId: callId });
                        }
                        else {
                            liveWs = wsMap.get(liveRoom);
                            liveWs.sendData({ code: liveRoom, event: 'audienceCandidate', data: candidate });
                        }
                    }
                    _b.label = 7;
                case 7: return [3 /*break*/, 8];
                case 8: return [2 /*return*/];
            }
        });
    }); });
    ws._closeTimeout = function () {
        setTimeout(function () {
            ws.terminate();
        }, 10 * 60 * 1000);
    };
    ws.on('close', function () {
        wsMap["delete"](code);
        ws._closeTimeout();
    });
});
