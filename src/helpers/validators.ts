import { Measurement } from '../types';

// Type definition for the batchdata request body
export interface BatchDataRequestBody {
  batchNo?: unknown;
  recipe?: {
    name?: unknown;
    author?: unknown;
  };
  brewer?: unknown;
  fermentationStartDate?: unknown;
}

/**
 * Validates the batchdata request payload
 * @param body - Request body object
 * @returns true if the request is valid, false otherwise
 */
export const validateRequest = function (body: BatchDataRequestBody): boolean {
  if (Object.keys(body).length === 0 && body.constructor === Object) {
    return false;
  }

  if (
    !body.batchNo ||
    !body.recipe?.name ||
    !body.recipe?.author ||
    !body.brewer ||
    !body.fermentationStartDate
  ) {
    return false;
  }

  if (
    typeof body.batchNo !== 'number' ||
    typeof body.recipe?.name !== 'string' ||
    typeof body.recipe?.author !== 'string' ||
    typeof body.brewer !== 'string' ||
    typeof body.fermentationStartDate !== 'number'
  ) {
    return false;
  }

  return true;
};

/**
 * Validates the temperature measurement payload
 * @param data - Measurement data object
 * @returns true if the payload is valid, false otherwise
 */
export const validatePayload = function (data: Measurement): boolean {
  if (Object.keys(data).length === 0 && data.constructor === Object) {
    return false;
  }

  if (!data.value || !data.measuredAt || !data.location) {
    return false;
  }

  if (typeof data.value !== 'number' || typeof data.measuredAt !== 'number' || typeof data.location !== 'string') {
    return false;
  }

  return true;
};

/**
 * Checks if a value is a valid Date object
 * @param date - Value to check
 * @returns true if the value is a valid Date, false otherwise
 */
export const isValidDate = function (date: Date): boolean {
  return date instanceof Date && !isNaN(date.getTime());
};
