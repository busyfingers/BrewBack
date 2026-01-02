import Database from 'better-sqlite3';

export type PoolConfig = {
  size: number;
  getTimeout: number;
  retryInterval: number;
};

export type DatabaseConfig = {
  databasePath: string;
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
  value: number;
  location: string;
  measuredAt: number;
};

export type FermProfileItem = {
  timePoint: Date;
  value: string;
};
