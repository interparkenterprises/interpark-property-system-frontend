/**
 * Format a date to a consistent local date string regardless of timezone
 * @param dateString - ISO date string or Date object
 * @returns Formatted date string in local timezone
 */
export const formatLocalDate = (dateString: string | Date | null | undefined): string => {
  if (!dateString) return 'N/A';
  
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  
  // Extract UTC components to avoid timezone shifts
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();
  
  // Create date using UTC components to preserve the original date
  const localDate = new Date(Date.UTC(year, month, day));
  
  return localDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC' // Force UTC to prevent shifting
  });
};

/**
 * Format date with ordinal suffix (1st, 2nd, 3rd, 4th)
 * @param dateString - ISO date string or Date object
 * @returns Formatted date with ordinal (e.g., "13th April 2026")
 */
export const formatDateToOrdinal = (dateString: string | Date | null | undefined): string => {
  if (!dateString) return 'N/A';
  
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  
  // Use UTC components to avoid timezone issues
  const day = date.getUTCDate();
  const month = date.toLocaleString('default', { month: 'long', timeZone: 'UTC' });
  const year = date.getUTCFullYear();
  
  const getOrdinalSuffix = (day: number): string => {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };
  
  const ordinalSuffix = getOrdinalSuffix(day);
  
  return `${day}${ordinalSuffix} ${month} ${year}`;
};

/**
 * Calculate days remaining until a due date (using UTC to avoid timezone issues)
 * @param dueDate - ISO date string
 * @returns Number of days remaining
 */
export const getDaysRemaining = (dueDate: string): number => {
  const due = new Date(dueDate);
  const now = new Date();
  
  // Reset to UTC midnight for accurate day comparison
  const dueUTC = Date.UTC(due.getUTCFullYear(), due.getUTCMonth(), due.getUTCDate());
  const nowUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  
  const diffTime = dueUTC - nowUTC;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};