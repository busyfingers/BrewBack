"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const morgan_1 = __importDefault(require("morgan"));
const passport_1 = __importDefault(require("passport"));
const passport_http_bearer_1 = require("passport-http-bearer");
const users = __importStar(require("./models/users"));
const temperatureRouter = __importStar(require("./routes/temperature"));
passport_1.default.use(new passport_http_bearer_1.Strategy((token, cb) => __awaiter(this, void 0, void 0, function* () {
    try {
        const user = yield users.getByToken(token);
        if (user) {
            return cb(null, user);
        }
        return cb(null, false);
    }
    catch (error) {
        return cb(error);
    }
})));
const app = express_1.default();
app.use(morgan_1.default('dev'));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: false }));
app.use(cookie_parser_1.default());
app.use('/api/temperature', temperatureRouter.default);
app.all('*', function (req, res) {
    res.sendStatus(404);
});
exports.default = app;
