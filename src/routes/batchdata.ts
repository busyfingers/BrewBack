import { Request, Response, Router } from 'express';
import * as config from '../config/config';
import * as logHelper from '../helpers/logHelper';
import { validateRequest, apiKeyAuth } from '../helpers/validators';
import { BatchRepository, FermentationProfileRepository } from '../repositories';
import { FermProfileItem } from '../repositories/types';

const logger = logHelper.getLogger('application');

/**
 * Create the batchdata router
 * Note: POST route uses author validation (Brewfather can't send API key)
 * GET routes use API key authentication
 */
export const createBatchDataRouter = (
  getUserByToken: (token: string) => Promise<{ Name: string } | null>,
  batchRepository: BatchRepository,
  fermentationProfileRepository: FermentationProfileRepository
) => {
  const router = Router();

  // GET routes require API key authentication
  router.get('/', apiKeyAuth(getUserByToken), async function (req: Request, res: Response) {
    try {
      const result = await batchRepository.findAll();
      res.status(200).send(result);
    } catch (err) {
      res.status(500).send(err);
    }
  });

  /**
   * This route is POSTed to by Brewfather, which has no support for authentication. Therefore, the author in the request
   * payload is used as a validation token. Also, since we cannot PUT to this route, the data is updated if the same
   * batch already exists.
   */
  router.post('/', async function (req: Request, res: Response) {
    try {
      if (!validateRequest(req.body)) {
        logger.error('Invalid request body. Missing properties or wrong type(s)');
        return res.sendStatus(400);
      }

      // Using the author property as a token for validation
      if (req.body.recipe.author !== config.batchDataApiKey) {
        logger.error('Received an invalid key');
        return res.sendStatus(401);
      }

      const fermentorId = 1; // Would be looked up in a full implementation

      const fermentationStart = new Date(req.body.fermentationStartDate);
      const fermentationEnd = typeof req.body.bottlingDate === 'number' ? new Date(req.body.bottlingDate) : null;

      fermentationStart.setHours(0, 0, 0, 0);
      fermentationEnd?.setHours(23, 59, 0, 0);

      const existingBatch = await batchRepository.find(
        req.body.batchNo,
        req.body.recipe.name,
        fermentorId
      );

      await batchRepository.upsert(
        {
          batchNo: req.body.batchNo,
          recipeName: req.body.recipe.name,
          fermentorId: fermentorId,
          fermentationStart: fermentationStart.toISOString(),
          fermentationEnd: fermentationEnd?.toISOString() || null,
        },
        existingBatch !== null
      );

      await upsertFermentationProfile(req, fermentorId, existingBatch, fermentationStart);

      res.status(200).send(); // res.sendStatus(200) makes Brewfather think the request failed
    } catch (err) {
      logger.error(err);
      res.sendStatus(400);
    }
  });

  const upsertFermentationProfile = async function (
    req: Request,
    fermentorId: number,
    existingBatch: { Id: number } | null,
    fermentationStart: Date
  ) {
    const fermentationProfile = req.body.recipe.fermentation.steps;

    if (Array.isArray(fermentationProfile) && fermentationProfile.length > 0) {
      let batchId = 0;
      let exists = existingBatch !== null;

      if (!exists) {
        // Get newly created batch id
        const newBatch = await batchRepository.find(req.body.batchNo, req.body.recipe.name, fermentorId);
        batchId = newBatch!.Id;
      } else {
        batchId = existingBatch!.Id;
      }

      const profileData = [] as FermProfileItem[];
      const first_day = new Date(fermentationStart);
      let days = 0;

      fermentationProfile.forEach((element) => {
        const stepTime = parseInt(element.stepTime);

        let firstDate = new Date(first_day);
        firstDate.setHours(12, 0, 0, 0);
        firstDate.setDate(firstDate.getDate() + days);

        let secondDate = new Date(first_day);
        secondDate.setHours(12, 0, 0, 0);
        secondDate.setDate(secondDate.getDate() + days + stepTime);

        profileData.push({ timePoint: firstDate, value: element.stepTemp.toFixed() });
        profileData.push({ timePoint: secondDate, value: element.stepTemp.toFixed() });

        days += stepTime;
      });

      // Clear existing profiles and insert new ones
      await fermentationProfileRepository.deleteByBatchId(batchId);

      for (const data of profileData) {
        await fermentationProfileRepository.create({
          batchId: batchId,
          value: Number(data.value),
          timePoint: data.timePoint.toISOString(),
        });
      }
    }
  };

  return router;
};

export default createBatchDataRouter;
