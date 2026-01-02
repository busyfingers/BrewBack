import { Request, Response, Router } from 'express';
import { apiKeyAuth } from '../helpers/validators';
import { FermentationProfileRepository } from '../repositories';

/**
 * Create the fermentation profile router with user lookup and repository
 */
export const createFermentationProfileRouter = (
  getUserByToken: (token: string) => Promise<{ Name: string } | null>,
  fermentationProfileRepository: FermentationProfileRepository
) => {
  const router = Router();

  router.get('/', apiKeyAuth(getUserByToken), async function (req: Request, res: Response) {
    try {
      if (!req.query.batchId) {
        return res.status(400).send('Missing batchId in query string');
      }

      const result = await fermentationProfileRepository.findByBatchId(Number(req.query.batchId));
      res.status(200).send(result);
    } catch (err) {
      res.status(500).send(err);
    }
  });

  return router;
};

export default createFermentationProfileRouter;
