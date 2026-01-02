// User entity and repository types

export interface User {
  Id: number;
  Name: string;
  Token: string;
  Active: number;
}

export interface UserRow {
  Id: number;
  Name: string;
  Token: string;
  Active: number;
}

export const mapUserRow = (row: UserRow): User => ({
  Id: row.Id,
  Name: row.Name,
  Token: row.Token,
  Active: row.Active,
});

export interface UserRepository {
  /**
   * Find a user by their authentication token
   * @param token - The API key/token to look up
   * @returns The user if found, null otherwise
   */
  findByToken(token: string): Promise<User | null>;

  /**
   * Create a new user
   * @param data - User data
   * @returns The created user
   */
  create(data: { name: string; token: string; active: number }): Promise<User>;
}

// Shared types
export interface FermProfileItem {
  timePoint: Date;
  value: string;
}
