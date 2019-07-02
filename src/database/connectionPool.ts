/**
 * Module dependencies
 */
const Connection = require('tedious').Connection;
import * as config from '../config/config';
// const config = require('../config/config');
const logHelper = require('../helpers/logHelper');

const READY = 0;
const BUSY = 1;
const logger = logHelper.getLogger('application');
const _pool = [];
const lib = {};

const initiateConnectionPool = async function() {
    const size = config.poolConfig.size;

    if (_pool.length > 0) {
        return; // we don't want to initialize more than once
    }

    for (let i = 0; i < size; i++) {
        const con = await resolveDbConnection().catch(err => {
            logger.error(`Error connecting to db: ${err}`);
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
};

const getConnection = function() {
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

const releaseConnection = function(id) {
    // Call this fire-and-forget style since waiting for the release slows down processing
    _pool[id].connection.reset(async err => {
        if (err) {
            logger.error(`Error resetting connection ${id}: ${err}`);
            // _pool[id].connection = await connectToDb().catch(err => {
            // logger.error(`Error connecting to db: ${err}`);
            // });
        }
        _pool[id].status = READY;
    });
};

const connect = function(resolve, reject) {
    const dbConfig = config.getDatabaseConfig();
    const connection = new Connection(dbConfig);

    connection.on('connect', function(err) {
        if (err) {
            reject(err);
        } else {
            logger.info('Connected to DB');
            resolve(connection);
        }
    });
};

const resolveDbConnection = function() {
    return new Promise((resolve, reject) => {
        tryAtMost(3, connect)
            .then(connection => {
                resolve(connection);
            })
            .catch(err => {
                logger.error(`Unable to connect to database: ${err}`);
                reject(err);
            });
    });
};

const findAvailableConnector = function() {
    for (let i = 0; i < _pool.length; i++) {
        if (_pool[i].status == READY) {
            _pool[i].status = BUSY;
            return { id: i, connection: _pool[i].connection };
        }
    }
    return null;
};

const tryAtMost = function(tries, executor) {
    --tries;
    return new Promise(executor).catch(err => (tries > 0 ? tryAtMost(tries, executor) : Promise.reject(err)));
};

export { initiateConnectionPool };
export { releaseConnection };
