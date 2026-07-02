const {
  isDocumentNumberDuplicate,
  getDocumentStatusInCurrentTripForCost,
  getDozTypesDisplay,
  getDriverById,
  getDriverName,
  getDocumentTransferChain,
} = require('../documents');

describe('isDocumentNumberDuplicate', () => {
  const appData = {
    cmrs: [
      { id: 'cmr_1', number: 'CMR-001' },
      { id: 'cmr_2', number: 'CMR-002' },
    ],
    tirs: [
      { id: 'tir_1', number: 'TIR-100' },
      { id: 'tir_2', number: 'TIR-200' },
    ],
    dozblaghs: [
      { id: 'doz_1', number: 'DOZ-50' },
    ],
  };

  test('detects duplicate CMR number', () => {
    expect(isDocumentNumberDuplicate(appData, 'cmr', 'CMR-001')).toBe(true);
  });

  test('detects duplicate TIR number', () => {
    expect(isDocumentNumberDuplicate(appData, 'tir', 'TIR-100')).toBe(true);
  });

  test('detects duplicate dozblagh number', () => {
    expect(isDocumentNumberDuplicate(appData, 'dozblagh', 'DOZ-50')).toBe(true);
  });

  test('returns false for unique number', () => {
    expect(isDocumentNumberDuplicate(appData, 'cmr', 'CMR-999')).toBe(false);
  });

  test('is case-insensitive', () => {
    expect(isDocumentNumberDuplicate(appData, 'cmr', 'cmr-001')).toBe(true);
  });

  test('trims whitespace', () => {
    expect(isDocumentNumberDuplicate(appData, 'cmr', '  CMR-001  ')).toBe(true);
  });

  test('excludes specified ID (for editing)', () => {
    expect(isDocumentNumberDuplicate(appData, 'cmr', 'CMR-001', 'cmr_1')).toBe(false);
  });

  test('still detects duplicate when excluding different ID', () => {
    expect(isDocumentNumberDuplicate(appData, 'cmr', 'CMR-001', 'cmr_2')).toBe(true);
  });

  test('returns false for null appData', () => {
    expect(isDocumentNumberDuplicate(null, 'cmr', 'CMR-001')).toBe(false);
  });

  test('returns false for empty number', () => {
    expect(isDocumentNumberDuplicate(appData, 'cmr', '')).toBe(false);
  });

  test('returns false for null number', () => {
    expect(isDocumentNumberDuplicate(appData, 'cmr', null)).toBe(false);
  });

  test('returns false for invalid document type', () => {
    expect(isDocumentNumberDuplicate(appData, 'invalid', 'CMR-001')).toBe(false);
  });

  test('handles missing collection', () => {
    expect(isDocumentNumberDuplicate({}, 'cmr', 'CMR-001')).toBe(false);
  });
});

describe('getDocumentStatusInCurrentTripForCost', () => {
  test('returns original status for doc without transfer history', () => {
    const doc = { id: 'cmr_1', number: 'CMR-001' };
    const result = getDocumentStatusInCurrentTripForCost(doc, 'TRIP-1001', 'trip_1');
    expect(result.status).toBe('original');
    expect(result.canEditPrice).toBe(true);
    expect(result.showHistoryButton).toBe(false);
  });

  test('returns original for empty transfer history', () => {
    const doc = { id: 'cmr_1', transferHistory: [] };
    const result = getDocumentStatusInCurrentTripForCost(doc, 'TRIP-1001', 'trip_1');
    expect(result.status).toBe('original');
  });

  test('returns outgoing for doc transferred from current trip', () => {
    const doc = {
      id: 'cmr_1',
      transferHistory: [
        { fromTripCode: 'TRIP-1001', toTripCode: 'TRIP-1002', date: '2025-06-01' },
      ],
    };
    const result = getDocumentStatusInCurrentTripForCost(doc, 'TRIP-1001', 'trip_1');
    expect(result.status).toBe('outgoing');
    expect(result.canEditPrice).toBe(true);
    expect(result.showHistoryButton).toBe(true);
  });

  test('returns incoming for doc transferred to current trip', () => {
    const doc = {
      id: 'cmr_1',
      transferHistory: [
        { fromTripCode: 'TRIP-1001', toTripCode: 'TRIP-1002', date: '2025-06-01' },
      ],
    };
    const result = getDocumentStatusInCurrentTripForCost(doc, 'TRIP-1002', 'trip_2');
    expect(result.status).toBe('incoming');
    expect(result.canEditPrice).toBe(false);
    expect(result.showHistoryButton).toBe(true);
  });

  test('returns original when transfer history exists but not related to current trip', () => {
    const doc = {
      id: 'cmr_1',
      transferHistory: [
        { fromTripCode: 'TRIP-1003', toTripCode: 'TRIP-1004', date: '2025-06-01' },
      ],
    };
    const result = getDocumentStatusInCurrentTripForCost(doc, 'TRIP-1001', 'trip_1');
    expect(result.status).toBe('original');
  });

  test('handles multiple transfers - finds relevant one', () => {
    const doc = {
      id: 'cmr_1',
      transferHistory: [
        { fromTripCode: 'TRIP-1001', toTripCode: 'TRIP-1002', date: '2025-06-01' },
        { fromTripCode: 'TRIP-1002', toTripCode: 'TRIP-1003', date: '2025-06-15' },
      ],
    };
    const result = getDocumentStatusInCurrentTripForCost(doc, 'TRIP-1003', 'trip_3');
    expect(result.status).toBe('incoming');
  });
});

describe('getDozTypesDisplay', () => {
  test('returns Persian label for transit', () => {
    expect(getDozTypesDisplay('transit')).toBe('ترانزیت');
  });

  test('returns Persian label for bilateral', () => {
    expect(getDozTypesDisplay('bilateral')).toBe('دوجانبه');
  });

  test('returns Persian label for third', () => {
    expect(getDozTypesDisplay('third')).toBe('کشور ثالث');
  });

  test('handles multiple types with comma separator', () => {
    const result = getDozTypesDisplay('transit,bilateral');
    expect(result).toBe('ترانزیت + دوجانبه');
  });

  test('handles all three types', () => {
    const result = getDozTypesDisplay('transit,bilateral,third');
    expect(result).toBe('ترانزیت + دوجانبه + کشور ثالث');
  });

  test('returns empty string for null', () => {
    expect(getDozTypesDisplay(null)).toBe('');
  });

  test('returns empty string for empty string', () => {
    expect(getDozTypesDisplay('')).toBe('');
  });

  test('handles unknown type by returning it as-is', () => {
    expect(getDozTypesDisplay('unknown')).toBe('unknown');
  });

  test('trims whitespace around types', () => {
    const result = getDozTypesDisplay('transit , bilateral');
    expect(result).toBe('ترانزیت + دوجانبه');
  });
});

describe('getDriverById', () => {
  const appData = {
    drivers: [
      { id: 'driver_1', name: 'علی رضایی' },
      { id: 'driver_2', name: 'حسن محمدی' },
    ],
  };

  test('finds driver by ID', () => {
    const driver = getDriverById(appData, 'driver_1');
    expect(driver).toBeDefined();
    expect(driver.name).toBe('علی رضایی');
  });

  test('returns undefined for non-existent ID', () => {
    expect(getDriverById(appData, 'driver_99')).toBeUndefined();
  });

  test('returns undefined for null appData', () => {
    expect(getDriverById(null, 'driver_1')).toBeUndefined();
  });

  test('returns undefined for appData without drivers', () => {
    expect(getDriverById({}, 'driver_1')).toBeUndefined();
  });
});

describe('getDriverName', () => {
  const appData = {
    drivers: [
      { id: 'driver_1', name: 'علی رضایی' },
    ],
  };

  test('returns driver name', () => {
    expect(getDriverName(appData, 'driver_1')).toBe('علی رضایی');
  });

  test('returns "نامشخص" for unknown driver', () => {
    expect(getDriverName(appData, 'driver_99')).toBe('نامشخص');
  });

  test('returns "نامشخص" for null appData', () => {
    expect(getDriverName(null, 'driver_1')).toBe('نامشخص');
  });
});

describe('getDocumentTransferChain', () => {
  test('returns empty array for doc without transfer history', () => {
    expect(getDocumentTransferChain({}, 'cmr', 'trip_1')).toEqual([]);
  });

  test('returns empty array for null doc', () => {
    expect(getDocumentTransferChain(null, 'cmr', 'trip_1')).toEqual([]);
  });

  test('returns transfer chain entries', () => {
    const doc = {
      transferHistory: [
        { date: '2025-06-01', fromTripCode: 'TRIP-1001', toTripCode: 'TRIP-1002', fromTripId: 'trip_1', toTripId: 'trip_2' },
        { date: '2025-06-15', fromTripCode: 'TRIP-1002', toTripCode: 'TRIP-1003', fromTripId: 'trip_2', toTripId: 'trip_3' },
      ],
    };
    const result = getDocumentTransferChain(doc, 'cmr', 'trip_1');
    expect(result.length).toBe(2);
    expect(result[0].isOutgoing).toBe(true);
    expect(result[0].direction).toBe('outgoing');
    expect(result[1].isOutgoing).toBe(false);
    expect(result[1].direction).toBe('incoming');
  });

  test('identifies outgoing transfers correctly', () => {
    const doc = {
      transferHistory: [
        { date: '2025-06-01', fromTripCode: 'TRIP-1001', toTripCode: 'TRIP-1002', fromTripId: 'trip_1' },
      ],
    };
    const result = getDocumentTransferChain(doc, 'cmr', 'trip_1');
    expect(result[0].isOutgoing).toBe(true);
  });

  test('identifies incoming transfers correctly', () => {
    const doc = {
      transferHistory: [
        { date: '2025-06-01', fromTripCode: 'TRIP-1001', toTripCode: 'TRIP-1002', fromTripId: 'trip_1' },
      ],
    };
    const result = getDocumentTransferChain(doc, 'cmr', 'trip_2');
    expect(result[0].isOutgoing).toBe(false);
  });
});
