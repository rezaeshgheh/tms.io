const {
  getCompanyKeys,
  companyExists,
  getCompanyInfo,
  createDefaultCompanySettings,
  getApiUrl,
  validateCompany,
} = require('../company');

describe('getCompanyKeys', () => {
  test('generates correct storage keys', () => {
    const keys = getCompanyKeys('company_1');
    expect(keys.data).toBe('tms_isolated_company_1_data');
    expect(keys.accounting).toBe('tms_isolated_company_1_accounting');
    expect(keys.users).toBe('tms_isolated_company_1_users');
    expect(keys.settings).toBe('tms_isolated_company_1_settings');
  });

  test('handles different company IDs', () => {
    const keys = getCompanyKeys('abc_xyz');
    expect(keys.data).toBe('tms_isolated_abc_xyz_data');
  });

  test('all keys are unique', () => {
    const keys = getCompanyKeys('test');
    const values = Object.values(keys);
    const unique = new Set(values);
    expect(unique.size).toBe(values.length);
  });
});

describe('companyExists', () => {
  const companies = [
    { id: 'company_1', name: 'Company A' },
    { id: 'company_2', name: 'Company B' },
  ];

  test('returns true for existing company', () => {
    expect(companyExists(companies, 'company_1')).toBe(true);
  });

  test('returns false for non-existing company', () => {
    expect(companyExists(companies, 'company_99')).toBe(false);
  });

  test('returns false for null companies list', () => {
    expect(companyExists(null, 'company_1')).toBe(false);
  });

  test('returns false for null company ID', () => {
    expect(companyExists(companies, null)).toBe(false);
  });

  test('returns false for empty companies list', () => {
    expect(companyExists([], 'company_1')).toBe(false);
  });
});

describe('getCompanyInfo', () => {
  const companies = [
    { id: 'company_1', name: 'پیروز رانان', code: 'PIR' },
    { id: 'company_2', name: 'مارگون ترابر', code: 'MAR' },
  ];

  test('returns company info for valid ID', () => {
    const info = getCompanyInfo(companies, 'company_1');
    expect(info).toBeDefined();
    expect(info.name).toBe('پیروز رانان');
    expect(info.code).toBe('PIR');
  });

  test('returns undefined for invalid ID', () => {
    expect(getCompanyInfo(companies, 'company_99')).toBeUndefined();
  });

  test('returns undefined for null companies', () => {
    expect(getCompanyInfo(null, 'company_1')).toBeUndefined();
  });

  test('returns undefined for null ID', () => {
    expect(getCompanyInfo(companies, null)).toBeUndefined();
  });
});

describe('createDefaultCompanySettings', () => {
  test('creates settings with company name', () => {
    const settings = createDefaultCompanySettings({ name: 'شرکت تست' });
    expect(settings.companyName).toBe('شرکت تست');
  });

  test('has all required fields', () => {
    const settings = createDefaultCompanySettings({ name: 'Test' });
    expect(settings).toHaveProperty('registrationNumber');
    expect(settings).toHaveProperty('phone');
    expect(settings).toHaveProperty('email');
    expect(settings).toHaveProperty('address');
    expect(settings).toHaveProperty('printTheme');
    expect(settings).toHaveProperty('paperSize');
    expect(settings).toHaveProperty('invoiceTemplate');
  });

  test('sets defaults for print settings', () => {
    const settings = createDefaultCompanySettings({ name: 'Test' });
    expect(settings.printTheme).toBe('blue');
    expect(settings.paperSize).toBe('A5');
    expect(settings.printFontSize).toBe('11');
  });

  test('sets defaults for invoice display', () => {
    const settings = createDefaultCompanySettings({ name: 'Test' });
    expect(settings.showStamp).toBe(true);
    expect(settings.showFooterNote).toBe(true);
    expect(settings.showColumnRow).toBe(true);
    expect(settings.showColumnDescription).toBe(true);
    expect(settings.showColumnQuantity).toBe(true);
    expect(settings.showColumnUnitPrice).toBe(true);
    expect(settings.showColumnAmount).toBe(true);
  });

  test('handles null company info', () => {
    const settings = createDefaultCompanySettings(null);
    expect(settings.companyName).toBe('');
  });

  test('has updatedAt timestamp', () => {
    const settings = createDefaultCompanySettings({ name: 'Test' });
    expect(settings.updatedAt).toBeDefined();
    expect(new Date(settings.updatedAt).getTime()).not.toBeNaN();
  });

  test('margins default to 10', () => {
    const settings = createDefaultCompanySettings({ name: 'Test' });
    expect(settings.printMarginTop).toBe(10);
    expect(settings.printMarginBottom).toBe(10);
    expect(settings.printMarginLeft).toBe(10);
    expect(settings.printMarginRight).toBe(10);
  });
});

describe('getApiUrl', () => {
  test('returns correct save URL for data', () => {
    expect(getApiUrl('data', 'save')).toBe('save.php');
  });

  test('returns correct save URL for accounting', () => {
    expect(getApiUrl('accounting', 'save')).toBe('save_accounting.php');
  });

  test('returns correct save URL for users', () => {
    expect(getApiUrl('users', 'save')).toBe('save_users.php');
  });

  test('returns correct save URL for settings', () => {
    expect(getApiUrl('settings', 'save')).toBe('save_company_settings.php');
  });

  test('returns correct load URL for data', () => {
    expect(getApiUrl('data', 'load')).toBe('load.php');
  });

  test('returns correct load URL for accounting', () => {
    expect(getApiUrl('accounting', 'load')).toBe('load_accounting.php');
  });

  test('returns correct load URL for users', () => {
    expect(getApiUrl('users', 'load')).toBe('load_users.php');
  });

  test('returns correct load URL for settings', () => {
    expect(getApiUrl('settings', 'load')).toBe('load_company_settings.php');
  });

  test('returns default save URL for unknown type', () => {
    expect(getApiUrl('unknown', 'save')).toBe('save.php');
  });

  test('returns default load URL for unknown type', () => {
    expect(getApiUrl('unknown', 'load')).toBe('load.php');
  });
});

describe('validateCompany', () => {
  test('validates a valid company', () => {
    const result = validateCompany({
      name: 'شرکت تست',
      code: 'TST',
      adminUsername: 'admin',
      adminPassword: 'password123',
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  test('rejects null company', () => {
    const result = validateCompany(null);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Company object is required');
  });

  test('rejects missing name', () => {
    const result = validateCompany({ code: 'TST', adminUsername: 'admin', adminPassword: 'pass' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Company name is required');
  });

  test('rejects empty name', () => {
    const result = validateCompany({ name: '  ', code: 'TST', adminUsername: 'admin', adminPassword: 'pass' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Company name is required');
  });

  test('rejects missing code', () => {
    const result = validateCompany({ name: 'Test', adminUsername: 'admin', adminPassword: 'pass' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Company code is required');
  });

  test('rejects missing adminUsername', () => {
    const result = validateCompany({ name: 'Test', code: 'TST', adminPassword: 'pass' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Admin username is required');
  });

  test('rejects missing adminPassword', () => {
    const result = validateCompany({ name: 'Test', code: 'TST', adminUsername: 'admin' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Admin password is required');
  });

  test('returns multiple errors for multiple missing fields', () => {
    const result = validateCompany({});
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBe(4);
  });
});
