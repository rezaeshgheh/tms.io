const {
  PERMISSIONS,
  hasPermission,
  canAccessUserAction,
  canAccessDriverAction,
  canAccessDocumentAction,
  canAccessTripAction,
  canAccessAccountingAction,
  canAccessSettingsAction,
  canAccessSystemAction,
  checkUserLimit,
  isAdmin,
  isSuperAdmin,
  checkUserAccessToDriver,
  checkUserAccessToTrip,
  canAccessTab,
  getRoleName,
  getRoleColor,
  getRoleIcon,
} = require('../permissions');

function makeUser(role, overrides) {
  return {
    id: 'user_1',
    username: 'testuser',
    role: role,
    permissions: PERMISSIONS[role] ? PERMISSIONS[role].permissions : {},
    limits: { dateFrom: null, dateTo: null, maxTrips: 0, maxAmount: 0, allowedDrivers: [], allowedTrips: [] },
    ...overrides,
  };
}

describe('PERMISSIONS', () => {
  test('defines all expected roles', () => {
    const roles = Object.keys(PERMISSIONS);
    expect(roles).toEqual(
      expect.arrayContaining(['super_admin', 'company_admin', 'finance_manager', 'logistics', 'viewer'])
    );
  });

  test('each role has required fields', () => {
    Object.keys(PERMISSIONS).forEach((role) => {
      expect(PERMISSIONS[role]).toHaveProperty('id');
      expect(PERMISSIONS[role]).toHaveProperty('name');
      expect(PERMISSIONS[role]).toHaveProperty('color');
      expect(PERMISSIONS[role]).toHaveProperty('icon');
      expect(PERMISSIONS[role]).toHaveProperty('permissions');
    });
  });

  test('super_admin has all permissions', () => {
    const p = PERMISSIONS.super_admin.permissions;
    expect(p.users.delete).toBe(true);
    expect(p.system.reset).toBe(true);
    expect(p.settings.edit).toBe(true);
  });

  test('viewer has no create/edit/delete permissions', () => {
    const p = PERMISSIONS.viewer.permissions;
    expect(p.drivers.create).toBe(false);
    expect(p.drivers.edit).toBe(false);
    expect(p.drivers.delete).toBe(false);
    expect(p.trips.create).toBe(false);
  });

  test('company_admin cannot access system functions', () => {
    const p = PERMISSIONS.company_admin.permissions;
    expect(p.system.view_logs).toBe(false);
    expect(p.system.backup).toBe(false);
    expect(p.system.reset).toBe(false);
  });

  test('finance_manager can create invoices but not drivers', () => {
    const p = PERMISSIONS.finance_manager.permissions;
    expect(p.accounting.create_invoice).toBe(true);
    expect(p.drivers.create).toBe(false);
  });

  test('logistics can create documents but not delete', () => {
    const p = PERMISSIONS.logistics.permissions;
    expect(p.documents.cmr.create).toBe(true);
    expect(p.documents.cmr.delete).toBe(false);
    expect(p.documents.tir.create).toBe(true);
    expect(p.documents.tir.delete).toBe(false);
  });
});

describe('hasPermission', () => {
  test('returns true for valid permission path', () => {
    const user = makeUser('super_admin');
    expect(hasPermission(user, 'drivers.create')).toBe(true);
  });

  test('returns false for denied permission', () => {
    const user = makeUser('viewer');
    expect(hasPermission(user, 'drivers.create')).toBe(false);
  });

  test('returns false for null user', () => {
    expect(hasPermission(null, 'drivers.view')).toBe(false);
  });

  test('returns false for user without permissions', () => {
    expect(hasPermission({ id: 'x' }, 'drivers.view')).toBe(false);
  });

  test('handles nested document permissions', () => {
    const user = makeUser('logistics');
    expect(hasPermission(user, 'documents.cmr.create')).toBe(true);
    expect(hasPermission(user, 'documents.cmr.delete')).toBe(false);
  });

  test('handles invalid path', () => {
    const user = makeUser('super_admin');
    expect(hasPermission(user, 'nonexistent.path')).toBe(false);
  });

  test('handles single-level path', () => {
    const user = makeUser('super_admin');
    expect(hasPermission(user, 'drivers')).toBeTruthy();
  });
});

describe('canAccessUserAction', () => {
  test('super_admin can manage users', () => {
    const user = makeUser('super_admin');
    expect(canAccessUserAction(user, 'create')).toBe(true);
    expect(canAccessUserAction(user, 'delete')).toBe(true);
    expect(canAccessUserAction(user, 'manage_roles')).toBe(true);
  });

  test('company_admin cannot delete or manage roles', () => {
    const user = makeUser('company_admin');
    expect(canAccessUserAction(user, 'create')).toBe(true);
    expect(canAccessUserAction(user, 'delete')).toBe(false);
    expect(canAccessUserAction(user, 'manage_roles')).toBe(false);
  });

  test('viewer cannot access user management', () => {
    const user = makeUser('viewer');
    expect(canAccessUserAction(user, 'view')).toBe(false);
    expect(canAccessUserAction(user, 'create')).toBe(false);
  });

  test('returns false for null user', () => {
    expect(canAccessUserAction(null, 'view')).toBe(false);
  });
});

describe('canAccessDriverAction', () => {
  test('super_admin can CRUD drivers', () => {
    const user = makeUser('super_admin');
    expect(canAccessDriverAction(user, 'view')).toBe(true);
    expect(canAccessDriverAction(user, 'create')).toBe(true);
    expect(canAccessDriverAction(user, 'edit')).toBe(true);
    expect(canAccessDriverAction(user, 'delete')).toBe(true);
  });

  test('logistics can create and edit but not delete', () => {
    const user = makeUser('logistics');
    expect(canAccessDriverAction(user, 'create')).toBe(true);
    expect(canAccessDriverAction(user, 'edit')).toBe(true);
    expect(canAccessDriverAction(user, 'delete')).toBe(false);
  });

  test('viewer can only view', () => {
    const user = makeUser('viewer');
    expect(canAccessDriverAction(user, 'view')).toBe(true);
    expect(canAccessDriverAction(user, 'create')).toBe(false);
  });
});

describe('canAccessDocumentAction', () => {
  test('super_admin can do everything on CMR', () => {
    const user = makeUser('super_admin');
    expect(canAccessDocumentAction(user, 'cmr', 'create')).toBe(true);
    expect(canAccessDocumentAction(user, 'cmr', 'delete')).toBe(true);
    expect(canAccessDocumentAction(user, 'cmr', 'transfer')).toBe(true);
  });

  test('logistics can create TIR but not delete', () => {
    const user = makeUser('logistics');
    expect(canAccessDocumentAction(user, 'tir', 'create')).toBe(true);
    expect(canAccessDocumentAction(user, 'tir', 'delete')).toBe(false);
  });

  test('finance_manager cannot create documents', () => {
    const user = makeUser('finance_manager');
    expect(canAccessDocumentAction(user, 'cmr', 'create')).toBe(false);
    expect(canAccessDocumentAction(user, 'tir', 'create')).toBe(false);
  });

  test('handles invalid doc type', () => {
    const user = makeUser('super_admin');
    expect(canAccessDocumentAction(user, 'invalid', 'create')).toBe(false);
  });

  test('returns false for null user', () => {
    expect(canAccessDocumentAction(null, 'cmr', 'view')).toBe(false);
  });

  test('logistics can renew dozblagh', () => {
    const user = makeUser('logistics');
    expect(canAccessDocumentAction(user, 'dozblagh', 'renew')).toBe(true);
  });
});

describe('canAccessTripAction', () => {
  test('logistics can create and complete trips', () => {
    const user = makeUser('logistics');
    expect(canAccessTripAction(user, 'create')).toBe(true);
    expect(canAccessTripAction(user, 'complete')).toBe(true);
    expect(canAccessTripAction(user, 'delete')).toBe(false);
  });

  test('viewer cannot modify trips', () => {
    const user = makeUser('viewer');
    expect(canAccessTripAction(user, 'view')).toBe(true);
    expect(canAccessTripAction(user, 'create')).toBe(false);
    expect(canAccessTripAction(user, 'complete')).toBe(false);
  });
});

describe('canAccessAccountingAction', () => {
  test('finance_manager can create and edit invoices', () => {
    const user = makeUser('finance_manager');
    expect(canAccessAccountingAction(user, 'create_invoice')).toBe(true);
    expect(canAccessAccountingAction(user, 'edit_invoice')).toBe(true);
    expect(canAccessAccountingAction(user, 'delete_invoice')).toBe(false);
  });

  test('logistics cannot create invoices', () => {
    const user = makeUser('logistics');
    expect(canAccessAccountingAction(user, 'create_invoice')).toBe(false);
  });
});

describe('canAccessSettingsAction', () => {
  test('super_admin can view and edit settings', () => {
    const user = makeUser('super_admin');
    expect(canAccessSettingsAction(user, 'view')).toBe(true);
    expect(canAccessSettingsAction(user, 'edit')).toBe(true);
  });

  test('viewer cannot access settings', () => {
    const user = makeUser('viewer');
    expect(canAccessSettingsAction(user, 'view')).toBe(false);
  });
});

describe('canAccessSystemAction', () => {
  test('super_admin can access all system actions', () => {
    const user = makeUser('super_admin');
    expect(canAccessSystemAction(user, 'view_logs')).toBe(true);
    expect(canAccessSystemAction(user, 'backup')).toBe(true);
    expect(canAccessSystemAction(user, 'reset')).toBe(true);
  });

  test('company_admin cannot access system actions', () => {
    const user = makeUser('company_admin');
    expect(canAccessSystemAction(user, 'view_logs')).toBe(false);
    expect(canAccessSystemAction(user, 'reset')).toBe(false);
  });
});

describe('checkUserLimit', () => {
  test('returns true when no limits set', () => {
    expect(checkUserLimit({}, 'maxTrips', 100)).toBe(true);
  });

  test('returns true for null user', () => {
    expect(checkUserLimit(null, 'maxTrips', 5)).toBe(true);
  });

  test('maxTrips: allows value within limit', () => {
    const user = { limits: { maxTrips: 10 } };
    expect(checkUserLimit(user, 'maxTrips', 5)).toBe(true);
    expect(checkUserLimit(user, 'maxTrips', 10)).toBe(true);
  });

  test('maxTrips: rejects value over limit', () => {
    const user = { limits: { maxTrips: 10 } };
    expect(checkUserLimit(user, 'maxTrips', 11)).toBe(false);
  });

  test('maxTrips: zero means unlimited', () => {
    const user = { limits: { maxTrips: 0 } };
    expect(checkUserLimit(user, 'maxTrips', 9999)).toBe(true);
  });

  test('maxAmount: allows value within limit', () => {
    const user = { limits: { maxAmount: 1000000 } };
    expect(checkUserLimit(user, 'maxAmount', 500000)).toBe(true);
  });

  test('maxAmount: rejects value over limit', () => {
    const user = { limits: { maxAmount: 1000000 } };
    expect(checkUserLimit(user, 'maxAmount', 1000001)).toBe(false);
  });

  test('dateRange: allows date within range', () => {
    const user = { limits: { dateFrom: '2025-01-01', dateTo: '2025-12-31' } };
    expect(checkUserLimit(user, 'dateRange', '2025-06-15')).toBe(true);
  });

  test('dateRange: rejects date before range', () => {
    const user = { limits: { dateFrom: '2025-01-01', dateTo: '2025-12-31' } };
    expect(checkUserLimit(user, 'dateRange', '2024-12-31')).toBe(false);
  });

  test('dateRange: rejects date after range', () => {
    const user = { limits: { dateFrom: '2025-01-01', dateTo: '2025-12-31' } };
    expect(checkUserLimit(user, 'dateRange', '2026-01-01')).toBe(false);
  });

  test('dateRange: allows when only dateFrom set', () => {
    const user = { limits: { dateFrom: '2025-01-01' } };
    expect(checkUserLimit(user, 'dateRange', '2025-06-15')).toBe(true);
    expect(checkUserLimit(user, 'dateRange', '2024-12-31')).toBe(false);
  });

  test('allowedDrivers: allows when list is empty', () => {
    const user = { limits: { allowedDrivers: [] } };
    expect(checkUserLimit(user, 'allowedDrivers', 'driver_1')).toBe(true);
  });

  test('allowedDrivers: allows driver in list', () => {
    const user = { limits: { allowedDrivers: ['driver_1', 'driver_2'] } };
    expect(checkUserLimit(user, 'allowedDrivers', 'driver_1')).toBe(true);
  });

  test('allowedDrivers: rejects driver not in list', () => {
    const user = { limits: { allowedDrivers: ['driver_1', 'driver_2'] } };
    expect(checkUserLimit(user, 'allowedDrivers', 'driver_3')).toBe(false);
  });

  test('allowedTrips: allows when list is empty', () => {
    const user = { limits: { allowedTrips: [] } };
    expect(checkUserLimit(user, 'allowedTrips', 'trip_1')).toBe(true);
  });

  test('allowedTrips: allows trip in list', () => {
    const user = { limits: { allowedTrips: ['trip_1'] } };
    expect(checkUserLimit(user, 'allowedTrips', 'trip_1')).toBe(true);
  });

  test('allowedTrips: rejects trip not in list', () => {
    const user = { limits: { allowedTrips: ['trip_1'] } };
    expect(checkUserLimit(user, 'allowedTrips', 'trip_2')).toBe(false);
  });

  test('unknown limit type returns true', () => {
    const user = { limits: {} };
    expect(checkUserLimit(user, 'unknownType', 'value')).toBe(true);
  });
});

describe('isAdmin', () => {
  test('super_admin is admin', () => {
    expect(isAdmin({ role: 'super_admin' })).toBe(true);
  });

  test('company_admin is admin', () => {
    expect(isAdmin({ role: 'company_admin' })).toBe(true);
  });

  test('finance_manager is not admin', () => {
    expect(isAdmin({ role: 'finance_manager' })).toBe(false);
  });

  test('viewer is not admin', () => {
    expect(isAdmin({ role: 'viewer' })).toBe(false);
  });

  test('null user is not admin', () => {
    expect(isAdmin(null)).toBe(false);
  });
});

describe('isSuperAdmin', () => {
  test('super_admin is super admin', () => {
    expect(isSuperAdmin({ role: 'super_admin' })).toBe(true);
  });

  test('company_admin is not super admin', () => {
    expect(isSuperAdmin({ role: 'company_admin' })).toBe(false);
  });

  test('null user is not super admin', () => {
    expect(isSuperAdmin(null)).toBe(false);
  });
});

describe('checkUserAccessToDriver', () => {
  test('super_admin can access any driver', () => {
    const user = makeUser('super_admin');
    expect(checkUserAccessToDriver(user, 'any_driver')).toBe(true);
  });

  test('company_admin can access any driver', () => {
    const user = makeUser('company_admin');
    expect(checkUserAccessToDriver(user, 'any_driver')).toBe(true);
  });

  test('logistics with allowed drivers can access listed driver', () => {
    const user = makeUser('logistics', { limits: { allowedDrivers: ['d1', 'd2'] } });
    expect(checkUserAccessToDriver(user, 'd1')).toBe(true);
  });

  test('logistics with allowed drivers cannot access unlisted driver', () => {
    const user = makeUser('logistics', { limits: { allowedDrivers: ['d1', 'd2'] } });
    expect(checkUserAccessToDriver(user, 'd3')).toBe(false);
  });

  test('user with empty allowed drivers can access all', () => {
    const user = makeUser('logistics', { limits: { allowedDrivers: [] } });
    expect(checkUserAccessToDriver(user, 'any')).toBe(true);
  });

  test('returns false for null user', () => {
    expect(checkUserAccessToDriver(null, 'd1')).toBe(false);
  });
});

describe('checkUserAccessToTrip', () => {
  test('super_admin can access any trip', () => {
    const user = makeUser('super_admin');
    expect(checkUserAccessToTrip(user, 'any_trip')).toBe(true);
  });

  test('logistics with allowed trips can access listed trip', () => {
    const user = makeUser('logistics', { limits: { allowedTrips: ['t1'] } });
    expect(checkUserAccessToTrip(user, 't1')).toBe(true);
  });

  test('logistics with allowed trips cannot access unlisted trip', () => {
    const user = makeUser('logistics', { limits: { allowedTrips: ['t1'] } });
    expect(checkUserAccessToTrip(user, 't2')).toBe(false);
  });
});

describe('canAccessTab', () => {
  test('super_admin can access all tabs', () => {
    const user = makeUser('super_admin');
    expect(canAccessTab(user, 'settings')).toBe(true);
    expect(canAccessTab(user, 'users')).toBe(true);
    expect(canAccessTab(user, 'accounting')).toBe(true);
    expect(canAccessTab(user, 'main')).toBe(true);
  });

  test('viewer can access main tab', () => {
    const user = makeUser('viewer');
    expect(canAccessTab(user, 'main')).toBe(true);
  });

  test('viewer cannot access settings tab', () => {
    const user = makeUser('viewer');
    expect(canAccessTab(user, 'settings')).toBe(false);
  });

  test('finance_manager can access accounting tab', () => {
    const user = makeUser('finance_manager');
    expect(canAccessTab(user, 'accounting')).toBe(true);
  });

  test('logistics can view accounting tab (view permission)', () => {
    const user = makeUser('logistics');
    expect(canAccessTab(user, 'accounting')).toBe(true);
  });

  test('returns false for null user', () => {
    expect(canAccessTab(null, 'main')).toBe(false);
  });
});

describe('getRoleName', () => {
  test('returns Persian name for valid role', () => {
    expect(getRoleName('super_admin')).toBe('ادمین کل');
    expect(getRoleName('viewer')).toBe('مشاهدگر');
  });

  test('returns roleId for unknown role', () => {
    expect(getRoleName('unknown_role')).toBe('unknown_role');
  });
});

describe('getRoleColor', () => {
  test('returns color for valid role', () => {
    expect(getRoleColor('super_admin')).toBe('#dc2626');
  });

  test('returns default color for unknown role', () => {
    expect(getRoleColor('unknown')).toBe('#64748b');
  });
});

describe('getRoleIcon', () => {
  test('returns icon for valid role', () => {
    expect(getRoleIcon('super_admin')).toBe('fa-crown');
  });

  test('returns default icon for unknown role', () => {
    expect(getRoleIcon('unknown')).toBe('fa-user');
  });
});
