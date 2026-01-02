import request from 'supertest';
import express from 'express';
import * as path from 'path';
import * as fs from 'fs';
import Database from 'better-sqlite3';
import { createTemperatureRouter } from '../../routes/temperature';
import { createBatchDataRouter } from '../../routes/batchdata';
import { createFermentationProfileRouter } from '../../routes/fermentationProfile';
import {
  UserRepository,
  TemperatureRepository,
  BatchRepository,
  FermentationProfileRepository,
} from '../../repositories';
import { QueryParameter, RowResult } from '../../types';

// Test database path
const TEST_DB_PATH = path.join(__dirname, '../test_data/api_test.db');

// Ensure test data directory exists
const testDataDir = path.dirname(TEST_DB_PATH);
if (!fs.existsSync(testDataDir)) {
  fs.mkdirSync(testDataDir, { recursive: true });
}

// Generic query executor for tests
type QueryExecutor = (sql: string, params: QueryParameter[]) => Promise<RowResult[]>;
type NonQueryExecutor = (sql: string, params: QueryParameter[]) => Promise<void>;

/**
 * Create a test app with a fresh test database and repositories
 */
const createTestApp = () => {
  // Clean up existing test database
  if (fs.existsSync(TEST_DB_PATH)) {
    fs.unlinkSync(TEST_DB_PATH);
  }

  const db = new Database(TEST_DB_PATH);
  db.pragma('foreign_keys = ON');

  // Create schema
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

  // Insert test user
  db.prepare('INSERT INTO Users (Name, Token, Active) VALUES (?, ?, 1)').run('TestUser', 'test-token-123');

  // Insert test fermentor and sensor
  db.prepare('INSERT INTO Fermentors (Name) VALUES (?)').run('Test Fermentor');
  db.prepare('INSERT INTO Sensors (Name) VALUES (?)').run('Test Sensor');

  // Create query executors
  const execQueryFn: QueryExecutor = async (sql: string, params: QueryParameter[]) => {
    const values = params.map((p) => p.value);
    const stmt = db.prepare(sql);
    return stmt.all(...values) as RowResult[];
  };

  const execNonQueryFn: NonQueryExecutor = async (sql: string, params: QueryParameter[]) => {
    const values = params.map((p) => p.value);
    const stmt = db.prepare(sql);
    stmt.run(...values);
  };

  // User lookup function for test authentication
  const getUserByToken = async (token: string) => {
    const user = db.prepare('SELECT Name FROM Users WHERE Active = 1 AND Token = ?').get(token) as { Name: string } | undefined;
    return user || null;
  };

  // Create repositories with test database
  const userRepository = new UserRepository(execQueryFn);
  const temperatureRepository = new TemperatureRepository(execQueryFn, execNonQueryFn);
  const batchRepository = new BatchRepository(execQueryFn, execNonQueryFn);
  const fermentationProfileRepository = new FermentationProfileRepository(execQueryFn, execNonQueryFn);

  const app = express();
  app.use(express.json());

  // Use actual route factories with test repositories
  app.use('/api/temperature', createTemperatureRouter(getUserByToken, temperatureRepository));
  app.use('/api/batchdata', createBatchDataRouter(getUserByToken, batchRepository, fermentationProfileRepository));
  app.use('/api/fermentationProfile', createFermentationProfileRouter(getUserByToken, fermentationProfileRepository));

  app.all('*', (req: any, res: any) => {
    res.sendStatus(404);
  });

  return { app, db };
};

describe('API Integration Tests', () => {
  let app: express.Express;
  let db: Database.Database;

  beforeEach(() => {
    const testSetup = createTestApp();
    app = testSetup.app;
    db = testSetup.db;
  });

  afterEach(() => {
    if (db) {
      db.close();
    }
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
  });

  describe('Authentication', () => {
    it('should reject requests without Authorization header', () => {
      return request(app).get('/api/temperature').expect(401);
    });

    it('should reject requests with invalid token', () => {
      return request(app)
        .get('/api/temperature')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should accept requests with valid token', () => {
      return request(app)
        .get('/api/temperature')
        .set('Authorization', 'Bearer test-token-123')
        .expect(200);
    });
  });

  describe('GET /api/temperature', () => {
    beforeEach(() => {
      // Insert test temperature data
      db.prepare(
        'INSERT INTO Temperature (Value, Location, MeasuredAt, SensorId, FermentorId) VALUES (?, ?, ?, ?, ?)'
      ).run(20.5, 'fermenter', '2025-01-01T12:00:00.000Z', 1, 1);
      db.prepare(
        'INSERT INTO Temperature (Value, Location, MeasuredAt, SensorId, FermentorId) VALUES (?, ?, ?, ?, ?)'
      ).run(21.0, 'fermenter', '2025-01-02T12:00:00.000Z', 1, 1);
    });

    it('should return temperature readings with authentication', () => {
      return request(app)
        .get('/api/temperature')
        .set('Authorization', 'Bearer test-token-123')
        .expect(200)
        .expect((res: any) => {
          expect(res.body).toHaveLength(2);
          expect(res.body[0].Value).toBe(20.5);
          expect(res.body[1].Value).toBe(21.0);
        });
    });

    it('should filter by from date', () => {
      return request(app)
        .get('/api/temperature')
        .query({ from: '2025-01-02T00:00:00.000Z' })
        .set('Authorization', 'Bearer test-token-123')
        .expect(200)
        .expect((res: any) => {
          expect(res.body).toHaveLength(1);
          expect(res.body[0].Value).toBe(21.0);
        });
    });

    it('should filter by to date', () => {
      return request(app)
        .get('/api/temperature')
        .query({ to: '2025-01-01T23:59:59.999Z' })
        .set('Authorization', 'Bearer test-token-123')
        .expect(200)
        .expect((res: any) => {
          expect(res.body).toHaveLength(1);
          expect(res.body[0].Value).toBe(20.5);
        });
    });

    it('should filter by date range', () => {
      return request(app)
        .get('/api/temperature')
        .query({ from: '2025-01-01T00:00:00.000Z', to: '2025-01-01T23:59:59.999Z' })
        .set('Authorization', 'Bearer test-token-123')
        .expect(200)
        .expect((res: any) => {
          expect(res.body).toHaveLength(1);
        });
    });
  });

  describe('POST /api/temperature', () => {
    it('should create temperature reading', () => {
      return request(app)
        .post('/api/temperature')
        .set('Authorization', 'Bearer test-token-123')
        .send({
          value: 22.5,
          location: 'fermenter',
          measuredAt: Date.now(),
          sensorName: 'Test Sensor',
          fermentorName: 'Test Fermentor',
        })
        .expect(200)
        .expect(() => {
          const temps = db.prepare('SELECT * FROM Temperature').all() as any[];
          expect(temps).toHaveLength(1);
          expect(temps[0].Value).toBe(22.5);
          expect(temps[0].Location).toBe('fermenter');
        });
    });

    it('should return 400 for invalid payload', () => {
      return request(app)
        .post('/api/temperature')
        .set('Authorization', 'Bearer test-token-123')
        .send({})
        .expect(400);
    });
  });

  describe('GET /api/batchdata', () => {
    beforeEach(() => {
      // Insert test batch data
      db.prepare(
        'INSERT INTO Batches (BatchNo, RecipeName, FermentorId, FermentationStart) VALUES (?, ?, ?, ?)'
      ).run(1, 'Test Recipe', 1, '2025-01-01T00:00:00.000Z');
    });

    it('should return batch data', () => {
      return request(app)
        .get('/api/batchdata')
        .set('Authorization', 'Bearer test-token-123')
        .expect(200)
        .expect((res: any) => {
          expect(res.body).toHaveLength(1);
          expect(res.body[0].BatchNo).toBe(1);
          expect(res.body[0].RecipeName).toBe('Test Recipe');
        });
    });

    it('should return empty array when no batches exist', () => {
      // Clean up batches
      db.prepare('DELETE FROM Batches').run();

      return request(app)
        .get('/api/batchdata')
        .set('Authorization', 'Bearer test-token-123')
        .expect(200)
        .expect((res: any) => {
          expect(res.body).toHaveLength(0);
        });
    });
  });

  describe('GET /api/fermentationProfile', () => {
    beforeEach(() => {
      // Insert test batch and profile data
      db.prepare(
        'INSERT INTO Batches (BatchNo, RecipeName, FermentorId, FermentationStart) VALUES (?, ?, ?, ?)'
      ).run(1, 'Test Recipe', 1, '2025-01-01T00:00:00.000Z');
      db.prepare(
        'INSERT INTO FermentationProfiles (BatchId, Value, TimePoint) VALUES (?, ?, ?)'
      ).run(1, 20.0, '2025-01-01T12:00:00.000Z');
      db.prepare(
        'INSERT INTO FermentationProfiles (BatchId, Value, TimePoint) VALUES (?, ?, ?)'
      ).run(1, 22.0, '2025-01-02T12:00:00.000Z');
    });

    it('should return fermentation profile for batch', () => {
      return request(app)
        .get('/api/fermentationProfile')
        .query({ batchId: 1 })
        .set('Authorization', 'Bearer test-token-123')
        .expect(200)
        .expect((res: any) => {
          expect(res.body).toHaveLength(2);
          expect(res.body[0].Value).toBe(20.0);
          expect(res.body[1].Value).toBe(22.0);
        });
    });

    it('should return 400 when batchId is missing', () => {
      return request(app)
        .get('/api/fermentationProfile')
        .set('Authorization', 'Bearer test-token-123')
        .expect(400);
    });

    it('should return empty array for non-existent batch', () => {
      return request(app)
        .get('/api/fermentationProfile')
        .query({ batchId: 999 })
        .set('Authorization', 'Bearer test-token-123')
        .expect(200)
        .expect((res: any) => {
          expect(res.body).toHaveLength(0);
        });
    });
  });

  describe('404 handling', () => {
    it('should return 404 for unknown routes', () => {
      return request(app).get('/api/unknown').expect(404);
    });
  });
});
