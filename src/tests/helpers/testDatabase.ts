import Database from 'better-sqlite3';
import * as path from 'path';

// Test database path - uses a separate file for testing
const TEST_DB_PATH = path.join(__dirname, '../test_data/brewback_test.db');

// Ensure test data directory exists
import * as fs from 'fs';
const testDataDir = path.dirname(TEST_DB_PATH);
if (!fs.existsSync(testDataDir)) {
  fs.mkdirSync(testDataDir, { recursive: true });
}

/**
 * Create a fresh test database with schema
 */
export const createTestDatabase = (): Database.Database => {
  // Remove existing test database if it exists
  if (fs.existsSync(TEST_DB_PATH)) {
    fs.unlinkSync(TEST_DB_PATH);
  }

  const db = new Database(TEST_DB_PATH);
  db.pragma('foreign_keys = ON');

  // Create schema (same as production)
  db.exec(`
    CREATE TABLE Users (
      Id INTEGER PRIMARY KEY AUTOINCREMENT,
      Name TEXT NOT NULL,
      Token TEXT NOT NULL,
      Active INTEGER NOT NULL
    )
  `);

  db.exec(`
    CREATE TABLE Fermentors (
      Id INTEGER PRIMARY KEY AUTOINCREMENT,
      Name TEXT,
      Comment TEXT
    )
  `);

  db.exec(`
    CREATE TABLE Sensors (
      Id INTEGER PRIMARY KEY AUTOINCREMENT,
      Name TEXT,
      Comment TEXT
    )
  `);

  db.exec(`
    CREATE TABLE Batches (
      Id INTEGER PRIMARY KEY AUTOINCREMENT,
      BatchNo INTEGER NOT NULL,
      RecipeName TEXT NOT NULL,
      FermentorId INTEGER NOT NULL,
      FermentationStart TEXT NOT NULL,
      FermentationEnd TEXT,
      FOREIGN KEY (FermentorId) REFERENCES Fermentors(Id)
    )
  `);

  db.exec(`
    CREATE TABLE Temperature (
      Id INTEGER PRIMARY KEY AUTOINCREMENT,
      Value REAL NOT NULL,
      Location TEXT,
      MeasuredAt TEXT NOT NULL,
      SensorId INTEGER,
      FermentorId INTEGER,
      FOREIGN KEY (SensorId) REFERENCES Sensors(Id),
      FOREIGN KEY (FermentorId) REFERENCES Fermentors(Id)
    )
  `);

  db.exec(`
    CREATE TABLE FermentationProfiles (
      Id INTEGER PRIMARY KEY AUTOINCREMENT,
      BatchId INTEGER NOT NULL,
      Value REAL NOT NULL,
      TimePoint TEXT NOT NULL,
      FOREIGN KEY (BatchId) REFERENCES Batches(Id)
    )
  `);

  return db;
};

/**
 * Clean up test database
 */
export const cleanupTestDatabase = (): void => {
  if (fs.existsSync(TEST_DB_PATH)) {
    fs.unlinkSync(TEST_DB_PATH);
  }
};

/**
 * Get test database path
 */
export const getTestDatabasePath = (): string => TEST_DB_PATH;

/**
 * Insert test user
 */
export const insertTestUser = (db: Database.Database, token: string = 'test-token-123', name: string = 'TestUser'): number => {
  const stmt = db.prepare('INSERT INTO Users (Name, Token, Active) VALUES (?, ?, 1)');
  const result = stmt.run(name, token);
  return result.lastInsertRowid as number;
};

/**
 * Insert test fermentor
 */
export const insertTestFermentor = (db: Database.Database, name: string = 'Test Fermentor'): number => {
  const stmt = db.prepare('INSERT INTO Fermentors (Name) VALUES (?)');
  const result = stmt.run(name);
  return result.lastInsertRowid as number;
};

/**
 * Insert test sensor
 */
export const insertTestSensor = (db: Database.Database, name: string = 'Test Sensor'): number => {
  const stmt = db.prepare('INSERT INTO Sensors (Name) VALUES (?)');
  const result = stmt.run(name);
  return result.lastInsertRowid as number;
};

/**
 * Insert test batch
 */
export const insertTestBatch = (
  db: Database.Database,
  batchNo: number,
  recipeName: string,
  fermentorId: number,
  fermentationStart: string = '2025-01-01T00:00:00.000Z',
  fermentationEnd: string | null = null
): number => {
  const stmt = db.prepare(
    'INSERT INTO Batches (BatchNo, RecipeName, FermentorId, FermentationStart, FermentationEnd) VALUES (?, ?, ?, ?, ?)'
  );
  const result = stmt.run(batchNo, recipeName, fermentorId, fermentationStart, fermentationEnd);
  return result.lastInsertRowid as number;
};

/**
 * Insert test temperature reading
 */
export const insertTestTemperature = (
  db: Database.Database,
  value: number,
  location: string,
  measuredAt: string,
  sensorId?: number,
  fermentorId?: number
): number => {
  const stmt = db.prepare(
    'INSERT INTO Temperature (Value, Location, MeasuredAt, SensorId, FermentorId) VALUES (?, ?, ?, ?, ?)'
  );
  const result = stmt.run(value, location, measuredAt, sensorId || null, fermentorId || null);
  return result.lastInsertRowid as number;
};
