"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
let poolConfig = {};
exports.poolConfig = poolConfig;
let databaseConfig = {};
const setConfigValues = function () {
    const values = JSON.parse(fs.readFileSync(path.join(__dirname, '../../config.json')).toString());
    poolConfig.size = values.dbPoolSize;
    poolConfig.getTimeout = values.dbPoolGetTimeout;
    poolConfig.retryInterval = values.dbPoolRetryInterval;
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
};
exports.setConfigValues = setConfigValues;
const getDatabaseConfig = function () {
    return {
        server: databaseConfig.server,
        authentication: databaseConfig.authentication,
        options: databaseConfig.options
    };
};
exports.getDatabaseConfig = getDatabaseConfig;
