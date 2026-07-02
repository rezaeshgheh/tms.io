const {
  formatNumber,
  parseFormattedNumber,
  escapeHtml,
  hashPassword,
  verifyPassword,
  generateId,
  generateTripCode,
  generateVoucherNumber,
  toJalaliDate,
} = require('../utils');

describe('formatNumber', () => {
  test('formats a simple number with commas', () => {
    expect(formatNumber('1234567')).toBe('1,234,567');
  });

  test('strips non-digit characters', () => {
    expect(formatNumber('12abc34')).toBe('1,234');
  });

  test('returns empty string for empty input', () => {
    expect(formatNumber('')).toBe('');
  });

  test('returns empty string for non-numeric input', () => {
    expect(formatNumber('abc')).toBe('');
  });

  test('handles single digit', () => {
    expect(formatNumber('5')).toBe('5');
  });

  test('handles zero', () => {
    expect(formatNumber('0')).toBe('0');
  });

  test('handles already formatted number', () => {
    expect(formatNumber('1,234')).toBe('1,234');
  });

  test('handles number with leading zeros', () => {
    expect(formatNumber('007')).toBe('7');
  });
});

describe('parseFormattedNumber', () => {
  test('parses a formatted number string', () => {
    expect(parseFormattedNumber('1,234,567')).toBe(1234567);
  });

  test('parses a plain number string', () => {
    expect(parseFormattedNumber('42')).toBe(42);
  });

  test('returns 0 for empty string', () => {
    expect(parseFormattedNumber('')).toBe(0);
  });

  test('returns 0 for null', () => {
    expect(parseFormattedNumber(null)).toBe(0);
  });

  test('returns 0 for undefined', () => {
    expect(parseFormattedNumber(undefined)).toBe(0);
  });

  test('returns 0 for non-numeric string', () => {
    expect(parseFormattedNumber('abc')).toBe(0);
  });

  test('handles number with multiple commas', () => {
    expect(parseFormattedNumber('1,000,000,000')).toBe(1000000000);
  });
});

describe('escapeHtml', () => {
  test('escapes ampersand', () => {
    expect(escapeHtml('a & b')).toBe('a &amp; b');
  });

  test('escapes less-than', () => {
    expect(escapeHtml('<div>')).toBe('&lt;div&gt;');
  });

  test('escapes greater-than', () => {
    expect(escapeHtml('a > b')).toBe('a &gt; b');
  });

  test('escapes double quotes', () => {
    expect(escapeHtml('"hello"')).toBe('&quot;hello&quot;');
  });

  test('escapes single quotes', () => {
    expect(escapeHtml("it's")).toBe('it&#039;s');
  });

  test('escapes all special characters together', () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
    );
  });

  test('returns empty string for null', () => {
    expect(escapeHtml(null)).toBe('');
  });

  test('returns empty string for undefined', () => {
    expect(escapeHtml(undefined)).toBe('');
  });

  test('returns empty string for empty string', () => {
    expect(escapeHtml('')).toBe('');
  });

  test('leaves normal text unchanged', () => {
    expect(escapeHtml('hello world')).toBe('hello world');
  });

  test('handles Persian text', () => {
    expect(escapeHtml('سلام دنیا')).toBe('سلام دنیا');
  });
});

describe('hashPassword', () => {
  test('returns a string starting with hash_', () => {
    const result = hashPassword('test123');
    expect(result).toMatch(/^hash_/);
  });

  test('produces consistent output for same input', () => {
    const hash1 = hashPassword('mypassword');
    const hash2 = hashPassword('mypassword');
    expect(hash1).toBe(hash2);
  });

  test('produces different output for different inputs', () => {
    const hash1 = hashPassword('password1');
    const hash2 = hashPassword('password2');
    expect(hash1).not.toBe(hash2);
  });

  test('handles empty string', () => {
    const result = hashPassword('');
    expect(result).toMatch(/^hash_/);
  });

  test('handles special characters', () => {
    const result = hashPassword('p@$$w0rd!#%');
    expect(result).toMatch(/^hash_/);
  });

  test('handles unicode/Persian characters', () => {
    const result = hashPassword('رمز عبور');
    expect(result).toMatch(/^hash_/);
  });
});

describe('verifyPassword', () => {
  test('verifies a hashed password correctly', () => {
    const hashed = hashPassword('secret');
    expect(verifyPassword('secret', hashed)).toBe(true);
  });

  test('rejects wrong password against hash', () => {
    const hashed = hashPassword('secret');
    expect(verifyPassword('wrong', hashed)).toBe(false);
  });

  test('verifies plain text password (legacy)', () => {
    expect(verifyPassword('admin123', 'admin123')).toBe(true);
  });

  test('rejects wrong plain text password', () => {
    expect(verifyPassword('wrong', 'admin123')).toBe(false);
  });

  test('returns false for null stored password', () => {
    expect(verifyPassword('test', null)).toBe(false);
  });

  test('returns false for empty stored password', () => {
    expect(verifyPassword('test', '')).toBe(false);
  });
});

describe('generateId', () => {
  test('generates an ID with the given prefix', () => {
    const id = generateId('driver');
    expect(id).toMatch(/^driver_/);
  });

  test('generates unique IDs', () => {
    const ids = new Set();
    for (let i = 0; i < 100; i++) {
      ids.add(generateId('test'));
    }
    expect(ids.size).toBe(100);
  });

  test('includes timestamp component', () => {
    const id = generateId('x');
    const parts = id.split('_');
    expect(parts.length).toBeGreaterThanOrEqual(3);
    const timestamp = parseInt(parts[1]);
    expect(timestamp).toBeGreaterThan(0);
  });
});

describe('generateTripCode', () => {
  test('returns TRIP-1001 for empty trips', () => {
    expect(generateTripCode([])).toBe('TRIP-1001');
  });

  test('returns TRIP-1001 for null trips', () => {
    expect(generateTripCode(null)).toBe('TRIP-1001');
  });

  test('returns TRIP-1001 for undefined trips', () => {
    expect(generateTripCode(undefined)).toBe('TRIP-1001');
  });

  test('increments from highest existing code', () => {
    const trips = [
      { code: 'TRIP-1001' },
      { code: 'TRIP-1003' },
      { code: 'TRIP-1002' },
    ];
    expect(generateTripCode(trips)).toBe('TRIP-1004');
  });

  test('handles trips without code property', () => {
    const trips = [{ name: 'test' }, { code: 'TRIP-1005' }];
    expect(generateTripCode(trips)).toBe('TRIP-1006');
  });

  test('handles trips with invalid code format', () => {
    const trips = [{ code: 'INVALID' }, { code: 'TRIP-1002' }];
    expect(generateTripCode(trips)).toBe('TRIP-1003');
  });

  test('handles single trip', () => {
    const trips = [{ code: 'TRIP-2000' }];
    expect(generateTripCode(trips)).toBe('TRIP-2001');
  });
});

describe('generateVoucherNumber', () => {
  test('returns VCH-0001 for null accounting data', () => {
    const result = generateVoucherNumber(null);
    expect(result.number).toBe('VCH-0001');
    expect(result.counter).toBe(1);
  });

  test('increments counter from accounting data', () => {
    const result = generateVoucherNumber({ voucherCounter: 5 });
    expect(result.number).toBe('VCH-0006');
    expect(result.counter).toBe(6);
  });

  test('pads number to 4 digits', () => {
    const result = generateVoucherNumber({ voucherCounter: 0 });
    expect(result.number).toBe('VCH-0001');
  });

  test('handles large counter', () => {
    const result = generateVoucherNumber({ voucherCounter: 9999 });
    expect(result.number).toBe('VCH-10000');
    expect(result.counter).toBe(10000);
  });

  test('handles missing voucherCounter', () => {
    const result = generateVoucherNumber({});
    expect(result.number).toBe('VCH-0001');
    expect(result.counter).toBe(1);
  });
});

describe('toJalaliDate', () => {
  test('returns dash for empty input', () => {
    expect(toJalaliDate('')).toBe('-');
  });

  test('returns dash for null', () => {
    expect(toJalaliDate(null)).toBe('-');
  });

  test('returns dash for undefined', () => {
    expect(toJalaliDate(undefined)).toBe('-');
  });

  test('returns original string for invalid date', () => {
    expect(toJalaliDate('not-a-date')).toBe('not-a-date');
  });

  test('handles valid ISO date string', () => {
    const result = toJalaliDate('2025-03-21');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});
