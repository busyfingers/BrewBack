/**
 * Module dependencies
 */
import { Request } from 'tedious';
import * as logHelper from '../helpers/logHelper';
import { getLocalISOString } from '../helpers/dateHelpers';
import * as pool from './connectionPool';
import { QueryParameter, RowResult } from '../types';

const logger = logHelper.getLogger('application');

const execQuery = function(query: string, params: Array<QueryParameter>) {
    return new Promise<RowResult[]>((resolve, reject) => {
        const result: Array<RowResult> = [];
        pool.getConnection()
            .then(connector => {
                const request = new Request(query, async function(err, rowCount, rows) {
                    pool.releaseConnection(connector.id);

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
                    const row: RowResult = {}; // as ResultRow;
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

                connector.connection.execSql(request);
            })
            .catch(err => {
                reject(err);
            });
    });
};

export { execQuery };
