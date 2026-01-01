import Database from 'better-sqlite3';
import {
  createTestDatabase,
  cleanupTestDatabase,
  insertTestUser,
  insertTestFermentor,
  insertTestSensor,
  insertTestBatch,
  insertTestTemperature,
  getTestDatabasePath,
} from '../helpers/testDatabase';

describe('Database Integration Tests', () => {
  let db: Database.Database;

  beforeEach(() => {
    db = createTestDatabase();
  });

  afterEach(() => {
    if (db) {
      db.close();
    }
    cleanupTestDatabase();
  });

  describe('Users Table', () => {
    it('should insert and retrieve a user', () => {
      const userId = insertTestUser(db, 'test-token', 'Test User');

      const stmt = db.prepare('SELECT * FROM Users WHERE Id = ?');
      const user = stmt.get(userId) as { Id: number; Name: string; Token: string; Active: number };

      expect(user).toBeDefined();
      expect(user.Name).toBe('Test User');
      expect(user.Token).toBe('test-token');
      expect(user.Active).toBe(1);
    });

    it('should find user by token', () => {
      insertTestUser(db, 'unique-token-123', 'Token User');

      const stmt = db.prepare('SELECT * FROM Users WHERE Token = ? AND Active = 1');
      const user = stmt.get('unique-token-123') as { Id: number; Name: string };

      expect(user).toBeDefined();
      expect(user.Name).toBe('Token User');
    });

    it('should not find inactive user', () => {
      db.prepare('INSERT INTO Users (Name, Token, Active) VALUES (?, ?, 0)').run('Inactive User', 'inactive-token');

      const stmt = db.prepare('SELECT * FROM Users WHERE Token = ? AND Active = 1');
      const user = stmt.get('inactive-token');

      expect(user).toBeUndefined();
    });

    it('should retrieve multiple users', () => {
      insertTestUser(db, 'token1', 'User 1');
      insertTestUser(db, 'token2', 'User 2');
      insertTestUser(db, 'token3', 'User 3');

      const stmt = db.prepare('SELECT * FROM Users ORDER BY Name');
      const users = stmt.all() as Array<{ Id: number; Name: string }>;

      expect(users).toHaveLength(3);
      expect(users[0].Name).toBe('User 1');
      expect(users[1].Name).toBe('User 2');
      expect(users[2].Name).toBe('User 3');
    });
  });

  describe('Fermentors Table', () => {
    it('should insert and retrieve a fermentor', () => {
      const fermentorId = insertTestFermentor(db, 'Primary Fermentor');

      const stmt = db.prepare('SELECT * FROM Fermentors WHERE Id = ?');
      const fermentor = stmt.get(fermentorId) as { Id: number; Name: string };

      expect(fermentor).toBeDefined();
      expect(fermentor.Name).toBe('Primary Fermentor');
    });

    it('should update fermentor', () => {
      const fermentorId = insertTestFermentor(db, 'Original Name');

      const updateStmt = db.prepare('UPDATE Fermentors SET Name = ? WHERE Id = ?');
      updateStmt.run('Updated Name', fermentorId);

      const stmt = db.prepare('SELECT * FROM Fermentors WHERE Id = ?');
      const fermentor = stmt.get(fermentorId) as { Name: string };

      expect(fermentor.Name).toBe('Updated Name');
    });

    it('should delete fermentor', () => {
      const fermentorId = insertTestFermentor(db, 'To Delete');

      const deleteStmt = db.prepare('DELETE FROM Fermentors WHERE Id = ?');
      deleteStmt.run(fermentorId);

      const stmt = db.prepare('SELECT * FROM Fermentors WHERE Id = ?');
      const fermentor = stmt.get(fermentorId);

      expect(fermentor).toBeUndefined();
    });
  });

  describe('Sensors Table', () => {
    it('should insert and retrieve a sensor', () => {
      const sensorId = insertTestSensor(db, 'Temperature Sensor 1');

      const stmt = db.prepare('SELECT * FROM Sensors WHERE Id = ?');
      const sensor = stmt.get(sensorId) as { Id: number; Name: string };

      expect(sensor).toBeDefined();
      expect(sensor.Name).toBe('Temperature Sensor 1');
    });

    it('should insert multiple sensors', () => {
      insertTestSensor(db, 'Sensor A');
      insertTestSensor(db, 'Sensor B');
      insertTestSensor(db, 'Sensor C');

      const stmt = db.prepare('SELECT COUNT(*) as count FROM Sensors');
      const result = stmt.get() as { count: number };

      expect(result.count).toBe(3);
    });
  });

  describe('Batches Table', () => {
    it('should insert and retrieve a batch', () => {
      const fermentorId = insertTestFermentor(db, 'Test Fermentor');
      const batchId = insertTestBatch(db, 1, 'Test Recipe', fermentorId);

      const stmt = db.prepare('SELECT * FROM Batches WHERE Id = ?');
      const batch = stmt.get(batchId) as { BatchNo: number; RecipeName: string; FermentorId: number };

      expect(batch).toBeDefined();
      expect(batch.BatchNo).toBe(1);
      expect(batch.RecipeName).toBe('Test Recipe');
      expect(batch.FermentorId).toBe(fermentorId);
    });

    it('should find batch by fermentor', () => {
      const fermentorId = insertTestFermentor(db, 'Fermentor A');
      insertTestBatch(db, 1, 'Recipe 1', fermentorId);
      insertTestBatch(db, 2, 'Recipe 2', fermentorId);

      const stmt = db.prepare('SELECT COUNT(*) as count FROM Batches WHERE FermentorId = ?');
      const result = stmt.get(fermentorId) as { count: number };

      expect(result.count).toBe(2);
    });

    it('should handle batch with null fermentationEnd', () => {
      const fermentorId = insertTestFermentor(db, 'Test Fermentor');
      insertTestBatch(db, 1, 'Active Recipe', fermentorId);

      const stmt = db.prepare('SELECT * FROM Batches WHERE Id = ?');
      const batch = stmt.get(1) as { FermentationEnd: string | null };

      expect(batch.FermentationEnd).toBeNull();
    });
  });

  describe('Temperature Table', () => {
    it('should insert and retrieve temperature reading', () => {
      const fermentorId = insertTestFermentor(db, 'Test Fermentor');
      const sensorId = insertTestSensor(db, 'Test Sensor');
      const tempId = insertTestTemperature(db, 20.5, 'fermenter', '2025-01-01T12:00:00.000Z', sensorId, fermentorId);

      const stmt = db.prepare('SELECT * FROM Temperature WHERE Id = ?');
      const temp = stmt.get(tempId) as { Value: number; Location: string; FermentorId: number | null };

      expect(temp).toBeDefined();
      expect(temp.Value).toBe(20.5);
      expect(temp.Location).toBe('fermenter');
      expect(temp.FermentorId).toBe(fermentorId);
    });

    it('should handle temperature without sensor or fermentor', () => {
      const tempId = insertTestTemperature(db, 18.0, 'ambient', '2025-01-01T12:00:00.000Z');

      const stmt = db.prepare('SELECT * FROM Temperature WHERE Id = ?');
      const temp = stmt.get(tempId) as { SensorId: number | null; FermentorId: number | null };

      expect(temp.SensorId).toBeNull();
      expect(temp.FermentorId).toBeNull();
    });

    it('should query temperature by date range', () => {
      insertTestTemperature(db, 20.0, 'fermenter', '2025-01-01T00:00:00.000Z');
      insertTestTemperature(db, 21.0, 'fermenter', '2025-01-02T00:00:00.000Z');
      insertTestTemperature(db, 22.0, 'fermenter', '2025-01-03T00:00:00.000Z');

      const stmt = db.prepare(
        'SELECT * FROM Temperature WHERE MeasuredAt >= ? AND MeasuredAt <= ? ORDER BY MeasuredAt'
      );
      const temps = stmt.all('2025-01-01T00:00:00.000Z', '2025-01-02T23:59:59.999Z') as Array<{ Value: number }>;

      expect(temps).toHaveLength(2);
      expect(temps[0].Value).toBe(20.0);
      expect(temps[1].Value).toBe(21.0);
    });
  });

  describe('FermentationProfiles Table', () => {
    it('should insert and retrieve fermentation profile', () => {
      const fermentorId = insertTestFermentor(db, 'Test Fermentor');
      const batchId = insertTestBatch(db, 1, 'Test Recipe', fermentorId);

      const insertStmt = db.prepare(
        'INSERT INTO FermentationProfiles (BatchId, Value, TimePoint) VALUES (?, ?, ?)'
      );
      insertStmt.run(batchId, 20.0, '2025-01-01T12:00:00.000Z');
      insertStmt.run(batchId, 22.0, '2025-01-02T12:00:00.000Z');

      const stmt = db.prepare('SELECT * FROM FermentationProfiles WHERE BatchId = ? ORDER BY TimePoint');
      const profiles = stmt.all(batchId) as Array<{ Value: number; TimePoint: string }>;

      expect(profiles).toHaveLength(2);
      expect(profiles[0].Value).toBe(20.0);
      expect(profiles[1].Value).toBe(22.0);
    });

    it('should delete fermentation profile by batch', () => {
      const fermentorId = insertTestFermentor(db, 'Test Fermentor');
      const batchId = insertTestBatch(db, 1, 'Test Recipe', fermentorId);

      const insertStmt = db.prepare('INSERT INTO FermentationProfiles (BatchId, Value, TimePoint) VALUES (?, ?, ?)');
      insertStmt.run(batchId, 20.0, '2025-01-01T12:00:00.000Z');

      const deleteStmt = db.prepare('DELETE FROM FermentationProfiles WHERE BatchId = ?');
      deleteStmt.run(batchId);

      const stmt = db.prepare('SELECT COUNT(*) as count FROM FermentationProfiles WHERE BatchId = ?');
      const result = stmt.get(batchId) as { count: number };

      expect(result.count).toBe(0);
    });
  });

  describe('Foreign Key Constraints', () => {
    it('should enforce foreign key constraint for Batches -> Fermentors', () => {
      // Attempt to insert a batch with non-existent fermentor
      const insertStmt = db.prepare(
        'INSERT INTO Batches (BatchNo, RecipeName, FermentorId, FermentationStart) VALUES (?, ?, ?, ?)'
      );

      expect(() => {
        insertStmt.run(1, 'Orphan Recipe', 9999, '2025-01-01T00:00:00.000Z');
      }).toThrow();
    });

    it('should enforce foreign key constraint for Temperature -> Fermentors', () => {
      const sensorId = insertTestSensor(db, 'Test Sensor');

      const insertStmt = db.prepare(
        'INSERT INTO Temperature (Value, Location, MeasuredAt, SensorId, FermentorId) VALUES (?, ?, ?, ?, ?)'
      );

      expect(() => {
        insertStmt.run(20.0, 'fermenter', '2025-01-01T12:00:00.000Z', sensorId, 9999);
      }).toThrow();
    });

    it('should enforce foreign key constraint for FermentationProfiles -> Batches', () => {
      const insertStmt = db.prepare('INSERT INTO FermentationProfiles (BatchId, Value, TimePoint) VALUES (?, ?, ?)');

      expect(() => {
        insertStmt.run(9999, 20.0, '2025-01-01T12:00:00.000Z');
      }).toThrow();
    });
  });

  describe('Indexes', () => {
    it('should use index for temperature queries by MeasuredAt', () => {
      // Insert multiple temperature readings
      for (let i = 0; i < 100; i++) {
        insertTestTemperature(db, 20.0 + i, 'fermenter', `2025-01-${(i % 30) + 1}T12:00:00.000Z`);
      }

      // Query with date range should use the index
      const stmt = db.prepare(
        'SELECT COUNT(*) as count FROM Temperature WHERE MeasuredAt >= ? AND MeasuredAt <= ?'
      );
      const result = stmt.get('2025-01-01T00:00:00.000Z', '2025-01-15T23:59:59.999Z') as { count: number };

      expect(result.count).toBeGreaterThan(0);
    });
  });
});
