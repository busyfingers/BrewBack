import { Batch, mapBatchRow, BatchRow, CreateBatchDto } from '../../repositories/batchTypes';
import { BatchRepository } from '../../repositories/BatchRepository';
import { QueryParameter } from '../../types';

// Mock database functions
const createMockExecQuery = (results: BatchRow[]) => {
  return async (_sql: string, _params: QueryParameter[]): Promise<any[]> => {
    return results;
  };
};

const createMockExecNonQuery = () => {
  return async (_sql: string, _params: QueryParameter[]): Promise<void> => {
    // No-op for tests
  };
};

describe('BatchRepository', () => {
  let repository: BatchRepository;

  describe('findAll', () => {
    it('should return all batches', async () => {
      const mockRows: BatchRow[] = [
        { Id: 1, BatchNo: 1, RecipeName: 'Recipe1', FermentorId: 1, FermentationStart: '2025-01-01T00:00:00.000Z', FermentationEnd: null },
        { Id: 2, BatchNo: 2, RecipeName: 'Recipe2', FermentorId: 1, FermentationStart: '2025-02-01T00:00:00.000Z', FermentationEnd: '2025-02-15T00:00:00.000Z' },
      ];
      repository = new BatchRepository(createMockExecQuery(mockRows), createMockExecNonQuery());

      const result = await repository.findAll();

      expect(result).toHaveLength(2);
      expect(result[0].BatchNo).toBe(1);
      expect(result[1].BatchNo).toBe(2);
    });

    it('should return empty array when no batches exist', async () => {
      const mockRows: BatchRow[] = [];
      repository = new BatchRepository(createMockExecQuery(mockRows), createMockExecNonQuery());

      const result = await repository.findAll();

      expect(result).toHaveLength(0);
    });
  });

  describe('find', () => {
    it('should return batch when found', async () => {
      const mockRows: BatchRow[] = [
        { Id: 1, BatchNo: 1, RecipeName: 'TestRecipe', FermentorId: 1, FermentationStart: '2025-01-01T00:00:00.000Z', FermentationEnd: null },
      ];
      repository = new BatchRepository(createMockExecQuery(mockRows), createMockExecNonQuery());

      const result = await repository.find(1, 'TestRecipe', 1);

      expect(result).not.toBeNull();
      expect(result?.BatchNo).toBe(1);
      expect(result?.RecipeName).toBe('TestRecipe');
    });

    it('should return null when batch not found', async () => {
      const mockRows: BatchRow[] = [];
      repository = new BatchRepository(createMockExecQuery(mockRows), createMockExecNonQuery());

      const result = await repository.find(999, 'NonExistent', 1);

      expect(result).toBeNull();
    });
  });

  describe('upsert (create)', () => {
    it('should create new batch when exists is false', async () => {
      const mockRows: BatchRow[] = [
        { Id: 1, BatchNo: 1, RecipeName: 'NewRecipe', FermentorId: 1, FermentationStart: '2025-01-01T00:00:00.000Z', FermentationEnd: null },
      ];
      const execQuery = createMockExecQuery(mockRows);
      const execNonQuery = createMockExecNonQuery();
      repository = new BatchRepository(execQuery, execNonQuery);

      const dto: CreateBatchDto = {
        batchNo: 1,
        recipeName: 'NewRecipe',
        fermentorId: 1,
        fermentationStart: '2025-01-01T00:00:00.000Z',
        fermentationEnd: null,
      };

      const result = await repository.upsert(dto, false);

      expect(result.BatchNo).toBe(1);
      expect(result.RecipeName).toBe('NewRecipe');
    });
  });

  describe('mapBatchRow', () => {
    it('should correctly map all fields', () => {
      const row: BatchRow = {
        Id: 42,
        BatchNo: 1,
        RecipeName: 'TestRecipe',
        FermentorId: 1,
        FermentationStart: '2025-06-15T12:00:00.000Z',
        FermentationEnd: '2025-06-30T12:00:00.000Z',
      };

      const result = mapBatchRow(row);

      expect(result.Id).toBe(42);
      expect(result.BatchNo).toBe(1);
      expect(result.RecipeName).toBe('TestRecipe');
      expect(result.FermentorId).toBe(1);
      expect(result.FermentationStart).toBe('2025-06-15T12:00:00.000Z');
      expect(result.FermentationEnd).toBe('2025-06-30T12:00:00.000Z');
    });

    it('should handle null FermentationEnd', () => {
      const row: BatchRow = {
        Id: 42,
        BatchNo: 1,
        RecipeName: 'ActiveRecipe',
        FermentorId: 1,
        FermentationStart: '2025-06-15T12:00:00.000Z',
        FermentationEnd: null,
      };

      const result = mapBatchRow(row);

      expect(result.FermentationEnd).toBeNull();
    });

    it('should handle edge case batch numbers', () => {
      const row: BatchRow = {
        Id: 1,
        BatchNo: 0,
        RecipeName: 'ZeroBatch',
        FermentorId: 1,
        FermentationStart: '2025-01-01T00:00:00.000Z',
        FermentationEnd: null,
      };

      const result = mapBatchRow(row);

      expect(result.BatchNo).toBe(0);
    });
  });
});
