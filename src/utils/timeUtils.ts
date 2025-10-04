// src/utils/timeUtils.ts

/**
 * Utility functions to convert UTC timestamps from backend to local timezone
 */

/**
 * Format UTC date string to local date
 * @param dateString - Date in "YYYY-MM-DD" format (UTC)
 * @returns Formatted local date like "04 Oct 2024"
 */
export const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'N/A';
  
  try {
    // Add 'Z' to indicate UTC if not present
    const dateStr = dateString.includes('Z') ? dateString : dateString + 'Z';
    const date = new Date(dateStr);
    
    return new Intl.DateTimeFormat('en-IN', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    }).format(date);
  } catch (e) {
    console.error('Error formatting date:', e);
    return dateString;
  }
};

/**
 * Format UTC time string to local time
 * @param timeString - Time in "HH:MM:SS" or "HH:MM:SS.nnnnnnnnn" format (UTC)
 * @returns Formatted local time like "2:30 PM"
 */
export const formatTime = (timeString: string | null | undefined): string => {
  if (!timeString) return 'N/A';
  
  try {
    // Parse time components
    const [hoursStr, minutesStr, secondsStr] = timeString.split(':');
    const hours = parseInt(hoursStr);
    const minutes = parseInt(minutesStr);
    const seconds = secondsStr ? parseInt(secondsStr.split('.')[0]) : 0;
    
    // Create UTC date for today with that time
    const now = new Date();
    const utcDate = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      hours,
      minutes,
      seconds
    ));
    
    return new Intl.DateTimeFormat('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    }).format(utcDate);
  } catch (e) {
    console.error('Error formatting time:', e);
    return timeString;
  }
};

/**
 * Format UTC datetime (ISO format) to local datetime
 * @param datetimeString - ISO datetime string (UTC)
 * @returns Formatted local datetime like "04 Oct 2024, 2:30 PM"
 */
export const formatDateTime = (datetimeString: string | null | undefined): string => {
  if (!datetimeString) return 'N/A';
  
  try {
    const date = new Date(datetimeString);
    
    return new Intl.DateTimeFormat('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    }).format(date);
  } catch (e) {
    console.error('Error formatting datetime:', e);
    return datetimeString;
  }
};

/**
 * Get current local date in UTC format for API
 * @returns Date string in "YYYY-MM-DD" format (UTC)
 */
export const getCurrentDateUTC = (): string => {
  const now = new Date();
  return now.toISOString().split('T')[0];
};

/**
 * Get current local time in UTC format for API
 * @returns Time string in "HH:MM:SS.nnnnnnnnn" format (UTC)
 */
export const getCurrentTimeUTC = (): string => {
  const now = new Date();
  const hours = now.getUTCHours().toString().padStart(2, '0');
  const minutes = now.getUTCMinutes().toString().padStart(2, '0');
  const seconds = now.getUTCSeconds().toString().padStart(2, '0');
  const milliseconds = now.getUTCMilliseconds().toString().padStart(3, '0');
  
  return `${hours}:${minutes}:${seconds}.${milliseconds}000000`;
};

/**
 * Format currency amount
 * @param amount - Number to format as currency
 * @returns Formatted currency string like "₹50,000"
 */
export const formatCurrency = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined) return 'N/A';
  
  return new Intl.NumberFormat('en-IN', { 
    style: 'currency', 
    currency: 'INR', 
    maximumFractionDigits: 0 
  }).format(amount);
};