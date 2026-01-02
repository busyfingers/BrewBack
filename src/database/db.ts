/**
 * Module dependencies
 */
import * as logHelper from '../helpers/logHelper';
import { getLocalISOString } from '../helpers/dateHelpers';
import { getDatabase } from './database';
import { QueryParameter, RowResult } from '../types';

const logger = logHelper.getLogger('application');

// Convert QueryParameter array to values array for SQLite
const getParamValues = function (params: Array<QueryParameter>): any[] {
  return params.map((p) => p.value);
};

// Get parameter types for logging
const getParamLogString = function (params: Array<QueryParameter>): string {
  if (!params || params.length === 0) return '';
  return params
    .map((p) => {
      if (p.name !== 'Token') {
        return `${p.name}=${p.value}`;
      }
      return `${p.name}=[REDACTED]`;
    })
    .join(', ');
};

// Check if value is a Date object
const isDate = (value: any): value is Date => {
  return value instanceof Date;
};

const execQuery = function (query: string, params: Array<QueryParameter>): Promise<RowResult[]> {
  return new Promise<RowResult[]>((resolve, reject) => {
    try {
      const db = getDatabase();
      const values = getParamValues(params);
      const stmt = db.prepare(query);
      const rows = stmt.all(...values) as RowResult[];

      // Transform results
      const result: Array<RowResult> = rows.map((row) => {
        const transformedRow: RowResult = {};
        for (const key in row) {
          const value = row[key];
          // Datetimes are stored in local time, convert to ISO string
          if (isDate(value)) {
            transformedRow[key] = getLocalISOString(value);
          } else {
            transformedRow[key] = value;
          }
        }
        return transformedRow;
      });

      logger.info(`Query complete: '${query}'`);
      if (params && params.length > 0) {
        logger.info(getParamLogString(params));
      }
      logger.info(`Rows: ${result.length}`);
      resolve(result);
    } catch (err: any) {
      logger.error(err);
      reject(err);
    }
  });
};

const execNonQuery = function (query: string, params: Array<QueryParameter>): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    try {
      const db = getDatabase();
      const values = getParamValues(params);
      const stmt = db.prepare(query);
      stmt.run(...values);

      logger.info(`Non-query complete: '${query}'`);
      if (params && params.length > 0) {
        logger.info(getParamLogString(params));
      }
      resolve();
    } catch (err: any) {
      logger.error(err);
      reject(err);
    }
  });
};

const execInsert = function (query: string, params: Array<QueryParameter>): Promise<number> {
  return new Promise<number>((resolve, reject) => {
    try {
      const db = getDatabase();
      const values = getParamValues(params);
      const stmt = db.prepare(query);
      const result = stmt.run(...values);

      logger.info(`Insert complete: '${query}'`);
      if (params && params.length > 0) {
        logger.info(getParamLogString(params));
      }
      // Return the last insert row id
      resolve(result.lastInsertRowid as number);
    } catch (err: any) {
      logger.error(err);
      reject(err);
    }
  });
};

export { execQuery };
export { execNonQuery };
export { execInsert };
