import { ApplicationConfig } from '../types';

const fs = require('fs');
const path = require('path');
const types = require('../types');

let configValues = {} as ApplicationConfig;

const lib = {
    setConfigValues: function() {
        configValues = JSON.parse(fs.readFileSync(path.join(__dirname, './config.json')));
        config.dbConnectionPool = {
            poolSize: configValues.dbPoolSize,
            getTimeout: configValues.dbPoolGetTimeout,
            retryInterval: configValues.dbPoolRetryInterval
        };
    },
    getDatabaseConfig: function() {
        return {
            server: configValues.dbServer,
            authentication: {
                type: 'default',
                options: {
                    userName: configValues.dbUser,
                    password: configValues.dbPass
                }
            },
            options: {
                database: configValues.dbName,
                useUTC: false
            }
        };
    }
};
module.exports = lib;
