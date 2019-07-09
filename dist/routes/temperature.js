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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Module dependencies
 */
const express_1 = require("express");
const router = express_1.Router();
const db = __importStar(require("../database/db"));
const tedious_1 = require("tedious");
const passport_1 = __importDefault(require("passport"));
router.get('/', passport_1.default.authenticate('bearer', { session: false }), function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let queryBase = 'SELECT Value, MeasuredAt FROM dbo.Temperature WHERE ';
            let queryData = prepareQuery(queryBase, req.query);
            const result = yield db.execQuery(queryData.sqlQuery, queryData.parameters);
            res.send(result).status(200);
        }
        catch (err) {
            res.send(err).status(500);
        }
    });
});
router.post('/', passport_1.default.authenticate('bearer', { session: false }), function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const payloadIsValid = validatePayload(req.body);
            const measuredAt = new Date(req.body.measuredAt);
            if (!isValidDate(measuredAt)) {
                res.sendStatus(400);
                return;
            }
            if (payloadIsValid) {
                const sql = `INSERT INTO dbo.Temperature (Value, MeasuredAt) VALUES (@Value, @MeasuredAt)`;
                const params = [
                    // JS Number gets converted to int with TYPES.Decimal, so using string representation instead
                    { name: 'Value', type: tedious_1.TYPES.NVarChar, value: req.body.value.toFixed(2) },
                    { name: 'MeasuredAt', type: tedious_1.TYPES.DateTime, value: measuredAt }
                ];
                yield db.execQuery(sql, params);
                res.sendStatus(200);
            }
            else {
                res.sendStatus(400);
            }
        }
        catch (err) {
            res.send(err).status(500);
        }
    });
});
const prepareQuery = function (sql, querystring) {
    let params = [];
    if (Object.keys(querystring).length === 0 && querystring.constructor === Object) {
        sql += '1=1';
    }
    else {
        let whereClause = [];
        if (querystring.from) {
            whereClause.push('MeasuredAt >= @from');
            params.push({ name: 'from', type: tedious_1.TYPES.NVarChar, value: querystring.from });
        }
        if (querystring.to) {
            whereClause.push('MeasuredAt <= @to');
            params.push({ name: 'to', type: tedious_1.TYPES.NVarChar, value: querystring.to });
        }
        sql += whereClause.join(' AND ');
    }
    sql += ' ORDER BY MeasuredAt';
    return {
        sqlQuery: sql,
        parameters: params
    };
};
const validatePayload = function (data) {
    if (Object.keys(data).length === 0 && data.constructor === Object) {
        return false;
    }
    if (!data.value || !data.measuredAt) {
        return false;
    }
    if (typeof data.value !== 'number' || typeof data.measuredAt !== 'number') {
        return false;
    }
    return true;
};
const isValidDate = function (date) {
    return date instanceof Date && !isNaN(date.getTime());
};
exports.default = router;
