/**
 * Module dependencies
 */
import * as winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const { combine, timestamp, printf } = winston.format;

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
        format: combine(
            timestamp({
                format: 'YYYY-MM-DD HH:mm:ss'
            }),
            printf(info => `${info.timestamp} [${info.level.toUpperCase()}]: ${info.message}`)
        ),
        defaultMeta: { service: 'user-service' },
        transports: [rotationTransport, new winston.transports.Console()]
    });
};

export { getLogger };
