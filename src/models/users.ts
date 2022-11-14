/**
 * Module dependencies
 */
import * as db from '../database/db';
import { TYPES } from 'tedious';
import * as logHelper from '../helpers/logHelper';

const logger = logHelper.getLogger('application');

const getByToken = async function (token: string) {
  const query = 'SELECT Name FROM Users WHERE Active = 1 AND Token = @Token';
  const params = [{ name: 'Token', type: TYPES.NVarChar, value: token }];

  try {
    const result = await db.execQuery(query, params);
    if (result.length === 1) {
      return result[0];
    }

    return null;
  } catch (error) {
    let message = 'Unknown Error';
    if (error instanceof Error) message = error.message;
    logger.error(message);
    throw error;
  }
};

export { getByToken };
