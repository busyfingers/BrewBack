import { Request, Response, Router } from 'express';
import { QueryParameter, RowResult } from '../types';
import { validatePayload, isValidDate, apiKeyAuth } from '../helpers/validators';

// Query function type
type QueryFn = (sql: string, params: QueryParameter[]) => Promise<RowResult[]>;
type NonQueryFn = (sql: string, params: QueryParameter[]) => Promise<void>;

// TODO: Move most of this logic to a model file for "temperature"

/**
 * Create the temperature router with user lookup and query functions
 */
export const createTemperatureRouter = (
  getUserByToken: (token: string) => Promise<{ Name: string } | null>,
  execQueryFn: QueryFn = async () => [],
  execNonQueryFn: NonQueryFn = async () => {}
) => {
  const router = Router();

  router.get('/', apiKeyAuth(getUserByToken), async function (req: Request, res: Response) {
    try {
      let queryBase = `SELECT T.Value, T.Location, T.MeasuredAt, S.Name AS 'Sensor', F.Name AS 'Fermentor'
      FROM Temperature T
      LEFT JOIN Sensors S ON T.SensorId = S.Id
      LEFT JOIN Fermentors F ON T.FermentorId = F.Id
      LEFT JOIN Batches B
      ON (T.MeasuredAt >= B.FermentationStart) AND (T.MeasuredAt <= IFNULL(B.FermentationEnd, '2999-01-01 00:00:00')) `;

      const queryData = prepareQuery(queryBase, req.query);
      const result = await execQueryFn(queryData.sqlQuery, queryData.parameters);

      res.status(200).send(result);
    } catch (err) {
      res.status(500).send(err);
    }
  });

  router.post('/', apiKeyAuth(getUserByToken), async function (req: Request, res: Response) {
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

        await execNonQueryFn(sql, params);

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

  return router;
};

export default createTemperatureRouter;
