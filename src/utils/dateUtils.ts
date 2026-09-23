/**
 * Utility functions for date formatting in Show Card Studio
 */

/**
 * Removes time/hours from date strings (e.g. '15/11/2026 • 21:00' -> '15/11/2026')
 * leaving strictly the event date.
 */
export function cleanDateOnly(dateStr?: string): string {
  if (!dateStr) return '';
  // Split on bullet or hyphen or " às "
  let cleaned = dateStr.split('•')[0].trim();
  cleaned = cleaned.split(/\s+às\s+|\s+as\s+/i)[0].trim();
  cleaned = cleaned.split(/\s+-\s+\d{1,2}:\d{2}/)[0].trim();
  // Strip trailing time e.g. " 21:00", " 21h00", " 21h"
  cleaned = cleaned.replace(/\s+\d{1,2}:\d{2}(:\d{2})?.*$/, '').trim();
  cleaned = cleaned.replace(/\s+\d{1,2}h(\d{2})?.*$/i, '').trim();
  return cleaned || dateStr;
}
