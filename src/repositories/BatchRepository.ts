/**
 * Batch Repository Implementation
 */
import { QueryParameter, RowResult } from '../types';
import { Batch, BatchRepository as BatchRepositoryInterface, CreateBatchDto, mapBatchRow, BatchRow } from './batchTypes';

export class BatchRepository implements BatchRepositoryInterface {
  constructor(
    private execQuery: (sql: string, params: QueryParameter[]) => Promise<RowResult[]>,
    private execNonQuery: (sql: string, params: QueryParameter[]) => Promise<void>
  ) {}

  async findAll(): Promise<Batch[]> {
    const query = 'SELECT Id, BatchNo, RecipeName, FermentorId, FermentationStart, FermentationEnd FROM Batches';
    const result = await this.execQuery(query, []);
    return result.map((row) => mapBatchRow(row as unknown as Batch));
  }

  async find(batchNo: number, recipeName: string, fermentorId: number): Promise<Batch | null> {
    const query = 'SELECT Id, BatchNo, RecipeName, FermentorId, FermentationStart, FermentationEnd FROM Batches WHERE BatchNo = ? AND RecipeName = ? AND FermentorId = ?';
    const params: QueryParameter[] = [
      { name: 'batchNo', type: 'number', value: batchNo },
      { name: 'recipeName', type: 'string', value: recipeName },
      { name: 'fermentorId', type: 'number', value: fermentorId },
    ];

    const result = await this.execQuery(query, params);
    if (result.length === 1) {
      return mapBatchRow(result[0] as unknown as Batch);
    }

    return null;
  }

  async upsert(data: CreateBatchDto, exists: boolean): Promise<Batch> {
    let query: string;
    const params: QueryParameter[] = [
      { name: 'batchNo', type: 'number', value: data.batchNo },
      { name: 'recipeName', type: 'string', value: data.recipeName },
      { name: 'fermentorId', type: 'number', value: data.fermentorId },
      { name: 'fermentationStart', type: 'string', value: data.fermentationStart },
      { name: 'fermentationEnd', type: 'string', value: data.fermentationEnd || null },
    ];

    if (!exists) {
      query = `INSERT INTO Batches (BatchNo, RecipeName, FermentorId, FermentationStart, FermentationEnd)
               VALUES (?, ?, ?, ?, ?)`;
    } else {
      query = `UPDATE Batches SET FermentationStart = ?, FermentationEnd = ?
               WHERE BatchNo = ? AND RecipeName = ? AND FermentorId = ?`;
      // Reorder for UPDATE: fermentationStart, fermentationEnd, batchNo, recipeName, fermentorId
      const fermentationStart = params[3];
      const fermentationEnd = params[4];
      const batchNo = params[0];
      const recipeName = params[1];
      const fermentorId = params[2];
      params[0] = fermentationStart;
      params[1] = fermentationEnd;
      params[2] = batchNo;
      params[3] = recipeName;
      params[4] = fermentorId;
    }

    await this.execNonQuery(query, params);

    // Return the batch (either created or existing)
    const found = await this.find(data.batchNo, data.recipeName, data.fermentorId);
    return found!;
  }
}
