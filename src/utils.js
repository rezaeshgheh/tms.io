/**
 * Utility functions for the TMS application.
 * Extracted from the monolithic index.html for testability.
 */

/**
 * Removes all non-digit characters and formats with thousand separators.
 * @param {string} value - Raw input value
 * @returns {string} Formatted number string
 */
function formatNumber(value) {
  const cleaned = String(value).replace(/[^0-9]/g, '');
  if (!cleaned) return '';
  return Number(cleaned).toLocaleString('en-US');
}

/**
 * Parses a formatted number string back to a plain number.
 * @param {string} s - Formatted number string (e.g. "1,234,567")
 * @returns {number}
 */
function parseFormattedNumber(s) {
  if (!s) return 0;
  return parseInt(String(s).replace(/,/g, ''), 10) || 0;
}

/**
 * Escapes HTML special characters to prevent XSS.
 * @param {string} s - Raw string
 * @returns {string} Escaped string
 */
function escapeHtml(s) {
  if (!s) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Simple DJB2 hash for passwords.
 * NOTE: This is NOT cryptographically secure. Use bcrypt/argon2 in production.
 * @param {string} password
 * @returns {string} Hashed password prefixed with "hash_"
 */
function hashPassword(password) {
  let hash = 5381;
  for (let i = 0; i < password.length; i++) {
    hash = ((hash << 5) + hash) + password.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }
  return 'hash_' + Math.abs(hash).toString(36);
}

/**
 * Verifies a password against a stored hash.
 * @param {string} password - Plain text password
 * @param {string} stored - Stored hash or plain text
 * @returns {boolean}
 */
function verifyPassword(password, stored) {
  if (!stored) return false;
  if (stored.startsWith('hash_')) {
    return hashPassword(password) === stored;
  }
  return password === stored;
}

/**
 * Generates a unique ID with a given prefix.
 * @param {string} prefix
 * @returns {string}
 */
function generateId(prefix) {
  return prefix + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Generates the next trip code based on existing trips.
 * @param {Array} trips - Array of trip objects with `code` property
 * @returns {string} Next trip code like "TRIP-1001"
 */
function generateTripCode(trips) {
  let maxCode = 1000;
  if (trips && trips.length > 0) {
    trips.forEach(function (t) {
      if (t.code) {
        const num = parseInt(t.code.replace('TRIP-', ''));
        if (!isNaN(num) && num > maxCode) maxCode = num;
      }
    });
  }
  return 'TRIP-' + (maxCode + 1);
}

/**
 * Generates the next voucher number based on accounting data.
 * @param {object} accountingData - Accounting data with voucherCounter
 * @returns {{ number: string, counter: number }}
 */
function generateVoucherNumber(accountingData) {
  if (!accountingData) return { number: 'VCH-0001', counter: 1 };
  const counter = (accountingData.voucherCounter || 0) + 1;
  const padded = String(counter).padStart(4, '0');
  return { number: 'VCH-' + padded, counter: counter };
}

/**
 * Converts a Gregorian date string to Jalali (Shamsi) format.
 * This is a simplified version; the actual app uses moment-jalaali.
 * @param {string} dateString - ISO date string
 * @returns {string} Jalali date or original string
 */
function toJalaliDate(dateString) {
  if (!dateString) return '-';
  // Validate the date string
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return dateString; // Actual conversion requires moment-jalaali library
}

module.exports = {
  formatNumber,
  parseFormattedNumber,
  escapeHtml,
  hashPassword,
  verifyPassword,
  generateId,
  generateTripCode,
  generateVoucherNumber,
  toJalaliDate,
};
