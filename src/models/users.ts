/**
 * User model - delegates to UserRepository
 */
import { UserRepository, User } from '../repositories';
import { RowResult } from '../types';

/**
 * Create a user repository instance
 */
const createUserRepository = () => {
  return new UserRepository(async (sql: string, params) => {
    const { execQuery } = await import('../database/db');
    return execQuery(sql, params) as Promise<RowResult[]>;
  });
};

/**
 * Get a user by their authentication token
 * @param token - The API key/token to look up
 * @returns The user object if found, null otherwise
 */
export const getByToken = async function (token: string): Promise<User | null> {
  const repo = createUserRepository();
  return repo.findByToken(token);
};
