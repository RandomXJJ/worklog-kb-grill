import { DateTime } from 'luxon';
/**
 * Get current date information
 */
export function getDateInfo() {
    const now = DateTime.now();
    const weekNum = String(now.weekNumber).padStart(2, '0');
    return {
        date: now.toFormat('yyyy-MM-dd'),
        week: `${now.year}-W${weekNum}`, // Full ISO week format (e.g., 2026-W19)
        month: now.toFormat('yyyy-MM'),
        year: now.toFormat('yyyy'),
        monthShort: now.toFormat('MM'),
    };
}
/**
 * Calculate week boundaries (Monday to Sunday)
 */
export function getWeekBoundaries(weekStr) {
    // Parse week string like "2026-W18"
    const match = weekStr.match(/^(\d{4})-W(\d{2})$/);
    if (!match) {
        throw new Error(`Invalid week format: ${weekStr}`);
    }
    const weekYear = parseInt(match[1], 10);
    const weekNum = parseInt(match[2], 10);
    // Get the Monday of this week using weekYear and weekNumber only
    const monday = DateTime.fromObject({ weekYear, weekNumber: weekNum });
    // Sunday is 6 days after Monday
    const sunday = monday.plus({ days: 6 });
    return {
        startDate: monday.toFormat('yyyy-MM-dd'),
        endDate: sunday.toFormat('yyyy-MM-dd'),
    };
}
/**
 * Get current week boundaries
 */
export function getCurrentWeekBoundaries() {
    const info = getDateInfo();
    const boundaries = getWeekBoundaries(info.week);
    return {
        week: info.week,
        ...boundaries,
    };
}
/**
 * Get month boundaries
 */
export function getMonthBoundaries(monthStr) {
    const match = monthStr.match(/^(\d{4})-(\d{2})$/);
    if (!match) {
        throw new Error(`Invalid month format: ${monthStr}`);
    }
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const start = DateTime.fromObject({ year, month, day: 1 });
    const end = start.endOf('month');
    return {
        startDate: start.toFormat('yyyy-MM-dd'),
        endDate: end.toFormat('yyyy-MM-dd'),
    };
}
/**
 * Format date for Chinese display
 */
export function formatChineseDate(dateStr) {
    const dt = DateTime.fromISO(dateStr);
    return dt.toFormat('yyyy年MM月dd日');
}
/**
 * Format week for Chinese display
 */
export function formatChineseWeek(weekStr) {
    const match = weekStr.match(/^(\d{4})-W(\d{2})$/);
    if (!match) {
        return weekStr;
    }
    return `${match[1]}年第${match[2]}周`;
}
/**
 * Check if a date string is today
 */
export function isToday(dateStr) {
    return dateStr === getDateInfo().date;
}
/**
 * Check if a date string is in current week
 */
export function isInCurrentWeek(dateStr) {
    const info = getDateInfo();
    const boundaries = getWeekBoundaries(info.week);
    const date = DateTime.fromISO(dateStr);
    const start = DateTime.fromISO(boundaries.startDate);
    const end = DateTime.fromISO(boundaries.endDate);
    return date >= start && date <= end;
}
/**
 * Check if a date string is in current month
 */
export function isInCurrentMonth(dateStr) {
    return dateStr.startsWith(getDateInfo().month);
}
//# sourceMappingURL=date.js.map