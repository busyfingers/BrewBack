import Database from 'better-sqlite3';
import * as config from '../config/config';
import { DatabaseConfig } from '../types';
import * as logHelper from '../helpers/logHelper';
import * as path from 'path';
import * as fs from 'fs';

const logger = logHelper.getLogger('application');

let _db: Database.Database | null = null;

/**
 * Get or create the database connection (singleton pattern)
 */
const getDatabase = function (): Database.Database {
  if (_db) {
    return _db;
  }

  const dbConfig = config.getDatabaseConfig();
  const dbPath = path.resolve(__dirname, '../../src/', dbConfig.databasePath);

  // Ensure the directory exists
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    logger.info(`Created directory for database: ${dir}`);
  }

  _db = new Database(dbPath);
  _db.pragma('foreign_keys = ON');
  logger.info(`Connected to SQLite database: ${dbPath}`);

  return _db;
};

/**
 * Close the database connection
 */
const closeDatabase = function (): void {
  if (_db) {
    _db.close();
    _db = null;
    logger.info('Database connection closed');
  }
};

/**
 * Check if database is connected
 */
const isConnected = function (): boolean {
  return _db !== null;
};

export { getDatabase };
export { closeDatabase };
export { isConnected };
