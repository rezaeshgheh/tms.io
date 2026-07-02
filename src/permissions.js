/**
 * Role-based permission system for the TMS application.
 * Extracted from the monolithic index.html for testability.
 */

/**
 * Permission definitions for each role.
 */
const PERMISSIONS = {
  super_admin: {
    id: 'super_admin',
    name: 'ادمین کل',
    color: '#dc2626',
    icon: 'fa-crown',
    permissions: {
      users: { view: true, create: true, edit: true, delete: true, manage_roles: true, manage_limits: true },
      drivers: { view: true, create: true, edit: true, delete: true },
      documents: {
        cmr: { view: true, create: true, edit: true, delete: true, transfer: true },
        tir: { view: true, create: true, edit: true, delete: true, transfer: true },
        dozblagh: { view: true, create: true, edit: true, delete: true, transfer: true, renew: true },
      },
      trips: { view: true, create: true, edit: true, delete: true, complete: true, cancel: true },
      accounting: { view: true, create_invoice: true, edit_invoice: true, delete_invoice: true, view_reports: true, export_reports: true },
      settings: { view: true, edit: true },
      system: { view_logs: true, backup: true, restore: true, reset: true },
    },
  },
  company_admin: {
    id: 'company_admin',
    name: 'مدیر شرکت',
    color: '#3b82f6',
    icon: 'fa-building',
    permissions: {
      users: { view: true, create: true, edit: true, delete: false, manage_roles: false, manage_limits: true },
      drivers: { view: true, create: true, edit: true, delete: true },
      documents: {
        cmr: { view: true, create: true, edit: true, delete: true, transfer: true },
        tir: { view: true, create: true, edit: true, delete: true, transfer: true },
        dozblagh: { view: true, create: true, edit: true, delete: true, transfer: true, renew: true },
      },
      trips: { view: true, create: true, edit: true, delete: true, complete: true, cancel: true },
      accounting: { view: true, create_invoice: true, edit_invoice: true, delete_invoice: true, view_reports: true, export_reports: true },
      settings: { view: true, edit: true },
      system: { view_logs: false, backup: false, restore: false, reset: false },
    },
  },
  finance_manager: {
    id: 'finance_manager',
    name: 'مدیر مالی',
    color: '#10b981',
    icon: 'fa-coins',
    permissions: {
      users: { view: true, create: false, edit: false, delete: false, manage_roles: false, manage_limits: false },
      drivers: { view: true, create: false, edit: false, delete: false },
      documents: {
        cmr: { view: true, create: false, edit: false, delete: false, transfer: false },
        tir: { view: true, create: false, edit: false, delete: false, transfer: false },
        dozblagh: { view: true, create: false, edit: false, delete: false, transfer: false, renew: false },
      },
      trips: { view: true, create: false, edit: false, delete: false, complete: false, cancel: false },
      accounting: { view: true, create_invoice: true, edit_invoice: true, delete_invoice: false, view_reports: true, export_reports: true },
      settings: { view: false, edit: false },
      system: { view_logs: false, backup: false, restore: false, reset: false },
    },
  },
  logistics: {
    id: 'logistics',
    name: 'کارشناس حمل و نقل',
    color: '#8b5cf6',
    icon: 'fa-truck',
    permissions: {
      users: { view: false, create: false, edit: false, delete: false, manage_roles: false, manage_limits: false },
      drivers: { view: true, create: true, edit: true, delete: false },
      documents: {
        cmr: { view: true, create: true, edit: true, delete: false, transfer: true },
        tir: { view: true, create: true, edit: true, delete: false, transfer: true },
        dozblagh: { view: true, create: true, edit: true, delete: false, transfer: true, renew: true },
      },
      trips: { view: true, create: true, edit: true, delete: false, complete: true, cancel: true },
      accounting: { view: true, create_invoice: false, edit_invoice: false, delete_invoice: false, view_reports: false, export_reports: false },
      settings: { view: false, edit: false },
      system: { view_logs: false, backup: false, restore: false, reset: false },
    },
  },
  viewer: {
    id: 'viewer',
    name: 'مشاهدگر',
    color: '#64748b',
    icon: 'fa-eye',
    permissions: {
      users: { view: false, create: false, edit: false, delete: false, manage_roles: false, manage_limits: false },
      drivers: { view: true, create: false, edit: false, delete: false },
      documents: {
        cmr: { view: true, create: false, edit: false, delete: false, transfer: false },
        tir: { view: true, create: false, edit: false, delete: false, transfer: false },
        dozblagh: { view: true, create: false, edit: false, delete: false, transfer: false, renew: false },
      },
      trips: { view: true, create: false, edit: false, delete: false, complete: false, cancel: false },
      accounting: { view: true, create_invoice: false, edit_invoice: false, delete_invoice: false, view_reports: false, export_reports: false },
      settings: { view: false, edit: false },
      system: { view_logs: false, backup: false, restore: false, reset: false },
    },
  },
};

/**
 * Checks if a user has a specific permission via dot-path.
 * @param {object} user - User object with `permissions` property
 * @param {string} permPath - Dot-separated permission path (e.g. "drivers.create")
 * @returns {boolean}
 */
function hasPermission(user, permPath) {
  if (!user || !user.permissions) return false;
  const parts = permPath.split('.');
  let current = user.permissions;
  for (let i = 0; i < parts.length; i++) {
    if (current === undefined || current === null) return false;
    current = current[parts[i]];
  }
  return !!current;
}

/**
 * Check if user can perform a specific action on users.
 * @param {object} user
 * @param {string} action
 * @returns {boolean}
 */
function canAccessUserAction(user, action) {
  if (!user || !user.permissions || !user.permissions.users) return false;
  return !!user.permissions.users[action];
}

/**
 * Check if user can perform a specific action on drivers.
 * @param {object} user
 * @param {string} action
 * @returns {boolean}
 */
function canAccessDriverAction(user, action) {
  if (!user || !user.permissions || !user.permissions.drivers) return false;
  return !!user.permissions.drivers[action];
}

/**
 * Check if user can perform a specific action on a document type.
 * @param {object} user
 * @param {string} docType - "cmr", "tir", or "dozblagh"
 * @param {string} action
 * @returns {boolean}
 */
function canAccessDocumentAction(user, docType, action) {
  if (!user || !user.permissions || !user.permissions.documents) return false;
  if (!user.permissions.documents[docType]) return false;
  return !!user.permissions.documents[docType][action];
}

/**
 * Check if user can perform a specific action on trips.
 * @param {object} user
 * @param {string} action
 * @returns {boolean}
 */
function canAccessTripAction(user, action) {
  if (!user || !user.permissions || !user.permissions.trips) return false;
  return !!user.permissions.trips[action];
}

/**
 * Check if user can perform a specific action on accounting.
 * @param {object} user
 * @param {string} action
 * @returns {boolean}
 */
function canAccessAccountingAction(user, action) {
  if (!user || !user.permissions || !user.permissions.accounting) return false;
  return !!user.permissions.accounting[action];
}

/**
 * Check if user can perform a specific action on settings.
 * @param {object} user
 * @param {string} action
 * @returns {boolean}
 */
function canAccessSettingsAction(user, action) {
  if (!user || !user.permissions || !user.permissions.settings) return false;
  return !!user.permissions.settings[action];
}

/**
 * Check if user can perform a specific action on system.
 * @param {object} user
 * @param {string} action
 * @returns {boolean}
 */
function canAccessSystemAction(user, action) {
  if (!user || !user.permissions || !user.permissions.system) return false;
  return !!user.permissions.system[action];
}

/**
 * Check if a user's limit allows a given value.
 * @param {object} user - User with `limits` property
 * @param {string} type - "maxTrips", "maxAmount", "dateRange", "allowedDrivers", "allowedTrips"
 * @param {*} value - The value to check
 * @returns {boolean}
 */
function checkUserLimit(user, type, value) {
  if (!user || !user.limits) return true;

  if (type === 'maxTrips') {
    const max = user.limits.maxTrips || 0;
    if (max === 0) return true;
    return value <= max;
  }
  if (type === 'maxAmount') {
    const max = user.limits.maxAmount || 0;
    if (max === 0) return true;
    return value <= max;
  }
  if (type === 'dateRange') {
    const date = value;
    if (user.limits.dateFrom && date < user.limits.dateFrom) return false;
    if (user.limits.dateTo && date > user.limits.dateTo) return false;
    return true;
  }
  if (type === 'allowedDrivers') {
    const driverId = value;
    if (!user.limits.allowedDrivers || user.limits.allowedDrivers.length === 0) return true;
    return user.limits.allowedDrivers.indexOf(driverId) !== -1;
  }
  if (type === 'allowedTrips') {
    const tripId = value;
    if (!user.limits.allowedTrips || user.limits.allowedTrips.length === 0) return true;
    return user.limits.allowedTrips.indexOf(tripId) !== -1;
  }
  return true;
}

/**
 * Check if a user (by role) is an admin.
 * @param {object} user
 * @returns {boolean}
 */
function isAdmin(user) {
  if (!user) return false;
  return user.role === 'super_admin' || user.role === 'company_admin';
}

/**
 * Check if a user is a super admin.
 * @param {object} user
 * @returns {boolean}
 */
function isSuperAdmin(user) {
  if (!user) return false;
  return user.role === 'super_admin';
}

/**
 * Check if user can access a specific driver, considering role and limits.
 * @param {object} user
 * @param {string} driverId
 * @returns {boolean}
 */
function checkUserAccessToDriver(user, driverId) {
  if (!user) return false;
  if (user.role === 'super_admin' || user.role === 'company_admin') return true;
  return checkUserLimit(user, 'allowedDrivers', driverId);
}

/**
 * Check if user can access a specific trip, considering role and limits.
 * @param {object} user
 * @param {string} tripId
 * @returns {boolean}
 */
function checkUserAccessToTrip(user, tripId) {
  if (!user) return false;
  if (user.role === 'super_admin' || user.role === 'company_admin') return true;
  return checkUserLimit(user, 'allowedTrips', tripId);
}

/**
 * Check if user can access a specific tab.
 * @param {object} user
 * @param {string} tabName
 * @returns {boolean}
 */
function canAccessTab(user, tabName) {
  if (!user) return false;
  if (user.role === 'super_admin' || user.role === 'company_admin') return true;
  if (tabName === 'settings' || tabName === 'users') return isAdmin(user);
  if (tabName === 'accounting' || tabName === 'financial') {
    return hasPermission(user, 'accounting.view');
  }
  return true;
}

/**
 * Get the display name for a role.
 * @param {string} roleId
 * @returns {string}
 */
function getRoleName(roleId) {
  const role = PERMISSIONS[roleId];
  return role ? role.name : roleId;
}

/**
 * Get the color for a role.
 * @param {string} roleId
 * @returns {string}
 */
function getRoleColor(roleId) {
  const role = PERMISSIONS[roleId];
  return role ? role.color : '#64748b';
}

/**
 * Get the icon for a role.
 * @param {string} roleId
 * @returns {string}
 */
function getRoleIcon(roleId) {
  const role = PERMISSIONS[roleId];
  return role ? role.icon : 'fa-user';
}

module.exports = {
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
};
