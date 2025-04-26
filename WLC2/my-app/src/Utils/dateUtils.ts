import { format, formatDistance, isToday, isYesterday, addDays } from 'date-fns';

/**
 * Format a date to a standard date string
 * @param date The date to format
 * @param formatString The format string to use
 * @returns The formatted date string
 */
export const formatDate = (date: Date | string | number, formatString: string = 'MMM d, yyyy'): string => {
  try {
    const dateObj = typeof date === 'string' || typeof date === 'number' 
      ? new Date(date) 
      : date;
    return format(dateObj, formatString);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

/**
 * Format a time to a standard time string
 * @param date The date to format
 * @param formatString The format string to use
 * @returns The formatted time string
 */
export const formatTime = (date: Date | string | number, formatString: string = 'h:mm a'): string => {
  try {
    const dateObj = typeof date === 'string' || typeof date === 'number' 
      ? new Date(date) 
      : date;
    return format(dateObj, formatString);
  } catch (error) {
    console.error('Error formatting time:', error);
    return 'Invalid time';
  }
};

/**
 * Format a datetime to a standard datetime string
 * @param date The date to format
 * @param formatString The format string to use
 * @returns The formatted datetime string
 */
export const formatDateTime = (date: Date | string | number, formatString: string = 'MMM d, yyyy h:mm a'): string => {
  try {
    const dateObj = typeof date === 'string' || typeof date === 'number' 
      ? new Date(date) 
      : date;
    return format(dateObj, formatString);
  } catch (error) {
    console.error('Error formatting datetime:', error);
    return 'Invalid datetime';
  }
};

/**
 * Format a date relative to current date (e.g., "Today", "Yesterday", "2 days ago")
 * @param date The date to format
 * @returns The relative date string
 */
export const formatRelativeDate = (date: Date | string | number): string => {
  try {
    const dateObj = typeof date === 'string' || typeof date === 'number' 
      ? new Date(date) 
      : date;
    
    if (isToday(dateObj)) {
      return `Today at ${format(dateObj, 'h:mm a')}`;
    }
    
    if (isYesterday(dateObj)) {
      return `Yesterday at ${format(dateObj, 'h:mm a')}`;
    }
    
    // Check if within last 7 days
    const sevenDaysAgo = addDays(new Date(), -7);
    if (dateObj >= sevenDaysAgo) {
      return `${format(dateObj, 'EEEE')} at ${format(dateObj, 'h:mm a')}`;
    }
    
    // Default format for older dates
    return format(dateObj, 'MMM d, yyyy h:mm a');
  } catch (error) {
    console.error('Error formatting relative date:', error);
    return 'Invalid date';
  }
};

/**
 * Get a human-readable time distance (e.g., "2 hours ago", "5 minutes ago")
 * @param date The date to get the distance from
 * @param baseDate The base date to compare against (defaults to now)
 * @returns The time distance string
 */
export const getTimeAgo = (date: Date | string | number, baseDate: Date = new Date()): string => {
  try {
    const dateObj = typeof date === 'string' || typeof date === 'number' 
      ? new Date(date) 
      : date;
    return formatDistance(dateObj, baseDate, { addSuffix: true });
  } catch (error) {
    console.error('Error calculating time distance:', error);
    return 'Unknown time ago';
  }
};

/**
 * Get start and end dates for various time periods
 * @param period The time period to get dates for
 * @returns An object with start and end dates
 */
export const getDateRange = (period: 'today' | 'week' | 'month' | 'year' | 'custom' = 'today', customRange?: { start: Date, end: Date }): { start: Date, end: Date } => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (period) {
    case 'today':
      return {
        start: today,
        end: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999)
      };
    case 'week': {
      const dayOfWeek = now.getDay();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - dayOfWeek);
      startOfWeek.setHours(0, 0, 0, 0);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
      
      return { start: startOfWeek, end: endOfWeek };
    }
    case 'month': {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      return { start: startOfMonth, end: endOfMonth };
    }
    case 'year': {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      return { start: startOfYear, end: endOfYear };
    }
    case 'custom':
      if (!customRange) {
        throw new Error('Custom date range requires start and end dates');
      }
      return customRange;
    default:
      return { start: today, end: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999) };
  }
}; 