import { Request, Response, Router } from 'express';
const router = Router();
import * as db from '../database/db';
import passport from 'passport';
import { QueryParameter } from '../types';

router.get('/', passport.authenticate('bearer', { session: false }), async function (req: Request, res: Response) {
  try {
    if (!req.query.batchId) {
      return res.status(400).send('Missing batchId in query string');
    }

    const sql = 'SELECT Value, TimePoint FROM FermentationProfiles WHERE BatchId = ? ORDER BY TimePoint ASC';
    const params: QueryParameter[] = [{ name: 'batchId', type: 'number', value: req.query.batchId }];
    const result = await db.execQuery(sql, params);

    res.status(200).send(result);
  } catch (err) {
    res.status(500).send(err);
  }
});

export default router;
