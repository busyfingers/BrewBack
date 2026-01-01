import { validatePayload, isValidDate } from '../../helpers/validators';
import { Measurement } from '../../types';

describe('temperature route validation', () => {
  describe('validatePayload', () => {
    it('should return true for valid payload', () => {
      const payload: Measurement = {
        value: 20.5,
        measuredAt: Date.now(),
        location: 'fermenter',
      };
      expect(validatePayload(payload)).toBe(true);
    });

    it('should return false for empty object', () => {
      const payload = {} as Measurement;
      expect(validatePayload(payload)).toBe(false);
    });

    it('should return false when value is missing', () => {
      const payload = {
        measuredAt: Date.now(),
        location: 'fermenter',
      } as unknown as Measurement;
      expect(validatePayload(payload)).toBe(false);
    });

    it('should return false when measuredAt is missing', () => {
      const payload = {
        value: 20.5,
        location: 'fermenter',
      } as unknown as Measurement;
      expect(validatePayload(payload)).toBe(false);
    });

    it('should return false when location is missing', () => {
      const payload = {
        value: 20.5,
        measuredAt: Date.now(),
      } as unknown as Measurement;
      expect(validatePayload(payload)).toBe(false);
    });

    it('should return false when value is not a number', () => {
      const payload = {
        value: '20.5',
        measuredAt: Date.now(),
        location: 'fermenter',
      } as unknown as Measurement;
      expect(validatePayload(payload)).toBe(false);
    });

    it('should return false when measuredAt is not a number', () => {
      const payload = {
        value: 20.5,
        measuredAt: '2025-01-01',
        location: 'fermenter',
      } as unknown as Measurement;
      expect(validatePayload(payload)).toBe(false);
    });

    it('should return false when location is not a string', () => {
      const payload = {
        value: 20.5,
        measuredAt: Date.now(),
        location: 123,
      } as unknown as Measurement;
      expect(validatePayload(payload)).toBe(false);
    });
  });

  describe('isValidDate', () => {
    it('should return true for valid Date object', () => {
      const date = new Date();
      expect(isValidDate(date)).toBe(true);
    });

    it('should return false for invalid Date object', () => {
      const date = new Date('invalid-date');
      expect(isValidDate(date)).toBe(false);
    });

    it('should return false for null', () => {
      expect(isValidDate(null as unknown as Date)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isValidDate(undefined as unknown as Date)).toBe(false);
    });

    it('should return false for non-Date objects', () => {
      expect(isValidDate({} as unknown as Date)).toBe(false);
      expect(isValidDate('2025-01-01' as unknown as Date)).toBe(false);
      expect(isValidDate(12345 as unknown as Date)).toBe(false);
    });
  });
});
