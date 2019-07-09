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
const tedious_1 = require("tedious");
const logHelper = __importStar(require("../helpers/logHelper"));
const dateHelpers_1 = require("../helpers/dateHelpers");
const pool = __importStar(require("./connectionPool"));
const logger = logHelper.getLogger('application');
const execQuery = function (query, params) {
    return new Promise((resolve, reject) => {
        const result = [];
        pool.getConnection()
            .then(connector => {
            const request = new tedious_1.Request(query, function (err, rowCount, rows) {
                return __awaiter(this, void 0, void 0, function* () {
                    pool.releaseConnection(connector.id);
                    if (err) {
                        logger.error(err);
                        reject(err);
                    }
                    else {
                        logger.info(`Query complete: '${query}'`);
                        if (params && params.length > 0) {
                            let msg = params.map(p => {
                                if (p.name !== 'Token') {
                                    // Don't log tokens
                                    return `${p.name}=${p.value}`;
                                }
                            });
                            logger.info(msg.join(', '));
                        }
                        logger.info(`Rows: ${rowCount}`);
                        resolve(result);
                    }
                });
            });
            if (params) {
                params.forEach(param => {
                    request.addParameter(param.name, param.type, param.value);
                });
            }
            request.on('row', function (columns) {
                const row = {}; // as ResultRow;
                columns.forEach(function (column) {
                    if (column.value !== null) {
                        // Datetimes are stored in local time, built-in toString() converts them to UTC
                        if (Object.prototype.toString.call(column.value) === '[object Date]') {
                            row[column.metadata.colName] = dateHelpers_1.getLocalISOString(column.value);
                        }
                        else {
                            row[column.metadata.colName] = column.value;
                        }
                    }
                });
                result.push(row);
            });
            connector.connection.execSql(request);
        })
            .catch(err => {
            reject(err);
        });
    });
};
exports.execQuery = execQuery;
