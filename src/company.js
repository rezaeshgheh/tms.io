/**
 * Multi-company management logic for the TMS application.
 * Extracted from IsolatedCompanyManager class in index.html for testability.
 */

/**
 * Generates storage keys for a company.
 * @param {string} companyId
 * @returns {{ data: string, accounting: string, users: string, settings: string }}
 */
function getCompanyKeys(companyId) {
  return {
    data: 'tms_isolated_' + companyId + '_data',
    accounting: 'tms_isolated_' + companyId + '_accounting',
    users: 'tms_isolated_' + companyId + '_users',
    settings: 'tms_isolated_' + companyId + '_settings',
  };
}

/**
 * Checks if a company exists in the master list.
 * @param {Array} masterCompanies
 * @param {string} companyId
 * @returns {boolean}
 */
function companyExists(masterCompanies, companyId) {
  if (!masterCompanies || !companyId) return false;
  return masterCompanies.some(function (c) { return c.id === companyId; });
}

/**
 * Finds company info by ID.
 * @param {Array} masterCompanies
 * @param {string} companyId
 * @returns {object|undefined}
 */
function getCompanyInfo(masterCompanies, companyId) {
  if (!masterCompanies || !companyId) return undefined;
  return masterCompanies.find(function (c) { return c.id === companyId; });
}

/**
 * Creates default company settings from company info.
 * @param {object} companyInfo - Company info object with `name`
 * @returns {object}
 */
function createDefaultCompanySettings(companyInfo) {
  return {
    companyName: companyInfo ? companyInfo.name : '',
    registrationNumber: '',
    economicCode: '',
    phone: '',
    mobile: '',
    email: '',
    address: '',
    logo: '',
    printTheme: 'blue',
    printFontSize: '11',
    printFontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    paperSize: 'A5',
    printMarginTop: 10,
    printMarginBottom: 10,
    printMarginLeft: 10,
    printMarginRight: 10,
    invoiceHeaderText: 'فاکتور رسمی',
    invoiceTemplate: 'simple',
    showStamp: true,
    showFooterNote: true,
    footerNote: 'این فاکتور به منزله تسویه حساب قطعی می باشد.',
    showColumnRow: true,
    showColumnDescription: true,
    showColumnQuantity: true,
    showColumnUnitPrice: true,
    showColumnAmount: true,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Gets the URL mapping for save/load operations by data type.
 * @param {string} type - "data", "accounting", "users", or "settings"
 * @param {string} operation - "save" or "load"
 * @returns {string} URL
 */
function getApiUrl(type, operation) {
  const saveUrls = {
    data: 'save.php',
    accounting: 'save_accounting.php',
    users: 'save_users.php',
    settings: 'save_company_settings.php',
  };
  const loadUrls = {
    data: 'load.php',
    accounting: 'load_accounting.php',
    users: 'load_users.php',
    settings: 'load_company_settings.php',
  };

  const urlMap = operation === 'save' ? saveUrls : loadUrls;
  return urlMap[type] || (operation === 'save' ? 'save.php' : 'load.php');
}

/**
 * Validates a new company object.
 * @param {object} company - Company object to validate
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateCompany(company) {
  const errors = [];

  if (!company) {
    return { valid: false, errors: ['Company object is required'] };
  }
  if (!company.name || !company.name.trim()) {
    errors.push('Company name is required');
  }
  if (!company.code || !company.code.trim()) {
    errors.push('Company code is required');
  }
  if (!company.adminUsername || !company.adminUsername.trim()) {
    errors.push('Admin username is required');
  }
  if (!company.adminPassword || !company.adminPassword.trim()) {
    errors.push('Admin password is required');
  }

  return { valid: errors.length === 0, errors };
}

module.exports = {
  getCompanyKeys,
  companyExists,
  getCompanyInfo,
  createDefaultCompanySettings,
  getApiUrl,
  validateCompany,
};
