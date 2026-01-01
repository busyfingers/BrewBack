import Database from 'better-sqlite3';
import * as config from '../config/config';
import { PoolItem, Connector } from '../types';
import * as logHelper from '../helpers/logHelper';
import * as path from 'path';
import * as fs from 'fs';

const READY = 0;
const BUSY = 1;
const logger = logHelper.getLogger('application');
const _pool: Array<PoolItem> = [];

const initiateConnectionPool = async function () {
  const size = config.poolConfig.size;

  if (_pool.length > 0) {
    return; // we don't want to initialize more than once
  }

  const dbConfig = config.getDatabaseConfig();
  // Resolve path relative to the project root where config.json is located
  const dbPath = path.resolve(__dirname, '../../src/', dbConfig.databasePath);

  // Ensure the database file exists
  if (!fs.existsSync(dbPath)) {
    logger.info(`Creating new SQLite database at: ${dbPath}`);
  }

  for (let i = 0; i < size; i++) {
    try {
      const db = new Database(dbPath);
      // Enable foreign keys
      db.pragma('foreign_keys = ON');
      const poolItem = {
        connection: db,
        status: READY,
      };
      _pool.push(poolItem);
    } catch (err) {
      const msg = `Error connecting to SQLite database: ${err}`;
      logger.error(msg);
      throw new Error(msg);
    }
  }

  if (_pool.length === 0) {
    throw new Error('Unable to initiate connection pool!');
  }

  logger.info(`SQLite connection pool initialized with ${_pool.length} connections`);
};

const getConnection = function () {
  return new Promise<Connector>((resolve, reject) => {
    const limit = config.poolConfig.getTimeout / config.poolConfig.retryInterval;
    let attempts = 0;
    let connector = findAvailableConnector();

    if (connector) {
      return resolve(connector);
    }

    const interval = setInterval((_) => {
      attempts++;
      connector = findAvailableConnector();

      if (connector) {
        clearInterval(interval);
        return resolve(connector);
      }

      if (attempts >= limit) {
        clearInterval(interval);
        return reject(new Error('Connection pool timeout - no available connections'));
      }
    }, config.poolConfig.retryInterval);
  });
};

const releaseConnection = function (id: number) {
  // SQLite connections don't need reset, just mark as ready
  _pool[id].status = READY;
};

const findAvailableConnector = function (): Connector | null {
  for (let i = 0; i < _pool.length; i++) {
    if (_pool[i].status == READY) {
      _pool[i].status = BUSY;
      return { id: i, connection: _pool[i].connection };
    }
  }
  return null;
};

export { initiateConnectionPool };
export { getConnection };
export { releaseConnection };
