import { Request, Response, Router } from 'express';
const router = Router();
import * as db from '../database/db';
import * as config from '../config/config';
import passport from 'passport';
import * as logHelper from '../helpers/logHelper';
import { FermProfileItem, RowResult, QueryParameter } from '../types';

const logger = logHelper.getLogger('application');

router.get('/', passport.authenticate('bearer', { session: false }), async function (req: Request, res: Response) {
  try {
    const sql = 'SELECT Id, BatchNo, RecipeName, FermentationStart, FermentationEnd FROM Batches';
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

    const params: QueryParameter[] = [{ name: 'name', type: 'string', value: req.body.brewer }];
    const sql = `SELECT Id FROM Fermentors WHERE Name = ?`;
    const result = await db.execQuery(sql, params);

    if (result.length !== 1) {
      logger.error(`Unable to find fermentor with name '${req.body.brewer}' or it is not unique`);
      return res.sendStatus(400);
    }

    const fermentorId = result[0].Id;
    const fermentationStart = new Date(req.body.fermentationStartDate);
    const fermentationEnd = typeof req.body.bottlingDate === 'number' ? new Date(req.body.bottlingDate) : null;

    fermentationStart.setHours(0, 0, 0, 0);
    fermentationEnd?.setHours(23, 59, 0, 0);

    const batchResult = await getBatch(req, Number(fermentorId));

    await upsertBatchData(req, Number(fermentorId), batchResult.length > 0, fermentationStart, fermentationEnd);
    await upsertFermentationProfile(req, Number(fermentorId), batchResult, fermentationStart);

    res.status(200).send(); // res.sendStatus(200) makes Brewfather think the request failed
  } catch (err) {
    logger.error(err);
    res.sendStatus(400);
  }
});

const getBatch = async function (req: Request, fermentorId: number) {
  const params: QueryParameter[] = [];
  const sql = `SELECT Id FROM Batches WHERE BatchNo = ? AND RecipeName = ? AND FermentorId = ?`;
  params.push({ name: 'batchNo', type: 'number', value: req.body.batchNo });
  params.push({ name: 'recipeName', type: 'string', value: req.body.recipe.name });
  params.push({ name: 'fermentorId', type: 'number', value: fermentorId });

  return await db.execQuery(sql, params);
};

const getFermentationProfile = async function (batchId: Number) {
  const sql = 'SELECT Value, TimePoint FROM FermentationProfiles WHERE BatchId = ?';

  return await db.execQuery(sql, [{ name: 'BatchId', type: 'number', value: batchId }]);
};

const clearFermentationProfileForBatch = async function (batchId: Number) {
  const sql = 'DELETE FROM FermentationProfiles WHERE BatchId = ?';

  return await db.execNonQuery(sql, [{ name: 'BatchId', type: 'number', value: batchId }]);
};

const upsertBatchData = async function (
  req: Request,
  fermentorId: number,
  exists: boolean,
  fermentationStart: Date,
  fermentationEnd: Date | null
) {
  const params: QueryParameter[] = [];
  let sql = '';
  params.push({ name: 'batchNo', type: 'number', value: req.body.batchNo });
  params.push({ name: 'recipeName', type: 'string', value: req.body.recipe.name });
  params.push({ name: 'fermentorId', type: 'number', value: fermentorId });
  params.push({ name: 'fermentationStart', type: 'string', value: fermentationStart.toISOString() });
  params.push({ name: 'fermentationEnd', type: 'string', value: fermentationEnd ? fermentationEnd.toISOString() : null });

  if (!exists) {
    sql = `INSERT INTO Batches (BatchNo, RecipeName, FermentorId, FermentationStart, FermentationEnd)
      VALUES (?, ?, ?, ?, ?)`;
  } else {
    sql = `UPDATE Batches SET FermentationStart = ?, FermentationEnd = ?
      WHERE BatchNo = ? AND RecipeName = ? AND FermentorId = ?`;
    // Reorder for UPDATE: fermentationStart, fermentationEnd, batchNo, recipeName, fermentorId
    const fermentationStartVal = params[3];
    const fermentationEndVal = params[4];
    const batchNoVal = params[0];
    const recipeNameVal = params[1];
    const fermentorIdVal = params[2];
    params[0] = fermentationStartVal;
    params[1] = fermentationEndVal;
    params[2] = batchNoVal;
    params[3] = recipeNameVal;
    params[4] = fermentorIdVal;
  }

  await db.execNonQuery(sql, params);
};

const upsertFermentationProfile = async function (
  req: Request,
  fermentorId: number,
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
      batchId = parseInt(res[0].Id as string);
    } else {
      batchId = parseInt(result[0].Id as string);
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

    // Build batch insert for SQLite - insert one row at a time since SQLite doesn't support multi-row VALUES
    for (const data of profileData) {
      const sql = 'INSERT INTO FermentationProfiles (BatchId, Value, TimePoint) VALUES (?, ?, ?)';
      const params: QueryParameter[] = [
        { name: 'batchId', type: 'number', value: batchId },
        { name: 'value', type: 'string', value: data.value },
        { name: 'timePoint', type: 'string', value: data.timePoint.toISOString() },
      ];
      await db.execNonQuery(sql, params);
    }
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
