/**
 * Temperature Repository Implementation
 */
import { QueryParameter, RowResult } from '../types';
import {
  Temperature,
  TemperatureRepository as TemperatureRepositoryInterface,
  TemperatureFilter,
  CreateTemperatureDto,
  mapTemperatureRow,
} from './temperatureTypes';

export class TemperatureRepository implements TemperatureRepositoryInterface {
  constructor(
    private execQuery: (sql: string, params: QueryParameter[]) => Promise<RowResult[]>,
    private execNonQuery: (sql: string, params: QueryParameter[]) => Promise<void>
  ) {}

  async findAll(filter?: TemperatureFilter): Promise<Temperature[]> {
    let query = `SELECT T.Id, T.Value, T.Location, T.MeasuredAt, T.SensorId, T.FermentorId, 
                        S.Name AS Sensor, F.Name AS Fermentor
                 FROM Temperature T
                 LEFT JOIN Sensors S ON T.SensorId = S.Id
                 LEFT JOIN Fermentors F ON T.FermentorId = F.Id
                 LEFT JOIN Batches B ON (T.MeasuredAt >= B.FermentationStart) 
                                        AND (T.MeasuredAt <= IFNULL(B.FermentationEnd, '2999-01-01 00:00:00'))
                 WHERE 1=1`;

    const params: QueryParameter[] = [];

    if (filter?.batchId) {
      query += ' AND B.Id = ?';
      query += ' AND (T.FermentorId = B.FermentorId OR T.FermentorId IS NULL)';
      params.push({ name: 'batchId', type: 'number', value: filter.batchId });
    }

    if (filter?.from) {
      query += ' AND MeasuredAt >= ?';
      params.push({ name: 'from', type: 'string', value: filter.from });
    }

    if (filter?.to) {
      query += ' AND MeasuredAt <= ?';
      params.push({ name: 'to', type: 'string', value: filter.to });
    }

    query += ' ORDER BY MeasuredAt';

    const result = await this.execQuery(query, params);
    return result.map((row) => mapTemperatureRow(row as any));
  }

  async create(data: CreateTemperatureDto): Promise<Temperature> {
    const query = `INSERT INTO Temperature (Value, Location, MeasuredAt, SensorId, FermentorId)
                   VALUES (?, ?, ?, 
                           (SELECT Id FROM Sensors WHERE Name = ?), 
                           (SELECT Id FROM Fermentors WHERE Name = ?))`;

    const params: QueryParameter[] = [
      { name: 'Value', type: 'string', value: data.value.toFixed(2) },
      { name: 'Location', type: 'string', value: data.location },
      { name: 'MeasuredAt', type: 'string', value: data.measuredAt },
      { name: 'SensorName', type: 'string', value: data.sensorName || '' },
      { name: 'FermentorName', type: 'string', value: data.fermentorName || '' },
    ];

    await this.execNonQuery(query, params);

    // Return a simplified created record
    return {
      Id: 0,
      Value: data.value,
      Location: data.location,
      MeasuredAt: data.measuredAt,
      SensorId: null,
      FermentorId: null,
      Sensor: data.sensorName,
      Fermentor: data.fermentorName,
    };
  }
}
