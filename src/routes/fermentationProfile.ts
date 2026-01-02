import { Request, Response, Router } from 'express';
import { QueryParameter, RowResult } from '../types';
import { apiKeyAuth } from '../helpers/validators';

// Generic query function type
type QueryFn<T = RowResult> = (sql: string, params: QueryParameter[]) => Promise<T[]>;

/**
 * Create the fermentation profile router with user lookup function
 */
export const createFermentationProfileRouter = (
  getUserByToken: (token: string) => Promise<{ Name: string } | null>,
  execQueryFn: QueryFn = async () => []
) => {
  const router = Router();

  router.get('/', apiKeyAuth(getUserByToken), async function (req: Request, res: Response) {
    try {
      if (!req.query.batchId) {
        return res.status(400).send('Missing batchId in query string');
      }

      const sql = 'SELECT Value, TimePoint FROM FermentationProfiles WHERE BatchId = ? ORDER BY TimePoint ASC';
      const params: QueryParameter[] = [{ name: 'batchId', type: 'number', value: req.query.batchId }];
      const result = await execQueryFn(sql, params);

      res.status(200).send(result);
    } catch (err) {
      res.status(500).send(err);
    }
  });

  return router;
};

export default createFermentationProfileRouter;
