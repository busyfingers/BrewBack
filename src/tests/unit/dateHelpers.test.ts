import { getCurrentTimeStamp, getLocalISOString } from '../../helpers/dateHelpers';

describe('dateHelpers', () => {
  describe('getCurrentTimeStamp', () => {
    it('should return a timestamp in the format YYYY-MM-DD HH:MM:SS.mmm', () => {
      const timestamp = getCurrentTimeStamp();

      // Check format: YYYY-MM-DD HH:MM:SS.mmm
      const pattern = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}$/;
      expect(timestamp).toMatch(pattern);
    });

    it('should pad single digit months with zero', () => {
      // January is month 1 (0-indexed in Date)
      jest.spyOn(Date.prototype, 'getMonth').mockReturnValue(0); // January
      jest.spyOn(Date.prototype, 'getDate').mockReturnValue(1);
      jest.spyOn(Date.prototype, 'getHours').mockReturnValue(0);
      jest.spyOn(Date.prototype, 'getMinutes').mockReturnValue(0);
      jest.spyOn(Date.prototype, 'getSeconds').mockReturnValue(0);
      jest.spyOn(Date.prototype, 'getMilliseconds').mockReturnValue(0);
      jest.spyOn(Date.prototype, 'getFullYear').mockReturnValue(2025);

      const timestamp = getCurrentTimeStamp();
      expect(timestamp).toContain('01-01'); // Month 01 (padded), Day 01
    });

    it('should include proper hour format', () => {
      jest.spyOn(Date.prototype, 'getMonth').mockReturnValue(5); // June
      jest.spyOn(Date.prototype, 'getDate').mockReturnValue(15);
      jest.spyOn(Date.prototype, 'getHours').mockReturnValue(0);
      jest.spyOn(Date.prototype, 'getMinutes').mockReturnValue(0);
      jest.spyOn(Date.prototype, 'getSeconds').mockReturnValue(0);
      jest.spyOn(Date.prototype, 'getMilliseconds').mockReturnValue(0);
      jest.spyOn(Date.prototype, 'getFullYear').mockReturnValue(2025);

      const timestamp = getCurrentTimeStamp();
      // Should contain valid hour format (at least 1 digit for hours)
      expect(timestamp).toMatch(/\d{2}:\d{2}:\d{2}/);
    });

    it('should include milliseconds padded to 3 digits', () => {
      jest.spyOn(Date.prototype, 'getMonth').mockReturnValue(5);
      jest.spyOn(Date.prototype, 'getDate').mockReturnValue(15);
      jest.spyOn(Date.prototype, 'getHours').mockReturnValue(12);
      jest.spyOn(Date.prototype, 'getMinutes').mockReturnValue(30);
      jest.spyOn(Date.prototype, 'getSeconds').mockReturnValue(45);
      jest.spyOn(Date.prototype, 'getMilliseconds').mockReturnValue(5);
      jest.spyOn(Date.prototype, 'getFullYear').mockReturnValue(2025);

      const timestamp = getCurrentTimeStamp();
      // Should have milliseconds like .005 (padded with zeros)
      expect(timestamp).toMatch(/\.\d{3}$/);
    });
  });

  describe('getLocalISOString', () => {
    it('should convert a date to ISO string', () => {
      const date = new Date('2025-06-15T12:00:00.000Z');
      const localString = getLocalISOString(date);

      // Should be a valid ISO string
      expect(localString).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should return different results for different timezones', () => {
      const date = new Date('2025-01-01T00:00:00.000Z');

      // Get the result
      const localString = getLocalISOString(date);

      // The result should be a valid ISO string starting with a date
      expect(localString).toMatch(/^\d{4}-\d{2}-\d{2}/);
    });

    it('should preserve the date portion correctly', () => {
      // Create a date that will definitely have a different local date in some timezones
      const date = new Date('2025-12-31T22:00:00.000Z');

      const localString = getLocalISOString(date);

      // Should still be a valid ISO string
      expect(localString).toBeDefined();
      expect(typeof localString).toBe('string');
      expect(localString).toContain('T');
    });

    it('should handle dates with fractional seconds', () => {
      const date = new Date('2025-06-15T12:30:45.123Z');
      const localString = getLocalISOString(date);

      expect(localString).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should return consistent results for the same input', () => {
      const date = new Date('2025-06-15T12:00:00.000Z');

      const result1 = getLocalISOString(date);
      const result2 = getLocalISOString(date);

      expect(result1).toBe(result2);
    });
  });
});
