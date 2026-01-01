import Database from 'better-sqlite3';
import * as logHelper from '../helpers/logHelper';
import * as path from 'path';

const logger = logHelper.getLogger('application');

const initializeDatabase = function (db: Database.Database) {
  logger.info('Initializing SQLite database schema...');

  // Create Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS Users (
      Id INTEGER PRIMARY KEY AUTOINCREMENT,
      Name TEXT NOT NULL,
      Token TEXT NOT NULL,
      Active INTEGER NOT NULL
    )
  `);
  logger.info('Created Users table');

  // Create Fermentors table
  db.exec(`
    CREATE TABLE IF NOT EXISTS Fermentors (
      Id INTEGER PRIMARY KEY AUTOINCREMENT,
      Name TEXT,
      Comment TEXT
    )
  `);
  logger.info('Created Fermentors table');

  // Create Sensors table
  db.exec(`
    CREATE TABLE IF NOT EXISTS Sensors (
      Id INTEGER PRIMARY KEY AUTOINCREMENT,
      Name TEXT,
      Comment TEXT
    )
  `);
  logger.info('Created Sensors table');

  // Create Batches table
  db.exec(`
    CREATE TABLE IF NOT EXISTS Batches (
      Id INTEGER PRIMARY KEY AUTOINCREMENT,
      BatchNo INTEGER NOT NULL,
      RecipeName TEXT NOT NULL,
      FermentorId INTEGER NOT NULL,
      FermentationStart TEXT NOT NULL,
      FermentationEnd TEXT,
      FOREIGN KEY (FermentorId) REFERENCES Fermentors(Id)
    )
  `);
  logger.info('Created Batches table');

  // Create Temperature table
  db.exec(`
    CREATE TABLE IF NOT EXISTS Temperature (
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
  logger.info('Created Temperature table');

  // Create FermentationProfiles table
  db.exec(`
    CREATE TABLE IF NOT EXISTS FermentationProfiles (
      Id INTEGER PRIMARY KEY AUTOINCREMENT,
      BatchId INTEGER NOT NULL,
      Value REAL NOT NULL,
      TimePoint TEXT NOT NULL,
      FOREIGN KEY (BatchId) REFERENCES Batches(Id)
    )
  `);
  logger.info('Created FermentationProfiles table');

  // Create indexes for better query performance
  db.exec(`CREATE INDEX IF NOT EXISTS idx_temperature_measuredat ON Temperature(MeasuredAt)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_temperature_fermentorid ON Temperature(FermentorId)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_batches_fermentorid ON Batches(FermentorId)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_fermentationprofiles_batchid ON FermentationProfiles(BatchId)`);

  logger.info('Database schema initialization complete');
};

export { initializeDatabase };
