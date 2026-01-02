/**
 * User Repository Implementation
 */
import { QueryParameter, RowResult } from '../types';
import { User, UserRepository as UserRepositoryInterface, mapUserRow, UserRow } from './types';

export class UserRepository implements UserRepositoryInterface {
  constructor(private execQuery: (sql: string, params: QueryParameter[]) => Promise<RowResult[]>) {}

  async findByToken(token: string): Promise<User | null> {
    const query = 'SELECT Id, Name, Token, Active FROM Users WHERE Active = 1 AND Token = ?';
    const params: QueryParameter[] = [{ name: 'Token', type: 'string', value: token }];

    const result = await this.execQuery(query, params);
    if (result.length === 1) {
      return mapUserRow(result[0] as unknown as UserRow);
    }

    return null;
  }

  async create(data: { name: string; token: string; active: number }): Promise<User> {
    const query = 'INSERT INTO Users (Name, Token, Active) VALUES (?, ?, ?)';
    const params: QueryParameter[] = [
      { name: 'Name', type: 'string', value: data.name },
      { name: 'Token', type: 'string', value: data.token },
      { name: 'Active', type: 'number', value: data.active },
    ];

    await this.execQuery(query, params);

    // Return the created user (simplified - in production you'd fetch the inserted row)
    return {
      Id: 0,
      Name: data.name,
      Token: data.token,
      Active: data.active,
    };
  }
}
