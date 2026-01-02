import { FermentationProfile, mapFermentationProfileRow, FermentationProfileRow } from '../../repositories/fermentationProfileTypes';
import { FermentationProfileRepository } from '../../repositories/FermentationProfileRepository';
import { QueryParameter } from '../../types';

// Mock database functions
const createMockExecQuery = (results: FermentationProfileRow[]) => {
  return async (_sql: string, _params: QueryParameter[]): Promise<any[]> => {
    return results;
  };
};

const createMockExecNonQuery = () => {
  return async (_sql: string, _params: QueryParameter[]): Promise<void> => {
    // No-op for tests
  };
};

describe('FermentationProfileRepository', () => {
  let repository: FermentationProfileRepository;

  describe('findByBatchId', () => {
    it('should return profiles for a batch', async () => {
      const mockRows: FermentationProfileRow[] = [
        { Id: 1, BatchId: 1, Value: 20.0, TimePoint: '2025-01-01T12:00:00.000Z' },
        { Id: 2, BatchId: 1, Value: 22.0, TimePoint: '2025-01-02T12:00:00.000Z' },
      ];
      repository = new FermentationProfileRepository(createMockExecQuery(mockRows), createMockExecNonQuery());

      const result = await repository.findByBatchId(1);

      expect(result).toHaveLength(2);
      expect(result[0].Value).toBe(20.0);
      expect(result[1].Value).toBe(22.0);
    });

    it('should return empty array when no profiles exist', async () => {
      const mockRows: FermentationProfileRow[] = [];
      repository = new FermentationProfileRepository(createMockExecQuery(mockRows), createMockExecNonQuery());

      const result = await repository.findByBatchId(999);

      expect(result).toHaveLength(0);
    });

    it('should return profiles ordered by TimePoint', async () => {
      // Note: The mock returns results as-is, so we provide pre-sorted data
      const mockRows: FermentationProfileRow[] = [
        { Id: 1, BatchId: 1, Value: 20.0, TimePoint: '2025-01-01T12:00:00.000Z' },
        { Id: 2, BatchId: 1, Value: 21.0, TimePoint: '2025-01-02T12:00:00.000Z' },
        { Id: 3, BatchId: 1, Value: 22.0, TimePoint: '2025-01-03T12:00:00.000Z' },
      ];
      repository = new FermentationProfileRepository(createMockExecQuery(mockRows), createMockExecNonQuery());

      const result = await repository.findByBatchId(1);

      expect(result).toHaveLength(3);
      // Mock returns rows in provided order (ORDER BY is SQL-level, not simulated in mock)
      expect(result[0].TimePoint).toBe('2025-01-01T12:00:00.000Z');
      expect(result[1].TimePoint).toBe('2025-01-02T12:00:00.000Z');
      expect(result[2].TimePoint).toBe('2025-01-03T12:00:00.000Z');
    });
  });

  describe('deleteByBatchId', () => {
    it('should not throw error when deleting existing profiles', async () => {
      repository = new FermentationProfileRepository(createMockExecQuery([]), createMockExecNonQuery());

      await expect(repository.deleteByBatchId(1)).resolves.not.toThrow();
    });

    it('should not throw error when deleting non-existent profiles', async () => {
      repository = new FermentationProfileRepository(createMockExecQuery([]), createMockExecNonQuery());

      await expect(repository.deleteByBatchId(999)).resolves.not.toThrow();
    });
  });

  describe('create', () => {
    it('should create fermentation profile', async () => {
      repository = new FermentationProfileRepository(createMockExecQuery([]), createMockExecNonQuery());

      const result = await repository.create({
        batchId: 1,
        value: 20.5,
        timePoint: '2025-01-01T12:00:00.000Z',
      });

      expect(result.BatchId).toBe(1);
      expect(result.Value).toBe(20.5);
      expect(result.TimePoint).toBe('2025-01-01T12:00:00.000Z');
    });

    it('should handle various temperature values', async () => {
      repository = new FermentationProfileRepository(createMockExecQuery([]), createMockExecNonQuery());

      const result = await repository.create({
        batchId: 1,
        value: 18.0,
        timePoint: '2025-01-01T12:00:00.000Z',
      });

      expect(result.Value).toBe(18.0);
    });
  });

  describe('mapFermentationProfileRow', () => {
    it('should correctly map all fields', () => {
      const row: FermentationProfileRow = {
        Id: 42,
        BatchId: 1,
        Value: 19.5,
        TimePoint: '2025-06-15T12:30:00.000Z',
      };

      const result = mapFermentationProfileRow(row);

      expect(result.Id).toBe(42);
      expect(result.BatchId).toBe(1);
      expect(result.Value).toBe(19.5);
      expect(result.TimePoint).toBe('2025-06-15T12:30:00.000Z');
    });

    it('should handle edge case values', () => {
      const row: FermentationProfileRow = {
        Id: 0,
        BatchId: 1,
        Value: 0,
        TimePoint: '2025-01-01T00:00:00.000Z',
      };

      const result = mapFermentationProfileRow(row);

      expect(result.Id).toBe(0);
      expect(result.Value).toBe(0);
    });
  });
});
