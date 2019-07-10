/**
 * Module dependencies
 */
import { Request, Response, Router } from 'express';
const router = Router();
import * as db from '../database/db';
import { TYPES } from 'tedious';
import passport from 'passport';
import { Measurement } from '../types';

router.get('/', passport.authenticate('bearer', { session: false }), async function(req: Request, res: Response) {
    try {
        let queryBase = 'SELECT Value, Location, MeasuredAt FROM dbo.Temperature WHERE ';
        let queryData = prepareQuery(queryBase, req.query);
        const result = await db.execQuery(queryData.sqlQuery, queryData.parameters);

        res.send(result).status(200);
    } catch (err) {
        res.send(err).status(500);
    }
});

router.post('/', passport.authenticate('bearer', { session: false }), async function(req: Request, res: Response) {
    try {
        const payloadIsValid = validatePayload(req.body);
        const measuredAt = new Date(req.body.measuredAt);

        if (!isValidDate(measuredAt)) {
            res.sendStatus(400);
            return;
        }

        if (payloadIsValid) {
            const sql = `INSERT INTO dbo.Temperature (Value, Location, MeasuredAt) VALUES (@Value, @Location, @MeasuredAt)`;
            const params = [
                // JS Number gets converted to int with TYPES.Decimal, so using string representation instead
                { name: 'Value', type: TYPES.NVarChar, value: req.body.value.toFixed(2) },
                { name: 'Location', type: TYPES.NVarChar, value: req.body.location },
                { name: 'MeasuredAt', type: TYPES.DateTime, value: measuredAt }
            ];

            await db.execQuery(sql, params);

            res.sendStatus(200);
        } else {
            res.sendStatus(400);
        }
    } catch (err) {
        res.send(err).status(500);
    }
});

const prepareQuery = function(sql: string, querystring: any) {
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

    sql += ' ORDER BY MeasuredAt';

    return {
        sqlQuery: sql,
        parameters: params
    };
};

const validatePayload = function(data: Measurement) {
    if (Object.keys(data).length === 0 && data.constructor === Object) {
        return false;
    }

    if (!data.value || !data.measuredAt || !data.location) {
        return false;
    }

    if (typeof data.value !== 'number' || typeof data.measuredAt !== 'number' || typeof data.location !== 'string') {
        return false;
    }

    return true;
};

const isValidDate = function(date: Date) {
    return date instanceof Date && !isNaN(date.getTime());
};

export default router;
