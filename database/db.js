const Connection = require('tedious').Connection;
const Request = require('tedious').Request;
const debug = require('debug')('brewback:db');
const config = require('../config/config');

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
            debug('Connected to DB');
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
                    debug(`Unable to connect to database: ${err}`);
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
                    debug(err);
                    reject(err);
                } else {
                    debug(`Query complete: '${query}'`);
                    debug(`Rows: ${rowCount}`);
                    resolve(result);
                }
            });

            if (params) {
                params.forEach(param => {
                    // debug(`param: ${param.name}`);
                    // debug(param.type);
                    // debug(`${param.value}`);
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
