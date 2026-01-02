/**
 * Module dependencies
 */
import * as logHelper from '../helpers/logHelper';
import { QueryParameter } from '../types';
import { execQuery } from '../database/db';

const logger = logHelper.getLogger('application');

/**
 * Get a user by their authentication token
 * @param token - The API key/token to look up
 * @returns The user object if found, null otherwise
 */
export const getByToken = async function (token: string): Promise<{ Name: string } | null> {
  const query = 'SELECT Name FROM Users WHERE Active = 1 AND Token = ?';
  const params: QueryParameter[] = [{ name: 'Token', type: 'string', value: token }];

  try {
    const result = await execQuery(query, params);
    if (result.length === 1) {
      return result[0] as { Name: string };
    }

    return null;
  } catch (error) {
    logger.error(error);
    throw error;
  }
};
