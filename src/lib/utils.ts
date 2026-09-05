import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a date/time for display, handling timezone conversion properly
 * @param dateString - The date string (can be UTC or local)
 * @param options - Formatting options
 * @returns Formatted date string
 */
export function formatTimeForDisplay(
  dateString: string | null | undefined,
  options: Intl.DateTimeFormatOptions = {}
): string {
  if (!dateString) return 'Time not set';
  
  try {
    const date = new Date(dateString);
    
    // Default options for time display
    const defaultOptions: Intl.DateTimeFormatOptions = {
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
}

/**
 * Format a date for display
 * @param dateString - The date string
 * @param options - Formatting options
 * @returns Formatted date string
 */
export function formatDateForDisplay(
  dateString: string | null | undefined,
  options: Intl.DateTimeFormatOptions = {}
): string {
  if (!dateString) return 'Date not set';
  
  try {
    const date = new Date(dateString);
    
    // Default options for date display
    const defaultOptions: Intl.DateTimeFormatOptions = {
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
}
