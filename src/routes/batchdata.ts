/**
 * Module dependencies
 */
import { Request, Response, Router } from 'express';
const router = Router();
import * as db from '../database/db';
import * as config from '../config/config';
import { TYPES } from 'tedious';
import passport from 'passport';
import { Measurement } from '../types';
import * as logHelper from '../helpers/logHelper';
import * as fs from 'fs';

const logger = logHelper.getLogger('application');

router.get('/', passport.authenticate('bearer', { session: false }), async function (req: Request, res: Response) {
  try {
    res.sendStatus(200);
  } catch (err) {
    res.status(500).send(err);
  }
});

router.post('/', async function (req: Request, res: Response) {
  try {
    const key = req.body.recipe.author;

    if (key !== config.batchDataApiKey) {
      logger.warn(`Received invalid key`);
      return res.sendStatus(401);
    }

    logger.info(`Received valid key`);

    res.status(200).send();
  } catch (err) {
    logger.error(err);
    res.sendStatus(400);
  }
});

export default router;
