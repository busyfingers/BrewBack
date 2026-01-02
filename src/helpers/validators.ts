import { Request, Response } from 'express';
import { QueryParameter, RowResult } from '../types';

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
 * API Key authentication middleware factory
 * Validates the X-API-Key header
 * @param getUserByToken - Async function to look up user by token
 * @returns Express middleware function
 */
export const apiKeyAuth = (getUserByToken: (token: string) => Promise<{ Name: string } | null>) => {
  return async (req: Request, res: Response, next: Function) => {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey || typeof apiKey !== 'string') {
      return res.sendStatus(401);
    }

    const user = await getUserByToken(apiKey);

    if (user) {
      (req as any).user = user;
      next();
    } else {
      res.sendStatus(401);
    }
  };
};

/**
 * Validates the temperature measurement payload
 * @param data - Measurement data object
 * @returns true if the payload is valid, false otherwise
 */
export const validatePayload = function (data: any): boolean {
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
