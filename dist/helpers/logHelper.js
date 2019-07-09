"use strict";
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
const winston = __importStar(require("winston"));
const winston_daily_rotate_file_1 = __importDefault(require("winston-daily-rotate-file"));
const dateHelpers = __importStar(require("./dateHelpers"));
const { combine, timestamp, printf } = winston.format;
const myFormat = printf(({ level, message, timestamp }) => {
    return `${timestamp} [${level.toUpperCase()}]: ${message}`;
});
const getLogger = function (name) {
    const rotationTransport = new winston_daily_rotate_file_1.default({
        filename: `logs/${name}-%DATE%.log`,
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '14d'
    });
    return winston.createLogger({
        level: 'debug',
        format: combine(timestamp({ format: dateHelpers.getCurrentTimeStamp() }), myFormat),
        defaultMeta: { service: 'user-service' },
        transports: [rotationTransport, new winston.transports.Console()]
    });
};
exports.getLogger = getLogger;
