import { validateRequest, BatchDataRequestBody } from '../../helpers/validators';

describe('batchdata route validation', () => {
  describe('validateRequest', () => {
    // Helper to create a valid request body
    const createValidBody = (): BatchDataRequestBody => ({
      batchNo: 1,
      recipe: {
        name: 'Test Recipe',
        author: 'test-author',
      },
      brewer: 'Test Brewer',
      fermentationStartDate: Date.now(),
    });

    it('should return true for valid request', () => {
      const body = createValidBody();
      expect(validateRequest(body)).toBe(true);
    });

    it('should return false for empty object', () => {
      const body = {};
      expect(validateRequest(body)).toBe(false);
    });

    it('should return false when batchNo is missing', () => {
      const body = createValidBody();
      delete body.batchNo;
      expect(validateRequest(body)).toBe(false);
    });

    it('should return false when recipe name is missing', () => {
      const body = createValidBody();
      delete body.recipe?.name;
      expect(validateRequest(body)).toBe(false);
    });

    it('should return false when recipe author is missing', () => {
      const body = createValidBody();
      delete body.recipe?.author;
      expect(validateRequest(body)).toBe(false);
    });

    it('should return false when brewer is missing', () => {
      const body = createValidBody();
      delete body.brewer;
      expect(validateRequest(body)).toBe(false);
    });

    it('should return false when fermentationStartDate is missing', () => {
      const body = createValidBody();
      delete body.fermentationStartDate;
      expect(validateRequest(body)).toBe(false);
    });

    it('should return false when batchNo is not a number', () => {
      const body = createValidBody();
      body.batchNo = '1' as unknown as number;
      expect(validateRequest(body)).toBe(false);
    });

    it('should return false when recipe name is not a string', () => {
      const body = createValidBody();
      body.recipe!.name = 123 as unknown as string;
      expect(validateRequest(body)).toBe(false);
    });

    it('should return false when recipe author is not a string', () => {
      const body = createValidBody();
      body.recipe!.author = 123 as unknown as string;
      expect(validateRequest(body)).toBe(false);
    });

    it('should return false when brewer is not a string', () => {
      const body = createValidBody();
      body.brewer = 123 as unknown as string;
      expect(validateRequest(body)).toBe(false);
    });

    it('should return false when fermentationStartDate is not a number', () => {
      const body = createValidBody();
      body.fermentationStartDate = '2025-01-01' as unknown as number;
      expect(validateRequest(body)).toBe(false);
    });

    it('should return false when recipe object is missing entirely', () => {
      const body = createValidBody();
      delete body.recipe;
      expect(validateRequest(body)).toBe(false);
    });
  });
});
