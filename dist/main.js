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
var Dropbox = require('dropbox').Dropbox;
var fs = require('fs');
var core = require('@actions/core');
var glob = require('glob');
var refreshToken = core.getInput('DROPBOX_REFRESH_TOKEN');
var clientId = core.getInput('DROPBOX_APP_KEY');
var clientSecret = core.getInput('DROPBOX_APP_SECRET');
var globSource = core.getInput('GLOB');
var dropboxPathPrefix = core.getInput('DROPBOX_DESTINATION_PATH_PREFIX');
var isDebug = core.getInput('DEBUG');
function uploadMuhFile(filePath, dbx) {
    var fileContent = fs.readFileSync(filePath);
    var destinationPath = "" + dropboxPathPrefix + filePath;
    // random delay to avoid rate limiting
    var delay = Math.floor(Math.random() * 1000);
    if (isDebug)
        console.log('delaying for: ', delay);
    console.log("uploading file from " + filePath + " to Dropbox: " + destinationPath);
    return new Promise(function (resolve) {
        setTimeout(function () {
            resolve(dbx
                .filesUpload({ path: destinationPath, contents: fileContent })
                .then(function (response) {
                if (isDebug)
                    console.log(response);
                if (response.status !== 200) {
                    core.setFailed('File upload failed', response);
                }
                return response;
            })
                .catch(function (error) {
                console.error('Error uploading file:' + filePath, error);
                core.setfailed('Error uploading file', error);
                return error;
            }));
        }, delay);
    });
}
function refreshAccessToken(refreshToken, clientId, clientSecret) {
    return __awaiter(this, void 0, void 0, function () {
        var response, data;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fetch('https://api.dropboxapi.com/oauth2/token', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                        },
                        body: new URLSearchParams({
                            grant_type: 'refresh_token',
                            refresh_token: refreshToken,
                            client_id: clientId,
                            client_secret: clientSecret,
                        }),
                    })];
                case 1:
                    response = _a.sent();
                    return [4 /*yield*/, response.json()];
                case 2:
                    data = _a.sent();
                    return [2 /*return*/, data.access_token]; // 返回新的 access token
            }
        });
    });
}
glob(globSource, {}, function (err, files) { return __awaiter(void 0, void 0, void 0, function () {
    var accessToken, dbx, _i, files_1, file;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (err)
                    core.setFailed('Error: glob failed', err);
                return [4 /*yield*/, refreshAccessToken(refreshToken, clientId, clientSecret)];
            case 1:
                accessToken = _a.sent();
                console.log('access token refreshed:', accessToken);
                dbx = new Dropbox({ accessToken: accessToken });
                _i = 0, files_1 = files;
                _a.label = 2;
            case 2:
                if (!(_i < files_1.length)) return [3 /*break*/, 5];
                file = files_1[_i];
                return [4 /*yield*/, uploadMuhFile(file, dbx)];
            case 3:
                _a.sent();
                _a.label = 4;
            case 4:
                _i++;
                return [3 /*break*/, 2];
            case 5:
                console.log('all files have been uploaded');
                return [2 /*return*/];
        }
    });
}); });
