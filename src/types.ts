import Database from 'better-sqlite3';

export type PoolConfig = {
  size: number;
  getTimeout: number;
  retryInterval: number;
};

export type DatabaseConfig = {
  databasePath: string;
};

export type PoolItem = {
  connection: Database.Database;
  status: number;
};

export type Connector = {
  id: number;
  connection: Database.Database;
};

export type QueryParameter = {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'null';
  value: any;
};

export interface RowResult {
  [name: string]: string | number | boolean | null;
}

export type Measurement = {
  value: string;
  location: string;
  measuredAt: string;
};

export type FermProfileItem = {
  timePoint: Date;
  value: string;
};
