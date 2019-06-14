const fs = require('fs');
const path = require('path');

const config = {};
let configValues = {};

config.setConfigValues = function() {
    configValues = JSON.parse(fs.readFileSync(path.join(__dirname, './config.json')));
};

config.getDatabaseConfig = function() {
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
};

module.exports = config;
