import request from 'supertest';
import express from 'express';
import passport from 'passport';
import { Strategy } from 'passport-http-bearer';
import * as path from 'path';
import * as fs from 'fs';
import Database from 'better-sqlite3';

// Test database path
const TEST_DB_PATH = path.join(__dirname, '../test_data/api_test.db');

// Ensure test data directory exists
const testDataDir = path.dirname(TEST_DB_PATH);
if (!fs.existsSync(testDataDir)) {
  fs.mkdirSync(testDataDir, { recursive: true });
}

// Create a test app with in-memory SQLite database
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
  const fermentorResult = db.prepare('INSERT INTO Fermentors (Name) VALUES (?)').run('Test Fermentor');
  const sensorResult = db.prepare('INSERT INTO Sensors (Name) VALUES (?)').run('Test Sensor');

  // Configure passport
  const strategy = new Strategy(async (token: string, cb: Function) => {
    const user = db.prepare('SELECT Name FROM Users WHERE Active = 1 AND Token = ?').get(token) as { Name: string } | undefined;
    if (user) {
      return cb(null, user);
    }
    return cb(null, false);
  });
  passport.use(strategy);

  const app = express();
  app.use(express.json());

  // Temperature routes
  app.get('/api/temperature', passport.authenticate('bearer', { session: false }), (req: any, res: any) => {
    try {
      let query = `SELECT T.Value, T.Location, T.MeasuredAt, S.Name AS Sensor, F.Name AS Fermentor
        FROM Temperature T
        LEFT JOIN Sensors S ON T.SensorId = S.Id
        LEFT JOIN Fermentors F ON T.FermentorId = F.Id
        LEFT JOIN Batches B
        ON (T.MeasuredAt >= B.FermentationStart) AND (T.MeasuredAt <= IFNULL(B.FermentationEnd, '2999-01-01 00:00:00'))
        WHERE 1=1`;

      const params: any[] = [];

      if (req.query.from) {
        query += ' AND MeasuredAt >= ?';
        params.push(req.query.from);
      }
      if (req.query.to) {
        query += ' AND MeasuredAt <= ?';
        params.push(req.query.to);
      }

      query += ' ORDER BY MeasuredAt';

      const stmt = db.prepare(query);
      const results = stmt.all(...params);
      res.json(results);
    } catch (err) {
      res.status(500).json(err);
    }
  });

  app.post('/api/temperature', passport.authenticate('bearer', { session: false }), (req: any, res: any) => {
    try {
      const { value, location, measuredAt, sensorName, fermentorName } = req.body;

      // Validate payload
      if (!value || !measuredAt || !location) {
        return res.sendStatus(400);
      }
      if (typeof value !== 'number' || typeof measuredAt !== 'number' || typeof location !== 'string') {
        return res.sendStatus(400);
      }

      const sensorStmt = db.prepare('SELECT Id FROM Sensors WHERE Name = ?');
      const sensor = sensorStmt.get(sensorName) as { Id: number } | undefined;

      const fermentorStmt = db.prepare('SELECT Id FROM Fermentors WHERE Name = ?');
      const fermentor = fermentorStmt.get(fermentorName) as { Id: number } | undefined;

      const insertStmt = db.prepare(
        'INSERT INTO Temperature (Value, Location, MeasuredAt, SensorId, FermentorId) VALUES (?, ?, ?, ?, ?)'
      );
      insertStmt.run(value.toFixed(2), location, new Date(measuredAt).toISOString(), sensor?.Id || null, fermentor?.Id || null);

      res.sendStatus(200);
    } catch (err) {
      res.status(500).json(err);
    }
  });

  // Batches routes
  app.get('/api/batchdata', passport.authenticate('bearer', { session: false }), (req: any, res: any) => {
    try {
      const results = db.prepare('SELECT Id, BatchNo, RecipeName, FermentationStart, FermentationEnd FROM Batches').all();
      res.json(results);
    } catch (err) {
      res.status(500).json(err);
    }
  });

  // Fermentation profile routes
  app.get('/api/fermentationProfile', passport.authenticate('bearer', { session: false }), (req: any, res: any) => {
    try {
      if (!req.query.batchId) {
        return res.status(400).send('Missing batchId in query string');
      }

      const stmt = db.prepare('SELECT Value, TimePoint FROM FermentationProfiles WHERE BatchId = ? ORDER BY TimePoint ASC');
      const results = stmt.all(req.query.batchId);
      res.json(results);
    } catch (err) {
      res.status(500).json(err);
    }
  });

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
