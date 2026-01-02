// FermentationProfile entity and repository types

export interface FermentationProfile {
  Id: number;
  BatchId: number;
  Value: number;
  TimePoint: string;
}

export interface FermentationProfileRow {
  Id: number;
  BatchId: number;
  Value: number;
  TimePoint: string;
}

export const mapFermentationProfileRow = (row: FermentationProfileRow): FermentationProfile => ({
  Id: row.Id,
  BatchId: row.BatchId,
  Value: row.Value,
  TimePoint: row.TimePoint,
});

export interface CreateFermentationProfileDto {
  batchId: number;
  value: number;
  timePoint: string;
}

export interface FermentationProfileRepository {
  /**
   * Find all profiles for a batch
   * @param batchId - Batch ID
   * @returns Array of fermentation profiles
   */
  findByBatchId(batchId: number): Promise<FermentationProfile[]>;

  /**
   * Delete all profiles for a batch
   * @param batchId - Batch ID
   */
  deleteByBatchId(batchId: number): Promise<void>;

  /**
   * Create a new fermentation profile
   * @param data - Profile data
   * @returns The created profile
   */
  create(data: CreateFermentationProfileDto): Promise<FermentationProfile>;
}
