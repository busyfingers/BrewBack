/**
 * Module dependencies
 */
const Connection = require('tedious').Connection;
const Request = require('tedious').Request;
const config = require('../config/config');
const logHelper = require('../helpers/logHelper');

const logger = logHelper.getLogger('application');
let _connection = null;

const tryAtMost = function(tries, executor) {
    --tries;
    return new Promise(executor).catch(err => (tries > 0 ? tryAtMost(tries, executor) : Promise.reject(err)));
};

const connect = function(resolve, reject) {
    const dbConfig = config.getDatabaseConfig();
    _connection = new Connection(dbConfig);

    _connection.on('connect', function(err) {
        if (err) {
            reject(err);
        } else {
            logger.info('Connected to DB');
            resolve();
        }
    });
};

const getConnection = function() {
    return new Promise((resolve, reject) => {
        if (_connection !== null) {
            resolve(_connection);
        } else {
            tryAtMost(3, connect)
                .then(_ => {
                    resolve(_connection);
                })
                .catch(err => {
                    logger.error(`Unable to connect to database: ${err}`);
                    reject(err);
                });
        }
    });
};

const db = {
    execQuery(query, params) {
        return new Promise((resolve, reject) => {
            const result = [];
            const request = new Request(query, function(err, rowCount, rows) {
                if (err) {
                    logger.error(err);
                    reject(err);
                } else {
                    logger.info(`Query complete: '${query}'`);
                    if (params && params.length > 0) {
                        let msg = params.map(p => `${p.name}=${p.value}`);
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
                        row[column.metadata.colName] = column.value;
                    }
                });
                result.push(row);
            });

            getConnection()
                .then(con => {
                    con.execSql(request);
                })
                .catch(err => {
                    reject(err);
                });
        });
    }
};

module.exports = db;
