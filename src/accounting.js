/**
 * Accounting and financial logic for the TMS application.
 * Extracted from the monolithic index.html for testability.
 */

/**
 * Default chart of accounts.
 */
const DEFAULT_CHART_OF_ACCOUNTS = {
  assets: [
    { code: '1101', name: 'موجودی TIR', type: 'asset', category: 'tir', normalBalance: 'debit' },
    { code: '1102', name: 'موجودی دوزبلاغ', type: 'asset', category: 'dozblagh', normalBalance: 'debit' },
    { code: '1103', name: 'موجودی CMR', type: 'asset', category: 'cmr', normalBalance: 'debit' },
    { code: '1201', name: 'حساب دریافتنی رانندگان', type: 'asset', category: 'receivable', normalBalance: 'debit' },
    { code: '1202', name: 'صندوق', type: 'asset', category: 'cash', normalBalance: 'debit' },
    { code: '1203', name: 'بانک', type: 'asset', category: 'bank', normalBalance: 'debit' },
  ],
  expenses: [
    { code: '5101', name: 'هزینه TIR', type: 'expense', category: 'tir', normalBalance: 'debit' },
    { code: '5102', name: 'هزینه دوزبلاغ', type: 'expense', category: 'dozblagh', normalBalance: 'debit' },
    { code: '5103', name: 'هزینه CMR', type: 'expense', category: 'cmr', normalBalance: 'debit' },
    { code: '5104', name: 'هزینه سوخت', type: 'expense', category: 'fuel', normalBalance: 'debit' },
    { code: '5105', name: 'هزینه تعمیرات', type: 'expense', category: 'maintenance', normalBalance: 'debit' },
    { code: '5106', name: 'هزینه پیک و ارسال', type: 'expense', category: 'courier', normalBalance: 'debit' },
    { code: '5107', name: 'سایر هزینه ها', type: 'expense', category: 'other', normalBalance: 'debit' },
  ],
  revenue: [
    { code: '4101', name: 'درآمد خدمات حمل', type: 'revenue', category: 'service', normalBalance: 'credit' },
    { code: '4102', name: 'سایر درآمدها', type: 'revenue', category: 'other', normalBalance: 'credit' },
  ],
};

/**
 * Returns all accounts from chart of accounts.
 * @param {object} accountingData - Accounting data with chartOfAccounts
 * @returns {Array}
 */
function getAllAccounts(accountingData) {
  if (!accountingData || !accountingData.chartOfAccounts) return [];
  const coa = accountingData.chartOfAccounts;
  return [
    ...(coa.assets || []),
    ...(coa.expenses || []),
    ...(coa.revenue || []),
  ];
}

/**
 * Finds an account by its code.
 * @param {object} accountingData
 * @param {string} code
 * @returns {object|undefined}
 */
function getAccountByCode(accountingData, code) {
  const allAccounts = getAllAccounts(accountingData);
  return allAccounts.find(function (a) { return a.code === code; });
}

/**
 * Calculates a driver's balance from vouchers.
 * Positive = driver owes money (debtor), Negative = company owes driver (creditor).
 * @param {object} accountingData - Accounting data with vouchers array
 * @param {string} driverId
 * @returns {number}
 */
function calculateDriverBalance(accountingData, driverId) {
  let balance = 0;
  if (!accountingData || !accountingData.vouchers) return 0;

  const driverVouchers = accountingData.vouchers.filter(function (v) {
    return v.driverId === driverId && v.status === 'confirmed' && !v.isDeleted;
  });

  driverVouchers.forEach(function (v) {
    v.entries.forEach(function (e) {
      if (e.accountCode === '1201') {
        balance += (e.debit || 0);
        balance -= (e.credit || 0);
      }
    });
  });

  return balance;
}

/**
 * Gets vouchers for a specific trip and/or driver.
 * @param {object} accountingData
 * @param {string} tripId
 * @param {string} driverId
 * @returns {Array}
 */
function getVouchersForTrip(accountingData, tripId, driverId) {
  if (!accountingData || !accountingData.vouchers) return [];
  return accountingData.vouchers.filter(function (v) {
    return v.status === 'confirmed' && !v.isDeleted &&
      (v.tripId === tripId || (v.driverId === driverId && !v.tripId));
  });
}

/**
 * Calculates the driver's balance from trips before a given trip.
 * @param {object} accountingData
 * @param {object} appData - App data with trips array
 * @param {string} tripId
 * @param {string} driverId
 * @param {string} currentTripCode
 * @returns {number}
 */
function getPreviousDriverBalanceBeforeTrip(accountingData, appData, tripId, driverId, currentTripCode) {
  if (!accountingData || !accountingData.vouchers) return 0;
  if (!currentTripCode || !driverId) return 0;
  if (!appData || !appData.trips) return 0;

  const currentTripNumber = parseInt(currentTripCode.replace('TRIP-', ''));
  if (isNaN(currentTripNumber)) return 0;

  const previousTrips = appData.trips.filter(function (t) {
    return t.driverId === driverId && t.status !== 'cancelled' && t.id !== tripId;
  });

  const validPreviousTrips = previousTrips.filter(function (t) {
    const tripNumber = parseInt(t.code.replace('TRIP-', ''));
    if (isNaN(tripNumber)) return false;
    return tripNumber < currentTripNumber;
  });

  const previousTripIds = validPreviousTrips.map(function (t) { return t.id; });
  if (previousTripIds.length === 0) return 0;

  const previousTripVouchers = accountingData.vouchers.filter(function (v) {
    return v.driverId === driverId && v.status === 'confirmed' && !v.isDeleted &&
      v.tripId && previousTripIds.indexOf(v.tripId) !== -1;
  });

  let balance = 0;
  previousTripVouchers.forEach(function (v) {
    v.entries.forEach(function (e) {
      if (e.accountCode === '1201') {
        balance += (e.debit || 0);
        balance -= (e.credit || 0);
      }
    });
  });

  return balance;
}

/**
 * Generates a trial balance from accounting data.
 * @param {object} accountingData
 * @returns {Array} Array of { code, name, type, debit, credit, balance }
 */
function generateTrialBalance(accountingData) {
  if (!accountingData || !accountingData.vouchers) return [];

  const allAccounts = getAllAccounts(accountingData);
  const balances = {};

  allAccounts.forEach(function (acc) {
    balances[acc.code] = { code: acc.code, name: acc.name, type: acc.type, debit: 0, credit: 0, balance: 0 };
  });

  accountingData.vouchers.forEach(function (v) {
    if (v.status !== 'confirmed' || v.isDeleted) return;
    v.entries.forEach(function (e) {
      if (!balances[e.accountCode]) {
        balances[e.accountCode] = { code: e.accountCode, name: e.accountName || 'نامشخص', type: 'unknown', debit: 0, credit: 0, balance: 0 };
      }
      balances[e.accountCode].debit += (e.debit || 0);
      balances[e.accountCode].credit += (e.credit || 0);
    });
  });

  return Object.values(balances).map(function (b) {
    b.balance = b.debit - b.credit;
    return b;
  });
}

/**
 * Determines the mapping from old transaction category to debit/credit accounts.
 * @param {string} type - Transaction type ("expense" or "driver_receipt")
 * @param {string} category - Transaction category
 * @returns {{ debitAccount: string, creditAccount: string }}
 */
function getTransactionAccountMapping(type, category) {
  let debitAccount, creditAccount;

  if (type === 'expense') {
    if (category === 'tir') { debitAccount = '5101'; creditAccount = '1202'; }
    else if (category === 'dozblagh' || category === 'doz_renewal') { debitAccount = '5102'; creditAccount = '1202'; }
    else if (category === 'cmr') { debitAccount = '5103'; creditAccount = '1202'; }
    else if (category === 'carry_forward') { debitAccount = '1201'; creditAccount = '1201'; }
    else { debitAccount = '5107'; creditAccount = '1202'; }
  } else if (type === 'driver_receipt') {
    debitAccount = '1202';
    creditAccount = '1201';
  } else {
    debitAccount = '5107';
    creditAccount = '1202';
  }

  return { debitAccount, creditAccount };
}

module.exports = {
  DEFAULT_CHART_OF_ACCOUNTS,
  getAllAccounts,
  getAccountByCode,
  calculateDriverBalance,
  getVouchersForTrip,
  getPreviousDriverBalanceBeforeTrip,
  generateTrialBalance,
  getTransactionAccountMapping,
};
