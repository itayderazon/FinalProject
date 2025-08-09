// Date formatting and manipulation utilities
const { TIME_CONSTANTS } = require('../constants/nutrition');

class DateUtils {
  /**
   * Get current date in YYYY-MM-DD format
   * @returns {string} Current date string
   */
  static getCurrentDateString() {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Format date to YYYY-MM-DD string
   * @param {Date|string} date - Date to format
   * @returns {string} Formatted date string
   */
  static formatDateString(date) {
    if (!date) return this.getCurrentDateString();
    return new Date(date).toISOString().split('T')[0];
  }

  /**
   * Get date N days ago
   * @param {number} daysAgo - Number of days ago
   * @returns {string} Date string in YYYY-MM-DD format
   */
  static getDateDaysAgo(daysAgo) {
    const date = new Date(Date.now() - daysAgo * TIME_CONSTANTS.MILLISECONDS_PER_DAY);
    return date.toISOString().split('T')[0];
  }

  /**
   * Get week key for date (YYYY-WXX format)
   * @param {Date|string} date - Date to get week key for
   * @returns {string} Week key
   */
  static getWeekKey(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const week = Math.ceil((d.getDate() + new Date(year, d.getMonth(), 1).getDay()) / 7);
    return `${year}-W${week.toString().padStart(2, '0')}`;
  }

  /**
   * Check if date string is valid
   * @param {string} dateString - Date string to validate
   * @returns {boolean} True if valid
   */
  static isValidDateString(dateString) {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
  }

  /**
   * Get date range for period
   * @param {number} periodDays - Number of days in period
   * @returns {Object} Object with startDate and endDate
   */
  static getDateRangeForPeriod(periodDays) {
    const endDate = this.getCurrentDateString();
    const startDate = this.getDateDaysAgo(periodDays);
    return { startDate, endDate };
  }
}

module.exports = DateUtils;