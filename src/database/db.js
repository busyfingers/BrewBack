/**
 * Module dependencies
 */
const Request = require('tedious').Request;
const logHelper = require('../helpers/logHelper');
const { getLocalISOString } = require('../helpers/dateHelpers');
const pool = require('./connectionPool');

const logger = logHelper.getLogger('application');
const db = {};

db.execQuery = function(query, params) {
    return new Promise((resolve, reject) => {
        const result = [];
        pool.getConnection()
            .then(poolItem => {
                const request = new Request(query, async function(err, rowCount, rows) {
                    pool.releaseConnection(poolItem.id);

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
