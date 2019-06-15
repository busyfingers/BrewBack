/**
 * Module dependencies
 */
const Connection = require('tedious').Connection;
const Request = require('tedious').Request;
const config = require('../config/config');
const logHelper = require('../helpers/logHelper');
const { getLocalISOString } = require('../helpers/dateHelpers');

const logger = logHelper.getLogger('application');
const _pool = [];
const db = {};

const READY = 0;
const BUSY = 1;

const tryAtMost = function(tries, executor) {
    --tries;
    return new Promise(executor).catch(err => (tries > 0 ? tryAtMost(tries, executor) : Promise.reject(err)));
};

db.initiateConnectionPool = async function() {
    const size = config.dbConnectionPool.poolSize;

    if (_pool.length > 0) {
        return; // we don't want to initialize more than once
    }

    for (let i = 0; i < size; i++) {
        const con = await connectToDb().catch(err => {
            logger.error(`Error connecting to db: ${err}`);
        });
        const poolItem = {
            connection: con,
            status: READY
        };
        _pool.push(poolItem);
    }

    if (_pool.length === 0) {
        throw new Error('Unable to initiate connection pool!');
    }
};

const getConnection = function() {
    return new Promise((resolve, reject) => {
        const limit = config.dbConnectionPool.getTimeout / config.dbConnectionPool.retryInterval;
        let attempts = 0;
        let connector = findAvailableConnector();

        if (connector) {
            return resolve(connector);
        }

        const interval = setInterval(_ => {
            attempts++;
            connector = findAvailableConnector();

            if (connector) {
                clearInterval(interval);
                return resolve(connector);
            }

            if (attempts >= limit) {
                clearInterval(interval);
                return reject();
            }
        }, config.dbConnectionPool.retryInterval);
    });
};

const findAvailableConnector = function() {
    for (let i = 0; i < _pool.length; i++) {
        if (_pool[i].status == READY) {
            _pool[i].status = BUSY;
            return { id: i, connection: _pool[i].connection };
        }
    }
    return null;
};

const releaseConnection = function(id) {
    // Call this fire-and-forget style since waiting for the release slows down processing
    _pool[id].connection.reset(async err => {
        if (err) {
            logger.error(`Error resetting connection ${id}: ${err}`);
            // _pool[id].connection = await connectToDb().catch(err => {
            // logger.error(`Error connecting to db: ${err}`);
            // });
        }
        _pool[id].status = READY;
    });
};

const connect = function(resolve, reject) {
    const dbConfig = config.getDatabaseConfig();
    const connection = new Connection(dbConfig);

    connection.on('connect', function(err) {
        if (err) {
            reject(err);
        } else {
            logger.info('Connected to DB');
            resolve(connection);
        }
    });
};

const connectToDb = function() {
    return new Promise((resolve, reject) => {
        tryAtMost(3, connect)
            .then(connection => {
                resolve(connection);
            })
            .catch(err => {
                logger.error(`Unable to connect to database: ${err}`);
                reject(err);
            });
    });
};

db.execQuery = function(query, params) {
    return new Promise((resolve, reject) => {
        const result = [];
        getConnection()
            .then(poolItem => {
                const request = new Request(query, async function(err, rowCount, rows) {
                    releaseConnection(poolItem.id);

                    if (err) {
                        logger.error(err);
                        reject(err);
                    } else {
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

                if (params) {
                    params.forEach(param => {
                        request.addParameter(param.name, param.type, param.value);
                    });
                }

                request.on('row', function(columns) {
                    const row = {};
                    columns.forEach(function(column) {
                        if (column.value !== null) {
                            // Datetimes are stored in local time, built-in toString() converts them to UTC
                            if (Object.prototype.toString.call(column.value) === '[object Date]') {
                                row[column.metadata.colName] = getLocalISOString(column.value);
                            } else {
                                row[column.metadata.colName] = column.value;
                            }
                        }
                    });
                    result.push(row);
                });

                poolItem.connection.execSql(request);
            })
            .catch(err => {
                reject(err);
            });
    });
};

module.exports = db;
