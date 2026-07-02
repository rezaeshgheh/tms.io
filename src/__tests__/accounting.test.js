const {
  DEFAULT_CHART_OF_ACCOUNTS,
  getAllAccounts,
  getAccountByCode,
  calculateDriverBalance,
  getVouchersForTrip,
  getPreviousDriverBalanceBeforeTrip,
  generateTrialBalance,
  getTransactionAccountMapping,
} = require('../accounting');

function makeAccountingData(vouchers) {
  return {
    vouchers: vouchers || [],
    chartOfAccounts: JSON.parse(JSON.stringify(DEFAULT_CHART_OF_ACCOUNTS)),
    voucherCounter: 0,
  };
}

function makeVoucher(overrides) {
  return {
    id: 'vch_1',
    number: 'VCH-0001',
    date: '2025-06-01',
    description: 'Test voucher',
    entries: [],
    tripId: null,
    driverId: null,
    status: 'confirmed',
    isDeleted: false,
    ...overrides,
  };
}

describe('DEFAULT_CHART_OF_ACCOUNTS', () => {
  test('has assets, expenses, and revenue', () => {
    expect(DEFAULT_CHART_OF_ACCOUNTS).toHaveProperty('assets');
    expect(DEFAULT_CHART_OF_ACCOUNTS).toHaveProperty('expenses');
    expect(DEFAULT_CHART_OF_ACCOUNTS).toHaveProperty('revenue');
  });

  test('assets include driver receivable account 1201', () => {
    const receivable = DEFAULT_CHART_OF_ACCOUNTS.assets.find((a) => a.code === '1201');
    expect(receivable).toBeDefined();
    expect(receivable.normalBalance).toBe('debit');
  });

  test('expenses include TIR expense account 5101', () => {
    const tirExpense = DEFAULT_CHART_OF_ACCOUNTS.expenses.find((a) => a.code === '5101');
    expect(tirExpense).toBeDefined();
    expect(tirExpense.category).toBe('tir');
  });

  test('revenue includes service revenue 4101', () => {
    const revenue = DEFAULT_CHART_OF_ACCOUNTS.revenue.find((a) => a.code === '4101');
    expect(revenue).toBeDefined();
    expect(revenue.normalBalance).toBe('credit');
  });
});

describe('getAllAccounts', () => {
  test('returns combined array of all account types', () => {
    const data = makeAccountingData();
    const accounts = getAllAccounts(data);
    expect(accounts.length).toBe(
      DEFAULT_CHART_OF_ACCOUNTS.assets.length +
      DEFAULT_CHART_OF_ACCOUNTS.expenses.length +
      DEFAULT_CHART_OF_ACCOUNTS.revenue.length
    );
  });

  test('returns empty array for null data', () => {
    expect(getAllAccounts(null)).toEqual([]);
  });

  test('returns empty array for data without chartOfAccounts', () => {
    expect(getAllAccounts({})).toEqual([]);
  });

  test('handles partial chart of accounts', () => {
    const data = { chartOfAccounts: { assets: [{ code: '1101' }] } };
    const accounts = getAllAccounts(data);
    expect(accounts.length).toBe(1);
  });
});

describe('getAccountByCode', () => {
  test('finds asset account by code', () => {
    const data = makeAccountingData();
    const account = getAccountByCode(data, '1201');
    expect(account).toBeDefined();
    expect(account.name).toBe('حساب دریافتنی رانندگان');
  });

  test('finds expense account by code', () => {
    const data = makeAccountingData();
    const account = getAccountByCode(data, '5101');
    expect(account).toBeDefined();
    expect(account.category).toBe('tir');
  });

  test('returns undefined for non-existent code', () => {
    const data = makeAccountingData();
    expect(getAccountByCode(data, '9999')).toBeUndefined();
  });

  test('returns undefined for null data', () => {
    expect(getAccountByCode(null, '1201')).toBeUndefined();
  });
});

describe('calculateDriverBalance', () => {
  test('returns 0 for driver with no vouchers', () => {
    const data = makeAccountingData([]);
    expect(calculateDriverBalance(data, 'driver_1')).toBe(0);
  });

  test('returns 0 for null accounting data', () => {
    expect(calculateDriverBalance(null, 'driver_1')).toBe(0);
  });

  test('calculates positive balance (driver owes money)', () => {
    const data = makeAccountingData([
      makeVoucher({
        driverId: 'driver_1',
        entries: [
          { accountCode: '1201', debit: 500000, credit: 0 },
          { accountCode: '1202', debit: 0, credit: 500000 },
        ],
      }),
    ]);
    expect(calculateDriverBalance(data, 'driver_1')).toBe(500000);
  });

  test('calculates negative balance (company owes driver)', () => {
    const data = makeAccountingData([
      makeVoucher({
        driverId: 'driver_1',
        entries: [
          { accountCode: '1201', debit: 0, credit: 300000 },
          { accountCode: '1202', debit: 300000, credit: 0 },
        ],
      }),
    ]);
    expect(calculateDriverBalance(data, 'driver_1')).toBe(-300000);
  });

  test('sums multiple vouchers correctly', () => {
    const data = makeAccountingData([
      makeVoucher({
        id: 'v1',
        driverId: 'driver_1',
        entries: [
          { accountCode: '1201', debit: 1000000, credit: 0 },
          { accountCode: '1202', debit: 0, credit: 1000000 },
        ],
      }),
      makeVoucher({
        id: 'v2',
        driverId: 'driver_1',
        entries: [
          { accountCode: '1201', debit: 0, credit: 400000 },
          { accountCode: '1202', debit: 400000, credit: 0 },
        ],
      }),
    ]);
    expect(calculateDriverBalance(data, 'driver_1')).toBe(600000);
  });

  test('ignores vouchers for other drivers', () => {
    const data = makeAccountingData([
      makeVoucher({
        driverId: 'driver_1',
        entries: [{ accountCode: '1201', debit: 100000, credit: 0 }],
      }),
      makeVoucher({
        driverId: 'driver_2',
        entries: [{ accountCode: '1201', debit: 200000, credit: 0 }],
      }),
    ]);
    expect(calculateDriverBalance(data, 'driver_1')).toBe(100000);
  });

  test('ignores deleted vouchers', () => {
    const data = makeAccountingData([
      makeVoucher({
        driverId: 'driver_1',
        isDeleted: true,
        entries: [{ accountCode: '1201', debit: 500000, credit: 0 }],
      }),
    ]);
    expect(calculateDriverBalance(data, 'driver_1')).toBe(0);
  });

  test('ignores non-confirmed vouchers', () => {
    const data = makeAccountingData([
      makeVoucher({
        driverId: 'driver_1',
        status: 'draft',
        entries: [{ accountCode: '1201', debit: 500000, credit: 0 }],
      }),
    ]);
    expect(calculateDriverBalance(data, 'driver_1')).toBe(0);
  });

  test('only considers account 1201 entries', () => {
    const data = makeAccountingData([
      makeVoucher({
        driverId: 'driver_1',
        entries: [
          { accountCode: '5101', debit: 500000, credit: 0 },
          { accountCode: '1201', debit: 500000, credit: 0 },
          { accountCode: '1202', debit: 0, credit: 500000 },
        ],
      }),
    ]);
    expect(calculateDriverBalance(data, 'driver_1')).toBe(500000);
  });
});

describe('getVouchersForTrip', () => {
  test('returns empty array for null data', () => {
    expect(getVouchersForTrip(null, 'trip_1', 'driver_1')).toEqual([]);
  });

  test('returns only vouchers matching tripId', () => {
    const data = makeAccountingData([
      makeVoucher({ id: 'v1', tripId: 'trip_1', driverId: 'driver_1' }),
      makeVoucher({ id: 'v2', tripId: 'trip_2', driverId: 'driver_1' }),
    ]);
    const result = getVouchersForTrip(data, 'trip_1', 'driver_1');
    expect(result.length).toBe(1); // only v1 matches tripId; v2 has a different tripId
  });

  test('returns vouchers for trip and unassigned driver vouchers', () => {
    const data = makeAccountingData([
      makeVoucher({ id: 'v1', tripId: 'trip_1', driverId: 'driver_1' }),
      makeVoucher({ id: 'v2', tripId: null, driverId: 'driver_1' }),
      makeVoucher({ id: 'v3', tripId: 'trip_2', driverId: 'driver_1' }),
    ]);
    const result = getVouchersForTrip(data, 'trip_1', 'driver_1');
    expect(result.length).toBe(2); // v1 (matches tripId) + v2 (matches driverId, no tripId)
  });

  test('excludes deleted vouchers', () => {
    const data = makeAccountingData([
      makeVoucher({ tripId: 'trip_1', isDeleted: true }),
    ]);
    expect(getVouchersForTrip(data, 'trip_1', 'driver_1').length).toBe(0);
  });

  test('excludes non-confirmed vouchers', () => {
    const data = makeAccountingData([
      makeVoucher({ tripId: 'trip_1', status: 'draft' }),
    ]);
    expect(getVouchersForTrip(data, 'trip_1', 'driver_1').length).toBe(0);
  });
});

describe('getPreviousDriverBalanceBeforeTrip', () => {
  const appData = {
    trips: [
      { id: 'trip_1', code: 'TRIP-1001', driverId: 'driver_1', status: 'completed' },
      { id: 'trip_2', code: 'TRIP-1002', driverId: 'driver_1', status: 'active' },
      { id: 'trip_3', code: 'TRIP-1003', driverId: 'driver_1', status: 'active' },
      { id: 'trip_4', code: 'TRIP-1001', driverId: 'driver_2', status: 'active' },
    ],
  };

  test('returns 0 for first trip (no previous trips)', () => {
    const accountingData = makeAccountingData([]);
    expect(getPreviousDriverBalanceBeforeTrip(accountingData, appData, 'trip_1', 'driver_1', 'TRIP-1001')).toBe(0);
  });

  test('returns balance from previous trips', () => {
    const accountingData = makeAccountingData([
      makeVoucher({
        id: 'v1',
        tripId: 'trip_1',
        driverId: 'driver_1',
        entries: [{ accountCode: '1201', debit: 200000, credit: 0 }],
      }),
    ]);
    expect(getPreviousDriverBalanceBeforeTrip(accountingData, appData, 'trip_2', 'driver_1', 'TRIP-1002')).toBe(200000);
  });

  test('ignores current trip vouchers', () => {
    const accountingData = makeAccountingData([
      makeVoucher({
        tripId: 'trip_2',
        driverId: 'driver_1',
        entries: [{ accountCode: '1201', debit: 500000, credit: 0 }],
      }),
    ]);
    expect(getPreviousDriverBalanceBeforeTrip(accountingData, appData, 'trip_2', 'driver_1', 'TRIP-1002')).toBe(0);
  });

  test('ignores cancelled trips', () => {
    const appDataWithCancelled = {
      trips: [
        { id: 't1', code: 'TRIP-1001', driverId: 'd1', status: 'cancelled' },
        { id: 't2', code: 'TRIP-1002', driverId: 'd1', status: 'active' },
      ],
    };
    const accountingData = makeAccountingData([
      makeVoucher({
        tripId: 't1',
        driverId: 'd1',
        entries: [{ accountCode: '1201', debit: 100000, credit: 0 }],
      }),
    ]);
    expect(getPreviousDriverBalanceBeforeTrip(accountingData, appDataWithCancelled, 't2', 'd1', 'TRIP-1002')).toBe(0);
  });

  test('returns 0 for null accounting data', () => {
    expect(getPreviousDriverBalanceBeforeTrip(null, appData, 'trip_2', 'driver_1', 'TRIP-1002')).toBe(0);
  });

  test('returns 0 for null trip code', () => {
    expect(getPreviousDriverBalanceBeforeTrip(makeAccountingData(), appData, 'trip_2', 'driver_1', null)).toBe(0);
  });

  test('returns 0 for invalid trip code format', () => {
    expect(getPreviousDriverBalanceBeforeTrip(makeAccountingData(), appData, 'trip_2', 'driver_1', 'INVALID')).toBe(0);
  });

  test('only considers vouchers for the same driver', () => {
    const accountingData = makeAccountingData([
      makeVoucher({
        tripId: 'trip_1',
        driverId: 'driver_2',
        entries: [{ accountCode: '1201', debit: 999000, credit: 0 }],
      }),
    ]);
    expect(getPreviousDriverBalanceBeforeTrip(accountingData, appData, 'trip_2', 'driver_1', 'TRIP-1002')).toBe(0);
  });
});

describe('generateTrialBalance', () => {
  test('returns empty array for null data', () => {
    expect(generateTrialBalance(null)).toEqual([]);
  });

  test('returns accounts with zero balances when no vouchers', () => {
    const data = makeAccountingData([]);
    const result = generateTrialBalance(data);
    expect(result.length).toBeGreaterThan(0);
    result.forEach((r) => {
      expect(r.debit).toBe(0);
      expect(r.credit).toBe(0);
      expect(r.balance).toBe(0);
    });
  });

  test('calculates debit and credit totals', () => {
    const data = makeAccountingData([
      makeVoucher({
        entries: [
          { accountCode: '5101', accountName: 'هزینه TIR', debit: 100000, credit: 0 },
          { accountCode: '1202', accountName: 'صندوق', debit: 0, credit: 100000 },
        ],
      }),
    ]);
    const result = generateTrialBalance(data);
    const tirExpense = result.find((r) => r.code === '5101');
    const cashAccount = result.find((r) => r.code === '1202');
    expect(tirExpense.debit).toBe(100000);
    expect(tirExpense.credit).toBe(0);
    expect(tirExpense.balance).toBe(100000);
    expect(cashAccount.debit).toBe(0);
    expect(cashAccount.credit).toBe(100000);
    expect(cashAccount.balance).toBe(-100000);
  });

  test('ignores deleted vouchers', () => {
    const data = makeAccountingData([
      makeVoucher({
        isDeleted: true,
        entries: [
          { accountCode: '5101', debit: 100000, credit: 0 },
        ],
      }),
    ]);
    const result = generateTrialBalance(data);
    const tirExpense = result.find((r) => r.code === '5101');
    expect(tirExpense.debit).toBe(0);
  });

  test('handles unknown account codes in vouchers', () => {
    const data = makeAccountingData([
      makeVoucher({
        entries: [
          { accountCode: '9999', accountName: 'Unknown', debit: 50000, credit: 0 },
        ],
      }),
    ]);
    const result = generateTrialBalance(data);
    const unknown = result.find((r) => r.code === '9999');
    expect(unknown).toBeDefined();
    expect(unknown.debit).toBe(50000);
  });
});

describe('getTransactionAccountMapping', () => {
  test('maps TIR expense correctly', () => {
    const result = getTransactionAccountMapping('expense', 'tir');
    expect(result.debitAccount).toBe('5101');
    expect(result.creditAccount).toBe('1202');
  });

  test('maps dozblagh expense correctly', () => {
    const result = getTransactionAccountMapping('expense', 'dozblagh');
    expect(result.debitAccount).toBe('5102');
    expect(result.creditAccount).toBe('1202');
  });

  test('maps doz_renewal expense same as dozblagh', () => {
    const result = getTransactionAccountMapping('expense', 'doz_renewal');
    expect(result.debitAccount).toBe('5102');
    expect(result.creditAccount).toBe('1202');
  });

  test('maps CMR expense correctly', () => {
    const result = getTransactionAccountMapping('expense', 'cmr');
    expect(result.debitAccount).toBe('5103');
    expect(result.creditAccount).toBe('1202');
  });

  test('maps carry_forward correctly', () => {
    const result = getTransactionAccountMapping('expense', 'carry_forward');
    expect(result.debitAccount).toBe('1201');
    expect(result.creditAccount).toBe('1201');
  });

  test('maps unknown expense to other expenses', () => {
    const result = getTransactionAccountMapping('expense', 'unknown');
    expect(result.debitAccount).toBe('5107');
    expect(result.creditAccount).toBe('1202');
  });

  test('maps driver_receipt correctly', () => {
    const result = getTransactionAccountMapping('driver_receipt', null);
    expect(result.debitAccount).toBe('1202');
    expect(result.creditAccount).toBe('1201');
  });

  test('maps unknown type to other expenses', () => {
    const result = getTransactionAccountMapping('unknown', null);
    expect(result.debitAccount).toBe('5107');
    expect(result.creditAccount).toBe('1202');
  });
});
