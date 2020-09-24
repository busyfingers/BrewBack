import { Request, Response, Router } from 'express';
const router = Router();
import * as db from '../database/db';
import { TYPES } from 'tedious';
import passport from 'passport';
import { Measurement } from '../types';

// TODO: Move most of this logic to a model file for "temperature"

router.get('/', passport.authenticate('bearer', { session: false }), async function (req: Request, res: Response) {
  try {
    let queryBase = `SELECT T.Value, T.Location, T.MeasuredAt, S.Name AS 'Sensor', F.Name AS 'Fermentor'
    FROM dbo.Temperature T
    LEFT JOIN dbo.Sensors S ON T.SensorId = S.Id
    LEFT JOIN dbo.Fermentors F ON T.FermentorId = F.Id
    LEFT JOIN dbo.Batches B
    ON (T.MeasuredAt >= B.FermentationStart) AND (T.MeasuredAt <= ISNULL(B.FermentationEnd, '2999-01-01 00:00:00')) `;

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
        'INSERT INTO dbo.Temperature (Value, Location, MeasuredAt, SensorId, FermentorId)' +
        `VALUES (@Value, @Location, @MeasuredAt, (SELECT Id From dbo.Sensors WHERE Name = @SensorName), (SELECT Id From dbo.Fermentors WHERE Name = @FermentorName))`;
      const params = [
        // JS Number gets converted to int with TYPES.Decimal, so using string representation instead
        { name: 'Value', type: TYPES.NVarChar, value: req.body.value.toFixed(2) },
        { name: 'Location', type: TYPES.NVarChar, value: req.body.location },
        { name: 'MeasuredAt', type: TYPES.DateTime, value: measuredAt },
        { name: 'SensorName', type: TYPES.NVarChar, value: req.body.sensorName },
        { name: 'FermentorName', type: TYPES.NVarChar, value: req.body.fermentorName },
      ];

      await db.execQuery(sql, params);

      res.sendStatus(200);
    } else {
      res.sendStatus(400);
    }
  } catch (err) {
    res.status(500).send(err);
  }
});

const prepareQuery = function (sql: string, querystring: any) {
  let params = [];
  if (Object.keys(querystring).length === 0 && querystring.constructor === Object) {
    sql += 'WHERE 1=1';
  } else {
    sql += 'WHERE ';
    let whereClause = [];

    if (querystring.batchNo) {
      whereClause.push('B.BatchNo = @batchNo');
      whereClause.push('(T.FermentorId = B.FermentorId OR T.FermentorId IS NULL)');
      params.push({ name: 'batchNo', type: TYPES.Int, value: querystring.batchNo });
    }
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
