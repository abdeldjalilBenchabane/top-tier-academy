/**
 * Timezone utility functions for handling datetime conversions
 */

/**
 * Convert a datetime-local input value to UTC ISO string
 * @param {string} datetimeLocal - The datetime-local input value (e.g., "2024-01-15T02:30")
 * @returns {string} - UTC ISO string
 */
export const convertDatetimeLocalToUTC = (datetimeLocal) => {
  if (!datetimeLocal) return null;
  
  try {
    const localDate = new Date(datetimeLocal);
    
    if (isNaN(localDate.getTime())) {
      throw new Error('Invalid date format');
    }
    
    return localDate.toISOString();
  } catch (error) {
    console.error('Error converting datetime-local to UTC:', error);
    throw new Error('Invalid datetime format');
  }
};

/**
 * Convert a UTC ISO string to local datetime-local format
 * @param {string} utcISOString - The UTC ISO string
 * @returns {string} - datetime-local format string
 */
export const convertUTCToDatetimeLocal = (utcISOString) => {
  if (!utcISOString) return '';
  
  try {
    const date = new Date(utcISOString);
    
    if (isNaN(date.getTime())) {
      throw new Error('Invalid UTC date format');
    }
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch (error) {
    console.error('Error converting UTC to datetime-local:', error);
    throw new Error('Invalid UTC datetime format');
  }
};

/**
 * Format time for display in user's local timezone
 * @param {string} dateString - The date string (UTC ISO format)
 * @param {Object} options - Intl.DateTimeFormatOptions
 * @returns {string} - Formatted time string
 */
export const formatTimeForDisplay = (dateString, options = {}) => {
  if (!dateString) return 'Time not set';
  
  try {
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
      return 'Invalid time';
    }
    
    const defaultOptions = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      ...options
    };
    
    return date.toLocaleTimeString(undefined, defaultOptions);
  } catch (error) {
    console.error('Error formatting time:', error);
    return 'Invalid time';
  }
};

/**
 * Format date for display in user's local timezone
 * @param {string} dateString - The date string (UTC ISO format)
 * @param {Object} options - Intl.DateTimeFormatOptions
 * @returns {string} - Formatted date string
 */
export const formatDateForDisplay = (dateString, options = {}) => {
  if (!dateString) return 'Date not set';
  
  try {
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    
    const defaultOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...options
    };
    
    return date.toLocaleDateString(undefined, defaultOptions);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

/**
 * Get the current timezone offset in minutes
 * @returns {number} - Timezone offset in minutes
 */
export const getTimezoneOffset = () => {
  return new Date().getTimezoneOffset();
};

/**
 * Get the current timezone name
 * @returns {string} - Timezone name
 */
export const getCurrentTimezone = () => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};
