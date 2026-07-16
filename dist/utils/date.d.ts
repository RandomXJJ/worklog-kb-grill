/**
 * Get current date information
 */
export declare function getDateInfo(): {
    date: string;
    week: string;
    month: string;
    year: string;
    monthShort: string;
};
/**
 * Calculate week boundaries (Monday to Sunday)
 */
export declare function getWeekBoundaries(weekStr: string): {
    startDate: string;
    endDate: string;
};
/**
 * Get current week boundaries
 */
export declare function getCurrentWeekBoundaries(): {
    week: string;
    startDate: string;
    endDate: string;
};
/**
 * Get month boundaries
 */
export declare function getMonthBoundaries(monthStr: string): {
    startDate: string;
    endDate: string;
};
/**
 * Format date for Chinese display
 */
export declare function formatChineseDate(dateStr: string): string;
/**
 * Format week for Chinese display
 */
export declare function formatChineseWeek(weekStr: string): string;
/**
 * Check if a date string is today
 */
export declare function isToday(dateStr: string): boolean;
/**
 * Check if a date string is in current week
 */
export declare function isInCurrentWeek(dateStr: string): boolean;
/**
 * Check if a date string is in current month
 */
export declare function isInCurrentMonth(dateStr: string): boolean;
//# sourceMappingURL=date.d.ts.map