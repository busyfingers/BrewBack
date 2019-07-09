"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Module dependencies
 */
const db = __importStar(require("../database/db"));
const tedious_1 = require("tedious");
const logHelper = __importStar(require("../helpers/logHelper"));
const logger = logHelper.getLogger('application');
const getByToken = function (token) {
    return __awaiter(this, void 0, void 0, function* () {
        const query = 'SELECT Name FROM Users WHERE Active = 1 AND Token = @Token';
        const params = [{ name: 'Token', type: tedious_1.TYPES.NVarChar, value: token }];
        try {
            const result = yield db.execQuery(query, params);
            if (result.length === 1) {
                return result[0];
            }
            return null;
        }
        catch (error) {
            logger.error(error);
            throw error;
        }
    });
};
exports.getByToken = getByToken;
