/**
 * Module dependencies
 */
const winston = require('winston');
require('winston-daily-rotate-file');
const dateHelpers = require('./dateHelpers');

const lib = {};

const { combine, timestamp, printf } = winston.format;

const myFormat = printf(({ level, message, timestamp }) => {
    return `${timestamp} [${level.toUpperCase()}]: ${message}`;
});

lib.getLogger = function(name) {
    const rotationTransport = new winston.transports.DailyRotateFile({
        filename: `${name}-%DATE%.log`,
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '14d'
    });

    return winston.createLogger({
        level: 'debug',
        format: combine(timestamp({ format: dateHelpers.getCurrentTimeStamp }), myFormat),
        defaultMeta: { service: 'user-service' },
        transports: [rotationTransport, new winston.transports.Console()]
    });
};

module.exports = lib;
