/**
 * FermentationProfile Repository Implementation
 */
import { QueryParameter, RowResult } from '../types';
import {
  FermentationProfile,
  FermentationProfileRepository as FermentationProfileRepositoryInterface,
  CreateFermentationProfileDto,
  mapFermentationProfileRow,
  FermentationProfileRow,
} from './fermentationProfileTypes';

export class FermentationProfileRepository implements FermentationProfileRepositoryInterface {
  constructor(
    private execQuery: (sql: string, params: QueryParameter[]) => Promise<RowResult[]>,
    private execNonQuery: (sql: string, params: QueryParameter[]) => Promise<void>
  ) {}

  async findByBatchId(batchId: number): Promise<FermentationProfile[]> {
    const query = 'SELECT Id, BatchId, Value, TimePoint FROM FermentationProfiles WHERE BatchId = ? ORDER BY TimePoint ASC';
    const params: QueryParameter[] = [{ name: 'batchId', type: 'number', value: batchId }];

    const result = await this.execQuery(query, params);
    return result.map((row) => mapFermentationProfileRow(row as unknown as FermentationProfileRow));
  }

  async deleteByBatchId(batchId: number): Promise<void> {
    const query = 'DELETE FROM FermentationProfiles WHERE BatchId = ?';
    const params: QueryParameter[] = [{ name: 'batchId', type: 'number', value: batchId }];
    await this.execNonQuery(query, params);
  }

  async create(data: CreateFermentationProfileDto): Promise<FermentationProfile> {
    const query = 'INSERT INTO FermentationProfiles (BatchId, Value, TimePoint) VALUES (?, ?, ?)';
    const params: QueryParameter[] = [
      { name: 'batchId', type: 'number', value: data.batchId },
      { name: 'value', type: 'string', value: data.value.toString() },
      { name: 'timePoint', type: 'string', value: data.timePoint },
    ];

    await this.execNonQuery(query, params);

    // Return the created profile (simplified)
    return {
      Id: 0,
      BatchId: data.batchId,
      Value: data.value,
      TimePoint: data.timePoint,
    };
  }
}
