import type { WeeklyReport, MonthlyReport } from '../types/index.js';
/**
 * Collect all entries for current week
 */
export declare function collectWeekEntries(kbPath: string, week?: string): Promise<WeeklyReport>;
/**
 * Generate Chinese weekly report (Markdown format)
 */
export declare function generateWeeklyReport(report: WeeklyReport): string;
/**
 * Generate Chinese weekly report (Plain text format)
 */
export declare function generateWeeklyReportTxt(report: WeeklyReport): string;
/**
 * Save weekly report to file
 */
export declare function saveWeeklyReport(kbPath: string, content: string, week: string, format?: 'md' | 'txt'): Promise<string>;
/**
 * Collect all entries for current month
 */
export declare function collectMonthEntries(kbPath: string, month?: string): Promise<MonthlyReport>;
/**
 * Generate Chinese monthly report (Markdown format)
 */
export declare function generateMonthlyReport(report: MonthlyReport): string;
/**
 * Generate Chinese monthly report (Plain text format)
 */
export declare function generateMonthlyReportTxt(report: MonthlyReport): string;
/**
 * Save monthly report to file
 */
export declare function saveMonthlyReport(kbPath: string, content: string, month: string, format?: 'md' | 'txt'): Promise<string>;
//# sourceMappingURL=report.d.ts.map