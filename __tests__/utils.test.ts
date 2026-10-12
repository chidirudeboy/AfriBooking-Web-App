import { safeFormat, isEmpty, numberWithCommas } from '@/lib/utils';
import { getPrice } from '@/lib/utils/price';
import { TApartments } from '@/lib/types/airbnb';

describe('lib/utils/index.ts', () => {
  describe('safeFormat', () => {
    it('formats a valid date string correctly', () => {
      const result = safeFormat('2026-10-25T12:00:00Z', 'yyyy-MM-dd');
      expect(result).toBe('2026-10-25');
    });

    it('returns default fallback when date is undefined or null', () => {
      expect(safeFormat(undefined, 'yyyy-MM-dd')).toBe('—');
      expect(safeFormat(null, 'yyyy-MM-dd')).toBe('—');
      expect(safeFormat('', 'yyyy-MM-dd')).toBe('—');
    });

    it('returns custom fallback when provided', () => {
      expect(safeFormat(null, 'yyyy-MM-dd', 'N/A')).toBe('N/A');
    });

    it('handles invalid date strings gracefully without throwing', () => {
      expect(safeFormat('invalid-date-string', 'yyyy-MM-dd')).toBe('—');
      expect(safeFormat('invalid-date-string', 'yyyy-MM-dd', 'Pending')).toBe('Pending');
    });
  });

  describe('isEmpty', () => {
    it('identifies empty values correctly', () => {
      expect(isEmpty(null)).toBe(true);
      expect(isEmpty(undefined)).toBe(true);
      expect(isEmpty('')).toBe(true);
      expect(isEmpty('   ')).toBe(true);
      expect(isEmpty([])).toBe(true);
      expect(isEmpty({})).toBe(true);
    });

    it('identifies non-empty values correctly', () => {
      expect(isEmpty('hello')).toBe(false);
      expect(isEmpty([1, 2, 3])).toBe(false);
      expect(isEmpty({ key: 'val' })).toBe(false);
      expect(isEmpty(0)).toBe(false);
      expect(isEmpty(false)).toBe(false);
    });
  });

  describe('numberWithCommas', () => {
    it('formats numbers with commas', () => {
      expect(numberWithCommas(1000)).toBe('1,000');
      expect(numberWithCommas(250000)).toBe('250,000');
      expect(numberWithCommas(1000000)).toBe('1,000,000');
    });

    it('handles string input and decimal numbers', () => {
      expect(numberWithCommas('50000')).toBe('50,000');
      expect(numberWithCommas(1234.56)).toBe('1,234.56');
    });

    it('handles null, undefined, or NaN gracefully', () => {
      expect(numberWithCommas(null as any)).toBe('0');
      expect(numberWithCommas(undefined as any)).toBe('0');
      expect(numberWithCommas('invalid')).toBe('0');
    });
  });
});

describe('lib/utils/price.ts - getPrice', () => {
  const mockApartment: Partial<TApartments> = {
    _id: 'apt-123',
    apartmentName: 'Luxury Lekki Suite',
    defaultStayFee: 85000,
    optionalFees: {
      partyFee: 150000,
      photoShootFee: 95000,
      movieShootFee: 200000,
    },
    bedroomPricing: [
      { bedrooms: 1, price: 50000, isActive: true },
      { bedrooms: 2, price: 85000, isActive: true },
      { bedrooms: 3, price: 120000, isActive: false },
    ],
  };

  it('returns defaultStayFee for normal reservation without bedroom selection', () => {
    const price = getPrice(mockApartment as TApartments, 'normal');
    expect(price).toBe(85000);
  });

  it('applies active bedroom pricing for normal reservation', () => {
    const price1Bed = getPrice(mockApartment as TApartments, 'normal', 1);
    expect(price1Bed).toBe(50000);
  });

  it('falls back to defaultStayFee if bedroom pricing is inactive', () => {
    const price3Bed = getPrice(mockApartment as TApartments, 'normal', 3);
    expect(price3Bed).toBe(85000);
  });

  it('returns partyFee for party reservations', () => {
    const price = getPrice(mockApartment as TApartments, 'party');
    expect(price).toBe(150000);
  });

  it('returns photoShootFee for photo shoot reservations', () => {
    const price = getPrice(mockApartment as TApartments, 'photo');
    expect(price).toBe(95000);
  });

  it('returns movieShootFee for movie shoot reservations', () => {
    const price = getPrice(mockApartment as TApartments, 'movie');
    expect(price).toBe(200000);
  });
});
