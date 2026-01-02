import { DatabaseConfig, PoolConfig } from '../types';
import * as fs from 'fs';
import * as path from 'path';

let poolConfig = {} as PoolConfig;
let databaseConfig = {} as DatabaseConfig;
let batchDataApiKey = '';

/**
 * Get configuration value from environment variable or config file
 * Environment variables take precedence over config file values
 */
const getConfigValue = (envKey: string, configValue: unknown, defaultValue: unknown): unknown => {
  const envValue = process.env[envKey];
  if (envValue !== undefined) {
    return envValue;
  }
  if (configValue !== undefined) {
    return configValue;
  }
  return defaultValue;
};

/**
 * Parse environment variable with type coercion
 */
const parseEnvValue = (value: unknown, type: 'string' | 'number' | 'boolean'): unknown => {
  if (typeof value !== 'string') return value;
  switch (type) {
    case 'number':
      const parsed = parseInt(value, 10);
      return isNaN(parsed) ? value : parsed;
    case 'boolean':
      return value.toLowerCase() === 'true';
    default:
      return value;
  }
};

const setConfigValues = function () {
  // Load config file as fallback
  let configFile: Record<string, unknown> = {};
  try {
    const configPath = path.join(__dirname, '../../src/config.json');
    if (fs.existsSync(configPath)) {
      configFile = JSON.parse(fs.readFileSync(configPath).toString());
    }
  } catch (err) {
    // Config file not found or invalid, use defaults
  }

  // Database configuration with environment variable override
  databaseConfig.databasePath = getConfigValue(
    'DB_PATH',
    configFile.dbPath,
    './brewback.db'
  ) as string;

  // Pool configuration with environment variable overrides
  poolConfig.size = parseEnvValue(
    getConfigValue('DB_POOL_SIZE', configFile.dbPoolSize, 5),
    'number'
  ) as number;

  poolConfig.getTimeout = parseEnvValue(
    getConfigValue('DB_POOL_GET_TIMEOUT', configFile.dbPoolGetTimeout, 3000),
    'number'
  ) as number;

  poolConfig.retryInterval = parseEnvValue(
    getConfigValue('DB_POOL_RETRY_INTERVAL', configFile.dbPoolRetryInterval, 50),
    'number'
  ) as number;

  // Batch data API key with environment variable override
  batchDataApiKey = getConfigValue(
    'BATCH_DATA_API_KEY',
    configFile.batchDataApiKey,
    ''
  ) as string;
};

const getDatabaseConfig = function () {
  return {
    databasePath: databaseConfig.databasePath,
  };
};

export { setConfigValues };
export { getDatabaseConfig };
export { poolConfig };
export { batchDataApiKey };
