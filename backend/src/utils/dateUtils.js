/**
 * Utility functions for leave date calculation and validation
 */

/**
 * Calculates inclusive number of days between two YYYY-MM-DD dates
 * @param {string} startDateStr - 'YYYY-MM-DD'
 * @param {string} endDateStr - 'YYYY-MM-DD'
 * @returns {number}
 */
function calculateDays(startDateStr, endDateStr) {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);

  // Normalize time components to UTC midnight
  const utcStart = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const utcEnd = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());

  const msPerDay = 1000 * 60 * 60 * 24;
  const diffDays = Math.floor((utcEnd - utcStart) / msPerDay) + 1;

  return diffDays;
}

/**
 * Formats a Date object or date string to YYYY-MM-DD
 * @param {Date|string} date
 * @returns {string}
 */
function formatDate(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Validates if start date is not after end date
 * @param {string} startDate
 * @param {string} endDate
 * @returns {boolean}
 */
function isValidDateRange(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return !isNaN(start.getTime()) && !isNaN(end.getTime()) && start <= end;
}

module.exports = {
  calculateDays,
  formatDate,
  isValidDateRange
};
