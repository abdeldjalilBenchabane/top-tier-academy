import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Parse a session timestamp as wall-clock time.
 *
 * The backend stores these in a `timestamp without time zone` column: the
 * digits ARE the local time the professor typed. They arrive serialised with a
 * trailing `Z` only because node-postgres reads them in the server's timezone,
 * not because they were ever UTC. Feeding that to `new Date()` shifts every
 * session by the viewer's offset — an hour, in Algeria.
 *
 * So the components are read and rebuilt in local time, which round-trips the
 * professor's 2:00 PM back to 2:00 PM everywhere.
 *
 * Use this for anything that comes out of live_sessions.start_time,
 * live_sections.scheduled_date and their relatives. A genuinely zoned value
 * (one carrying a real offset like +02:00) is passed through untouched.
 */
export function parseSessionDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;

  // A real offset means the sender knew what zone it meant — respect it.
  if (/[+-]\d{2}:\d{2}$/.test(value)) {
    const zoned = new Date(value);
    return isNaN(zoned.getTime()) ? null : zoned;
  }

  const m = value.match(
    /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/
  );
  if (m) {
    const [, y, mo, d, h, mi, sec] = m;
    return new Date(+y, +mo - 1, +d, +h, +mi, sec ? +sec : 0);
  }

  // Date-only, or a shape we do not recognise.
  const fallback = new Date(value);
  return isNaN(fallback.getTime()) ? null : fallback;
}

/**
 * Parse an audit timestamp — created_at, updated_at, requested_at and their
 * relatives — as the real instant it is.
 *
 * These columns are written by CURRENT_TIMESTAMP on a server running in UTC,
 * so the digits are UTC, not the local wall-clock. But they live in the same
 * `timestamp without time zone` type as a session's start_time, so the API
 * hands them over with no zone marker and `new Date()` reads them as local —
 * showing every comment an hour early in Algeria.
 *
 * This is the opposite of parseSessionDate, and the difference is not about
 * the column type but about who wrote the value: a professor typing "2:00 PM"
 * means 2 PM where they are, while CURRENT_TIMESTAMP means a moment in time.
 *
 * Values that already carry a zone (a trailing Z, or a real offset) are
 * passed through, so this is safe to use on endpoints that have since been
 * fixed to send proper ISO instants.
 */
export function parseServerInstant(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;

  const text = String(value).trim();
  if (!text) return null;

  // Already zoned: the sender said what it meant.
  const zoned = /[zZ]$|[+-]\d{2}:?\d{2}$/.test(text);
  const iso = zoned ? text : `${text.replace(' ', 'T')}Z`;

  const parsed = new Date(iso);
  if (!isNaN(parsed.getTime())) return parsed;

  const fallback = new Date(text);
  return isNaN(fallback.getTime()) ? null : fallback;
}

/**
 * Drop-in replacement for `new Date(value)` on an audit timestamp.
 *
 * Same contract as the constructor — it always hands back a Date, an invalid
 * one for unparseable input, exactly as `new Date(undefined)` would — so call
 * sites that go straight to .toLocaleString() need no other change.
 */
export function serverDate(value: string | Date | null | undefined): Date {
  return parseServerInstant(value) ?? new Date(NaN);
}

/**
 * Format an audit timestamp for reading, in the viewer's own timezone.
 */
export function formatServerDateTime(
  value: string | Date | null | undefined,
  options: Intl.DateTimeFormatOptions = { dateStyle: 'medium', timeStyle: 'short' },
  locale = 'ar-DZ'
): string {
  const d = parseServerInstant(value);
  if (!d) return '';
  try {
    return d.toLocaleString(locale, options);
  } catch {
    return d.toLocaleString();
  }
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
    const date = parseSessionDate(dateString);
    if (!date) return 'Invalid time';
    
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
    const date = parseSessionDate(dateString);
    if (!date) return 'Invalid date';
    
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
