import { DatabaseConfig, PoolConfig } from '../types';
import * as fs from 'fs';
import * as path from 'path';

let poolConfig = {} as PoolConfig;
let databaseConfig = {} as DatabaseConfig;
let batchDataApiKey = '';

const setConfigValues = function () {
  const values = JSON.parse(fs.readFileSync(path.join(__dirname, '../../src/config.json')).toString());
  poolConfig.size = values.dbPoolSize;
  poolConfig.getTimeout = values.dbPoolGetTimeout;
  poolConfig.retryInterval = values.dbPoolRetryInterval;
  databaseConfig.databasePath = values.dbPath;
  batchDataApiKey = values.batchDataApiKey;
};

const getDatabaseConfig = function () {
  return {
    databasePath: databaseConfig.databasePath,
  };
};

export { setConfigValues };
export { getDatabaseConfig };
export { poolConfig };
export { batchDataApiKey };
