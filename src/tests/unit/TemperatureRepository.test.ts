import { Temperature, mapTemperatureRow, TemperatureRow } from '../../repositories/temperatureTypes';
import { TemperatureRepository } from '../../repositories/TemperatureRepository';
import { QueryParameter } from '../../types';

// Mock database functions
const createMockExecQuery = (results: TemperatureRow[]) => {
  return async (_sql: string, _params: QueryParameter[]): Promise<any[]> => {
    return results;
  };
};

const createMockExecNonQuery = () => {
  return async (_sql: string, _params: QueryParameter[]): Promise<void> => {
    // No-op for tests
  };
};

describe('TemperatureRepository', () => {
  let repository: TemperatureRepository;

  describe('findAll', () => {
    it('should return all temperatures when no filter', async () => {
      const mockRows: TemperatureRow[] = [
        {
          Id: 1,
          Value: 20.5,
          Location: 'fermenter',
          MeasuredAt: '2025-01-01T12:00:00.000Z',
          SensorId: 1,
          FermentorId: 1,
          Sensor: 'Sensor1',
          Fermentor: 'Fermentor1',
        },
        {
          Id: 2,
          Value: 21.0,
          Location: 'fermenter',
          MeasuredAt: '2025-01-02T12:00:00.000Z',
          SensorId: 1,
          FermentorId: 1,
          Sensor: 'Sensor1',
          Fermentor: 'Fermentor1',
        },
      ];
      repository = new TemperatureRepository(createMockExecQuery(mockRows), createMockExecNonQuery());

      const result = await repository.findAll();

      expect(result).toHaveLength(2);
      expect(result[0].Value).toBe(20.5);
      expect(result[1].Value).toBe(21.0);
    });

    it('should filter by batchId', async () => {
      const mockRows: TemperatureRow[] = [
        {
          Id: 1,
          Value: 20.5,
          Location: 'fermenter',
          MeasuredAt: '2025-01-01T12:00:00.000Z',
          SensorId: 1,
          FermentorId: 1,
          Sensor: null,
          Fermentor: null,
        },
      ];
      repository = new TemperatureRepository(createMockExecQuery(mockRows), createMockExecNonQuery());

      const result = await repository.findAll({ batchId: 1 });

      expect(result).toHaveLength(1);
    });

    it('should filter by date range', async () => {
      const mockRows: TemperatureRow[] = [
        {
          Id: 1,
          Value: 20.5,
          Location: 'fermenter',
          MeasuredAt: '2025-01-01T12:00:00.000Z',
          SensorId: null,
          FermentorId: null,
          Sensor: null,
          Fermentor: null,
        },
      ];
      repository = new TemperatureRepository(createMockExecQuery(mockRows), createMockExecNonQuery());

      const result = await repository.findAll({
        from: '2025-01-01T00:00:00.000Z',
        to: '2025-01-01T23:59:59.999Z',
      });

      expect(result).toHaveLength(1);
    });

    it('should return empty array when no results', async () => {
      const mockRows: TemperatureRow[] = [];
      repository = new TemperatureRepository(createMockExecQuery(mockRows), createMockExecNonQuery());

      const result = await repository.findAll();

      expect(result).toHaveLength(0);
    });

    it('should handle null sensor and fermentor names', async () => {
      const mockRows: TemperatureRow[] = [
        {
          Id: 1,
          Value: 18.0,
          Location: 'ambient',
          MeasuredAt: '2025-01-01T12:00:00.000Z',
          SensorId: null,
          FermentorId: null,
          Sensor: null,
          Fermentor: null,
        },
      ];
      repository = new TemperatureRepository(createMockExecQuery(mockRows), createMockExecNonQuery());

      const result = await repository.findAll();

      expect(result).toHaveLength(1);
      expect(result[0].Sensor).toBeUndefined();
      expect(result[0].Fermentor).toBeUndefined();
    });
  });

  describe('create', () => {
    it('should create temperature record', async () => {
      repository = new TemperatureRepository(createMockExecQuery([]), createMockExecNonQuery());

      const result = await repository.create({
        value: 22.5,
        location: 'fermenter',
        measuredAt: '2025-01-01T12:00:00.000Z',
        sensorName: 'Test Sensor',
        fermentorName: 'Test Fermentor',
      });

      expect(result.Value).toBe(22.5);
      expect(result.Location).toBe('fermenter');
      expect(result.MeasuredAt).toBe('2025-01-01T12:00:00.000Z');
      expect(result.Sensor).toBe('Test Sensor');
      expect(result.Fermentor).toBe('Test Fermentor');
    });

    it('should handle missing sensor and fermentor names', async () => {
      repository = new TemperatureRepository(createMockExecQuery([]), createMockExecNonQuery());

      const result = await repository.create({
        value: 20.0,
        location: 'ambient',
        measuredAt: '2025-01-01T12:00:00.000Z',
      });

      expect(result.Sensor).toBeUndefined();
      expect(result.Fermentor).toBeUndefined();
    });
  });

  describe('mapTemperatureRow', () => {
    it('should correctly map all fields', () => {
      const row: TemperatureRow = {
        Id: 42,
        Value: 19.5,
        Location: 'fermenter',
        MeasuredAt: '2025-06-15T12:30:00.000Z',
        SensorId: 1,
        FermentorId: 2,
        Sensor: 'TempSensor',
        Fermentor: 'MainFermenter',
      };

      const result = mapTemperatureRow(row);

      expect(result.Id).toBe(42);
      expect(result.Value).toBe(19.5);
      expect(result.Location).toBe('fermenter');
      expect(result.MeasuredAt).toBe('2025-06-15T12:30:00.000Z');
      expect(result.SensorId).toBe(1);
      expect(result.FermentorId).toBe(2);
      expect(result.Sensor).toBe('TempSensor');
      expect(result.Fermentor).toBe('MainFermenter');
    });
  });
});
