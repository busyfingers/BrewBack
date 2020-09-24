import { Request, Response, Router } from 'express';
const router = Router();
import * as db from '../database/db';
import * as config from '../config/config';
import { TYPES } from 'tedious';
import passport from 'passport';
import * as logHelper from '../helpers/logHelper';

const logger = logHelper.getLogger('application');

router.get('/', passport.authenticate('bearer', { session: false }), async function (req: Request, res: Response) {
  try {
    const sql = 'SELECT Id, BatchNo, RecipeName FROM dbo.Batches';
    const result = await db.execQuery(sql, []);

    res.status(200).send(result);
  } catch (err) {
    res.status(500).send(err);
  }
});

/**
 * This route is POSTed to by Brewfather, which has no support for authentication. Therefore, the author in the request
 *  payload is used as a validation token. Also, since we cannot PUT to this route, the data is updated if the same
 *  batch already exists.
 */
router.post('/', async function (req: Request, res: Response) {
  try {
    if (!validateRequest(req)) {
      logger.error('Invalid request body. Missing properties or wrong type(s)');
      return res.sendStatus(400);
    }

    // Using the author property as a token for validation
    if (req.body.recipe.author !== config.batchDataApiKey) {
      logger.error('Received an invalid key');
      return res.sendStatus(401);
    }

    let params = [{ name: 'name', type: TYPES.NVarChar, value: req.body.brewer }];
    let sql = `SELECT Id FROM dbo.Fermentors WHERE Name = @name`;
    let result = await db.execQuery(sql, params);

    if (result.length !== 1) {
      logger.error(`Unable to find fermentor with name '${req.body.brewer}' or it is not unique`);
      return res.sendStatus(400);
    }

    const fermentorId = result[0].Id;
    const fermentationStart = new Date(req.body.fermentationStartDate);
    const fermentationEnd = typeof req.body.bottlingDate === 'number' ? new Date(req.body.bottlingDate) : null;

    params = [];
    sql = `SELECT Id FROM dbo.Batches WHERE BatchNo = @batchNo AND RecipeName = @recipeName AND FermentorId = @fermentorId`;
    params.push({ name: 'batchNo', type: TYPES.Int, value: req.body.batchNo });
    params.push({ name: 'recipeName', type: TYPES.NVarChar, value: req.body.recipe.name });
    params.push({ name: 'fermentorId', type: TYPES.Int, value: fermentorId });
    result = await db.execQuery(sql, params);

    params.push({ name: 'fermentationStart', type: TYPES.DateTime, value: fermentationStart });
    params.push({ name: 'fermentationEnd', type: TYPES.DateTime, value: fermentationEnd });

    if (result.length === 0) {
      console.log('INSERT');
      sql = `INSERT INTO dbo.Batches (BatchNo, RecipeName, FermentorId, FermentationStart, FermentationEnd) 
      VALUES (@batchNo, @recipeName, @fermentorId, @fermentationStart, @fermentationEnd)`;
    } else {
      console.log('UPDATE');
      sql = `UPDATE dbo.Batches SET FermentationStart = @fermentationStart, FermentationEnd = @fermentationEnd WHERE 
      BatchNo = @batchNo AND RecipeName = @RecipeName AND FermentorId = @fermentorId`;
    }

    await db.execQuery(sql, params);

    res.status(200).send(); // res.sendStatus(200) makes Brewfather think the request failed
  } catch (err) {
    logger.error(err);
    res.sendStatus(400);
  }
});

const validateRequest = function (req: Request) {
  if (Object.keys(req.body).length === 0 && req.body.constructor === Object) {
    return false;
  }

  if (
    !req.body.batchNo ||
    !req.body.recipe.name ||
    !req.body.recipe.author ||
    !req.body.brewer ||
    !req.body.fermentationStartDate
  ) {
    return false;
  }

  if (
    typeof req.body.batchNo !== 'number' ||
    typeof req.body.recipe.name !== 'string' ||
    typeof req.body.recipe.author !== 'string' ||
    typeof req.body.brewer !== 'string' ||
    typeof req.body.fermentationStartDate !== 'number'
  ) {
    return false;
  }

  return true;
};

export default router;
