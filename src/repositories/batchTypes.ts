// Batch entity and repository types

export interface Batch {
  Id: number;
  BatchNo: number;
  RecipeName: string;
  FermentorId: number;
  FermentationStart: string;
  FermentationEnd: string | null;
}

export interface BatchRow {
  Id: number;
  BatchNo: number;
  RecipeName: string;
  FermentorId: number;
  FermentationStart: string;
  FermentationEnd: string | null;
}

export const mapBatchRow = (row: BatchRow): Batch => ({
  Id: row.Id,
  BatchNo: row.BatchNo,
  RecipeName: row.RecipeName,
  FermentorId: row.FermentorId,
  FermentationStart: row.FermentationStart,
  FermentationEnd: row.FermentationEnd,
});

export interface CreateBatchDto {
  batchNo: number;
  recipeName: string;
  fermentorId: number;
  fermentationStart: string;
  fermentationEnd?: string | null;
}

export interface BatchRepository {
  /**
   * Find all batches
   * @returns Array of batches
   */
  findAll(): Promise<Batch[]>;

  /**
   * Find a batch by its composite key
   * @param batchNo - Batch number
   * @param recipeName - Recipe name
   * @param fermentorId - Fermentor ID
   * @returns The batch if found
   */
  find(batchNo: number, recipeName: string, fermentorId: number): Promise<Batch | null>;

  /**
   * Create or update a batch
   * @param data - Batch data
   * @param exists - Whether the batch already exists
   * @returns The upserted batch
   */
  upsert(data: CreateBatchDto, exists: boolean): Promise<Batch>;
}
