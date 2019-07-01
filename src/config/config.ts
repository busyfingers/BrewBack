import { DatabaseConfig, PoolConfig } from '../types';
import * as fs from 'fs';
import * as path from 'path';

let poolConfig = {} as PoolConfig;
let databaseConfig = {} as DatabaseConfig;

module.exports = {
    setConfigValues: function() {
        const values = JSON.parse(fs.readFileSync(path.join(__dirname, './config.json')).toString());
        poolConfig.poolSize = values.dbPoolSize;
        poolConfig.poolGetTimeout = values.dbPoolGetTimeout;
        poolConfig.poolRetryInterval = values.dbPoolRetryInterval;
        databaseConfig.server = values.dbServer;
        databaseConfig.authentication = {
            type: 'default',
            options: {
                userName: values.dbUser,
                password: values.dbPass
            }
        };
        databaseConfig.options = {
            database: values.dbName,
            useUTC: false
        };
    },
    getDatabaseConfig: function() {
        return {
            server: databaseConfig.server,
            authentication: databaseConfig.authentication,
            options: databaseConfig.options
        };
    },
    poolConfig
};
