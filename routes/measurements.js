const express = require('express');
const router = express.Router();
const db = require('../database/db');
const debug = require('debug')('brewback:route:measurements');
const TYPES = require('tedious').TYPES;

/* GET users listing. */
router.get('/', async function(req, res, next) {
    try {
        let queryBase = 'SELECT * FROM Measurements WHERE ';
        let queryData = prepareQuery(queryBase, req.query);
        const result = await db.execQuery(queryData.sqlQuery, queryData.parameters);

        res.send(result).status(200);
    } catch (err) {
        res.send(err).status(500);
    }
});

const prepareQuery = function(sql, querystring) {
    let params = [];
    if (Object.keys(querystring).length === 0 && querystring.constructor === Object) {
        sql += '1=1';
    } else {
        let whereClause = [];
        if (querystring.from) {
            whereClause.push('MeasuredAt >= @from');
            params.push({ name: 'from', type: TYPES.NVarChar, value: querystring.from });
        }
        if (querystring.to) {
            whereClause.push('MeasuredAt <= @to');
            params.push({ name: 'to', type: TYPES.NVarChar, value: querystring.to });
        }
        sql += whereClause.join(' AND ');
    }

    return {
        sqlQuery: sql,
        parameters: params
    };
};

module.exports = router;
