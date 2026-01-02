// Temperature entity and repository types

export interface Temperature {
  Id: number;
  Value: number;
  Location: string;
  MeasuredAt: string;
  SensorId: number | null;
  FermentorId: number | null;
  Sensor?: string;
  Fermentor?: string;
}

export interface TemperatureRow {
  Id: number;
  Value: number;
  Location: string;
  MeasuredAt: string;
  SensorId: number | null;
  FermentorId: number | null;
  Sensor?: string | null;
  Fermentor?: string | null;
}

export const mapTemperatureRow = (row: TemperatureRow): Temperature => ({
  Id: row.Id,
  Value: row.Value,
  Location: row.Location,
  MeasuredAt: row.MeasuredAt,
  SensorId: row.SensorId,
  FermentorId: row.FermentorId,
  Sensor: row.Sensor || undefined,
  Fermentor: row.Fermentor || undefined,
});

export interface TemperatureFilter {
  batchId?: number;
  from?: string;
  to?: string;
}

export interface CreateTemperatureDto {
  value: number;
  location: string;
  measuredAt: string;
  sensorName?: string;
  fermentorName?: string;
}

export interface TemperatureRepository {
  /**
   * Find all temperature readings with optional filters
   * @param filter - Optional filter criteria
   * @returns Array of temperature readings
   */
  findAll(filter?: TemperatureFilter): Promise<Temperature[]>;

  /**
   * Create a new temperature reading
   * @param data - Temperature data
   * @returns The created temperature reading
   */
  create(data: CreateTemperatureDto): Promise<Temperature>;
}
