import { Request, Response, Router } from 'express';
const router = Router();
import * as db from '../database/db';
import passport from 'passport';
import { Measurement, QueryParameter } from '../types';

// TODO: Move most of this logic to a model file for "temperature"

router.get('/', passport.authenticate('bearer', { session: false }), async function (req: Request, res: Response) {
  try {
    let queryBase = `SELECT T.Value, T.Location, T.MeasuredAt, S.Name AS 'Sensor', F.Name AS 'Fermentor'
    FROM Temperature T
    LEFT JOIN Sensors S ON T.SensorId = S.Id
    LEFT JOIN Fermentors F ON T.FermentorId = F.Id
    LEFT JOIN Batches B
    ON (T.MeasuredAt >= B.FermentationStart) AND (T.MeasuredAt <= IFNULL(B.FermentationEnd, '2999-01-01 00:00:00')) `;

    const queryData = prepareQuery(queryBase, req.query);
    const result = await db.execQuery(queryData.sqlQuery, queryData.parameters);

    res.status(200).send(result);
  } catch (err) {
    res.status(500).send(err);
  }
});

router.post('/', passport.authenticate('bearer', { session: false }), async function (req: Request, res: Response) {
  try {
    const payloadIsValid = validatePayload(req.body);
    const measuredAt = new Date(req.body.measuredAt);

    if (!isValidDate(measuredAt)) {
      res.sendStatus(400);
      return;
    }

    if (payloadIsValid) {
      const sql =
        'INSERT INTO Temperature (Value, Location, MeasuredAt, SensorId, FermentorId)' +
        `VALUES (?, ?, ?, (SELECT Id From Sensors WHERE Name = ?), (SELECT Id From Fermentors WHERE Name = ?))`;
      const params: QueryParameter[] = [
        { name: 'Value', type: 'string', value: req.body.value.toFixed(2) },
        { name: 'Location', type: 'string', value: req.body.location },
        { name: 'MeasuredAt', type: 'string', value: measuredAt.toISOString() },
        { name: 'SensorName', type: 'string', value: req.body.sensorName },
        { name: 'FermentorName', type: 'string', value: req.body.fermentorName },
      ];

      await db.execNonQuery(sql, params);

      res.sendStatus(200);
    } else {
      res.sendStatus(400);
    }
  } catch (err) {
    res.status(500).send(err);
  }
});

const prepareQuery = function (sql: string, querystring: any) {
  let params: QueryParameter[] = [];
  if (Object.keys(querystring).length === 0 && querystring.constructor === Object) {
    sql += 'WHERE 1=1';
  } else {
    sql += 'WHERE ';
    let whereClause = [];

    if (querystring.batchId) {
      whereClause.push('B.Id = ?');
      whereClause.push('(T.FermentorId = B.FermentorId OR T.FermentorId IS NULL)');
      params.push({ name: 'batchId', type: 'number', value: querystring.batchId });
    }
    if (querystring.from) {
      whereClause.push('MeasuredAt >= ?');
      params.push({ name: 'from', type: 'string', value: querystring.from });
    }
    if (querystring.to) {
      whereClause.push('MeasuredAt <= ?');
      params.push({ name: 'to', type: 'string', value: querystring.to });
    }
    sql += whereClause.join(' AND ');
  }

  sql += ' ORDER BY MeasuredAt';

  return {
    sqlQuery: sql,
    parameters: params,
  };
};

const validatePayload = function (data: Measurement) {
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

const isValidDate = function (date: Date) {
  return date instanceof Date && !isNaN(date.getTime());
};

export default router;
