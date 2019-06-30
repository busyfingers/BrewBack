/**
 * Module dependencies
 */
const db = require('../database/db');
const TYPES = require('tedious').TYPES;
const logHelper = require('../helpers/logHelper');

const logger = logHelper.getLogger('application');
const lib = {};

lib.getByToken = async function(token) {
    const query = 'SELECT Name FROM Users WHERE Active = 1 AND Token = @Token';
    const params = [{ name: 'Token', type: TYPES.NVarChar, value: token }];

    try {
        const result = await db.execQuery(query, params);
        if (result.length === 1) {
            return result[0];
        }

        return null;
    } catch (error) {
        logger.error(error);
        throw error;
    }
};

module.exports = lib;
