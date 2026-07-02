/**
 * Document management logic for CMR, TIR, and Dozblagh documents.
 * Extracted from the monolithic index.html for testability.
 */

/**
 * Checks if a document number is a duplicate.
 * @param {object} appData - App data with cmrs, tirs, dozblaghs arrays
 * @param {string} type - "cmr", "tir", or "dozblagh"
 * @param {string} number - Document number to check
 * @param {string} [excludeId] - ID to exclude from check (for editing)
 * @returns {boolean} True if duplicate found
 */
function isDocumentNumberDuplicate(appData, type, number, excludeId) {
  if (!appData || !number) return false;
  const num = number.trim().toLowerCase();
  if (!num) return false;

  let collection;
  if (type === 'cmr') collection = appData.cmrs;
  else if (type === 'tir') collection = appData.tirs;
  else if (type === 'dozblagh') collection = appData.dozblaghs;
  else return false;

  if (!collection) return false;

  return collection.some(function (doc) {
    if (excludeId && doc.id === excludeId) return false;
    return doc.number && doc.number.trim().toLowerCase() === num;
  });
}

/**
 * Gets the status of a document in the context of a specific trip for cost assignment.
 * @param {object} doc - Document object with optional transferHistory
 * @param {string} currentTripCode - Current trip code
 * @param {string} currentTripId - Current trip ID
 * @returns {object} Status object with status, label, canEditPrice, etc.
 */
function getDocumentStatusInCurrentTripForCost(doc, currentTripCode, currentTripId) {
  if (!doc.transferHistory || doc.transferHistory.length === 0) {
    return {
      status: 'original',
      label: 'جدید (اصلی)',
      icon: '🟢',
      canEditPrice: true,
      message: 'سند جدید - قابل قیمت‌گذاری',
      showHistoryButton: false,
    };
  }

  const relevantTransfer = doc.transferHistory.find(function (th) {
    return th.toTripCode === currentTripCode || th.fromTripCode === currentTripCode;
  });

  if (relevantTransfer) {
    if (relevantTransfer.fromTripCode === currentTripCode) {
      return {
        status: 'outgoing',
        label: 'منتقل شده به سفر بعدی',
        icon: '🟡',
        canEditPrice: true,
        message: 'این سند به سفر دیگر منتقل شده است اما همچنان قابل قیمت‌گذاری است.',
        showHistoryButton: true,
      };
    }
    if (relevantTransfer.toTripCode === currentTripCode) {
      return {
        status: 'incoming',
        label: 'وارد شده از سفر قبل',
        icon: '🔴',
        canEditPrice: false,
        message: 'این سند از سفر قبلی وارد شده است و هزینه آن قبلاً محاسبه شده است.',
        showHistoryButton: true,
      };
    }
  }

  return {
    status: 'original',
    label: 'جدید (اصلی)',
    icon: '🟢',
    canEditPrice: true,
    message: 'سند جدید - قابل قیمت‌گذاری',
    showHistoryButton: false,
  };
}

/**
 * Gets the display representation for dozblagh types.
 * @param {string} typeStr - Comma-separated type string (e.g. "transit,bilateral")
 * @returns {string} Display string with Persian labels
 */
function getDozTypesDisplay(typeStr) {
  if (!typeStr) return '';
  const typeLabels = {
    transit: 'ترانزیت',
    bilateral: 'دوجانبه',
    third: 'کشور ثالث',
  };
  const types = typeStr.split(',').map(function (t) { return t.trim(); });
  return types.map(function (t) {
    return typeLabels[t] || t;
  }).join(' + ');
}

/**
 * Finds a driver by ID in app data.
 * @param {object} appData
 * @param {string} id
 * @returns {object|undefined}
 */
function getDriverById(appData, id) {
  if (!appData || !appData.drivers) return undefined;
  return appData.drivers.find(function (d) { return d.id === id; });
}

/**
 * Gets the name of a driver by ID.
 * @param {object} appData
 * @param {string} id
 * @returns {string}
 */
function getDriverName(appData, id) {
  if (!appData || !appData.drivers) return 'نامشخص';
  const d = appData.drivers.find(function (d) { return d.id === id; });
  return d ? d.name : 'نامشخص';
}

/**
 * Gets a document's full transfer chain for display.
 * @param {object} doc - Document with transferHistory
 * @param {string} type - Document type
 * @param {string} currentTripId - Current trip context
 * @returns {Array} Array of transfer chain entries
 */
function getDocumentTransferChain(doc, type, currentTripId) {
  if (!doc || !doc.transferHistory || doc.transferHistory.length === 0) return [];

  return doc.transferHistory.map(function (th) {
    const isOutgoing = th.fromTripId === currentTripId;
    return {
      date: th.date,
      fromTripCode: th.fromTripCode,
      toTripCode: th.toTripCode,
      isOutgoing: isOutgoing,
      direction: isOutgoing ? 'outgoing' : 'incoming',
    };
  });
}

module.exports = {
  isDocumentNumberDuplicate,
  getDocumentStatusInCurrentTripForCost,
  getDozTypesDisplay,
  getDriverById,
  getDriverName,
  getDocumentTransferChain,
};
