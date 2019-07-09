/**
 * Module dependencies
 */
import * as winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import * as dateHelpers from './dateHelpers';

const { combine, timestamp, printf } = winston.format;

const myFormat = printf(({ level, message, timestamp }) => {
    return `${timestamp} [${level.toUpperCase()}]: ${message}`;
});

const getLogger = function(name: string) {
    const rotationTransport = new DailyRotateFile({
        filename: `logs/${name}-%DATE%.log`,
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '14d'
    });

    return winston.createLogger({
        level: 'debug',
        format: combine(timestamp({ format: dateHelpers.getCurrentTimeStamp() }), myFormat), // TODO: getCurrentTimeStamp -> getCurrentTimeStamp()   OK?
        defaultMeta: { service: 'user-service' },
        transports: [rotationTransport, new winston.transports.Console()]
    });
};

export { getLogger };
