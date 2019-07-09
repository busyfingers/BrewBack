"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Module dependencies
 */
const tedious_1 = require("tedious");
const config = __importStar(require("../config/config"));
const logHelper = __importStar(require("../helpers/logHelper"));
const READY = 0;
const BUSY = 1;
const logger = logHelper.getLogger('application');
const _pool = [];
const initiateConnectionPool = function () {
    return __awaiter(this, void 0, void 0, function* () {
        const size = config.poolConfig.size;
        if (_pool.length > 0) {
            return; // we don't want to initialize more than once
        }
        for (let i = 0; i < size; i++) {
            const con = yield resolveDbConnection().catch(err => {
                const msg = `Error connecting to db: ${err}`;
                logger.error(msg);
                throw new Error(msg);
            });
            const poolItem = {
                connection: con,
                status: READY
            };
            _pool.push(poolItem);
        }
        if (_pool.length === 0) {
            throw new Error('Unable to initiate connection pool!');
        }
    });
};
exports.initiateConnectionPool = initiateConnectionPool;
const getConnection = function () {
    return new Promise((resolve, reject) => {
        const limit = config.poolConfig.getTimeout / config.poolConfig.retryInterval;
        let attempts = 0;
        let connector = findAvailableConnector();
        if (connector) {
            return resolve(connector);
        }
        const interval = setInterval(_ => {
            attempts++;
            connector = findAvailableConnector();
            if (connector) {
                clearInterval(interval);
                return resolve(connector);
            }
            if (attempts >= limit) {
                clearInterval(interval);
                return reject();
            }
        }, config.poolConfig.retryInterval);
    });
};
exports.getConnection = getConnection;
const releaseConnection = function (id) {
    // Call this fire-and-forget style since waiting for the release slows down processing
    _pool[id].connection.reset((err) => __awaiter(this, void 0, void 0, function* () {
        if (err) {
            logger.error(`Error resetting connection ${id}: ${err}`);
            // _pool[id].connection = await connectToDb().catch(err => {
            // logger.error(`Error connecting to db: ${err}`);
            // });
        }
        _pool[id].status = READY;
    }));
};
exports.releaseConnection = releaseConnection;
const connect = function (resolve, reject) {
    const dbConfig = config.getDatabaseConfig();
    const connection = new tedious_1.Connection(dbConfig);
    connection.on('connect', function (err) {
        if (err) {
            reject(err);
        }
        else {
            logger.info('Connected to DB');
            resolve(connection);
        }
    });
};
const resolveDbConnection = function () {
    return new Promise((resolve, reject) => {
        tryAtMost(3, connect)
            .then((connection) => {
            resolve(connection);
        })
            .catch((err) => {
            logger.error(`Unable to connect to database: ${err}`);
            reject(err);
        });
    });
};
const findAvailableConnector = function () {
    for (let i = 0; i < _pool.length; i++) {
        if (_pool[i].status == READY) {
            _pool[i].status = BUSY;
            return { id: i, connection: _pool[i].connection };
        }
    }
    return null;
};
// TODO: Merge function "connect" into this, no need for a generic function that does retries
const tryAtMost = function (tries, executor) {
    return __awaiter(this, void 0, void 0, function* () {
        --tries;
        try {
            return new Promise(executor);
        }
        catch (err) {
            return yield (tries > 0 ? tryAtMost(tries, executor) : Promise.reject(err));
        }
    });
};
