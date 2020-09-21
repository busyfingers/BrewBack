import { DatabaseConfig, PoolConfig } from '../types';
import * as fs from 'fs';
import * as path from 'path';

let poolConfig = {} as PoolConfig;
let databaseConfig = {} as DatabaseConfig;
let batchDataApiKey = '';

const setConfigValues = function () {
  const values = JSON.parse(fs.readFileSync(path.join(__dirname, '../config.json')).toString());
  poolConfig.size = values.dbPoolSize;
  poolConfig.getTimeout = values.dbPoolGetTimeout;
  poolConfig.retryInterval = values.dbPoolRetryInterval;
  databaseConfig.server = values.dbServer;
  databaseConfig.authentication = {
    type: 'default',
    options: {
      userName: values.dbUser,
      password: values.dbPass,
    },
  };
  databaseConfig.options = {
    database: values.dbName,
    useUTC: false,
  };
  batchDataApiKey = values.batchDataApiKey;
};

const getDatabaseConfig = function () {
  return {
    server: databaseConfig.server,
    authentication: databaseConfig.authentication,
    options: databaseConfig.options,
  };
};

export { setConfigValues };
export { getDatabaseConfig };
export { poolConfig };
export { batchDataApiKey };
