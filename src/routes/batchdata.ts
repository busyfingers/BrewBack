import { Request, Response, Router } from 'express';
const router = Router();
import * as db from '../database/db';
import * as config from '../config/config';
import { TYPES } from 'tedious';
import passport from 'passport';
import * as logHelper from '../helpers/logHelper';
import { FermProfileItem, RowResult } from '../types';

const logger = logHelper.getLogger('application');

router.get(
  '/',
  passport.authenticate('bearer', { session: false }),
  async function (req: Request, res: Response) {
    try {
      const sql =
        'SELECT Id, BatchNo, RecipeName, FermentationStart, FermentationEnd FROM dbo.Batches';
      const result = await db.execQuery(sql, []);

      res.status(200).send(result);
    } catch (err) {
      res.status(500).send(err);
    }
  }
);

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
    const fermentationEnd =
      typeof req.body.bottlingDate === 'number' ? new Date(req.body.bottlingDate) : null;

    fermentationStart.setHours(0, 0, 0, 0);
    fermentationEnd?.setHours(23, 59, 0, 0);

    result = await getBatch(req, fermentorId);

    await upsertBatchData(req, fermentorId, result.length > 0, fermentationStart, fermentationEnd);
    await upsertFermentationProfile(req, fermentorId, result, fermentationStart);

    res.status(200).send(); // res.sendStatus(200) makes Brewfather think the request failed
  } catch (error) {
    let message = 'Unknown Error';
    if (error instanceof Error) message = error.message;
    res.sendStatus(400);
  }
});

const getBatch = async function (req: Request, fermentorId: string) {
  let params = [];
  let sql = `SELECT Id FROM dbo.Batches WHERE BatchNo = @batchNo AND RecipeName = @recipeName AND FermentorId = @fermentorId`;
  params.push({ name: 'batchNo', type: TYPES.Int, value: req.body.batchNo });
  params.push({ name: 'recipeName', type: TYPES.NVarChar, value: req.body.recipe.name });
  params.push({ name: 'fermentorId', type: TYPES.Int, value: fermentorId });

  return await db.execQuery(sql, params);
};

const getFermentationProfile = async function (batchId: Number) {
  const sql = 'SELECT Value, TimePoint FROM dbo.FermentationProfiles WHERE BatchId = @BatchId';

  return await db.execQuery(sql, [{ name: 'BatchId', type: TYPES.Int, value: batchId }]);
};

const clearFermentationProfileForBatch = async function (batchId: Number) {
  const sql = 'DELETE FROM dbo.FermentationProfiles WHERE BatchId = @BatchId';

  return await db.execQuery(sql, [{ name: 'BatchId', type: TYPES.Int, value: batchId }]);
};

const upsertBatchData = async function (
  req: Request,
  fermentorId: string,
  exists: boolean,
  fermentationStart: Date,
  fermentationEnd: Date | null
) {
  let params = [];
  let sql = '';
  params.push({ name: 'batchNo', type: TYPES.Int, value: req.body.batchNo });
  params.push({ name: 'recipeName', type: TYPES.NVarChar, value: req.body.recipe.name });
  params.push({ name: 'fermentorId', type: TYPES.Int, value: fermentorId });
  params.push({ name: 'fermentationStart', type: TYPES.DateTime, value: fermentationStart });
  params.push({ name: 'fermentationEnd', type: TYPES.DateTime, value: fermentationEnd });

  if (!exists) {
    sql = `INSERT INTO dbo.Batches (BatchNo, RecipeName, FermentorId, FermentationStart, FermentationEnd) 
      VALUES (@batchNo, @recipeName, @fermentorId, @fermentationStart, @fermentationEnd)`;
  } else {
    sql = `UPDATE dbo.Batches SET FermentationStart = @fermentationStart, FermentationEnd = @fermentationEnd WHERE 
      BatchNo = @batchNo AND RecipeName = @RecipeName AND FermentorId = @fermentorId`;
  }

  await db.execQuery(sql, params);
};

const upsertFermentationProfile = async function (
  req: Request,
  fermentorId: string,
  result: RowResult[],
  fermentationStart: Date
) {
  const fermentationProfile = req.body.recipe.fermentation.steps;

  if (Array.isArray(fermentationProfile) && fermentationProfile.length > 0) {
    let batchId = 0;
    let exists = result.length > 0;

    if (!exists) {
      // Get newly created batch id
      const res = await getBatch(req, fermentorId);
      batchId = parseInt(res[0].Id);
    } else {
      batchId = parseInt(result[0].Id);
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

    const res = await getFermentationProfile(batchId);

    if (res.length > 0) {
      await clearFermentationProfileForBatch(batchId);
    }

    let params = [];
    let sql = 'INSERT INTO dbo.FermentationProfiles (BatchId, Value, TimePoint) VALUES ';

    for (let i = 0; i < profileData.length; i++) {
      const separator = i !== profileData.length - 1 ? ',' : '';
      sql += `(@batchId${i}, @value${i}, @timePoint${i})${separator}`;
      params.push({ name: `batchId${i}`, type: TYPES.Int, value: batchId });
      params.push({ name: `value${i}`, type: TYPES.NVarChar, value: profileData[i].value });
      params.push({ name: `timePoint${i}`, type: TYPES.DateTime, value: profileData[i].timePoint });
    }

    await db.execQuery(sql, params);
  }
};

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
