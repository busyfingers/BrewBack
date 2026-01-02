import { Request, Response, Router } from 'express';
import { validatePayload, isValidDate, apiKeyAuth } from '../helpers/validators';
import { TemperatureRepository } from '../repositories';

/**
 * Create the temperature router with user lookup and temperature repository
 */
export const createTemperatureRouter = (
  getUserByToken: (token: string) => Promise<{ Name: string } | null>,
  temperatureRepository: TemperatureRepository
) => {
  const router = Router();

  router.get('/', apiKeyAuth(getUserByToken), async function (req: Request, res: Response) {
    try {
      const filter = {
        batchId: req.query.batchId ? Number(req.query.batchId) : undefined,
        from: req.query.from as string | undefined,
        to: req.query.to as string | undefined,
      };

      const result = await temperatureRepository.findAll(filter);
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
        await temperatureRepository.create({
          value: req.body.value,
          location: req.body.location,
          measuredAt: measuredAt.toISOString(),
          sensorName: req.body.sensorName,
          fermentorName: req.body.fermentorName,
        });

        res.sendStatus(200);
      } else {
        res.sendStatus(400);
      }
    } catch (err) {
      res.status(500).send(err);
    }
  });

  return router;
};

export default createTemperatureRouter;
