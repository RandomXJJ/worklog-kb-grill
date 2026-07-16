import type { WorkEntry, DailyFrontmatter } from '../types/index.js';
/**
 * Read daily log file and parse frontmatter
 */
export declare function readDailyLog(filePath: string): Promise<DailyFrontmatter | null>;
/**
 * Write daily log file with frontmatter
 */
export declare function writeDailyLog(filePath: string, frontmatter: DailyFrontmatter, bodyContent?: string): Promise<void>;
/**
 * Add entry to daily log
 */
export declare function addEntryToDaily(kbPath: string, entry: WorkEntry, bodyContent?: {
    work?: string;
    note?: string;
    details?: string;
    summary?: string;
} | null): Promise<{
    inboxPath: string;
    dailyPath: string;
}>;
/**
 * Update tags index
 */
export declare function updateTagsIndex(kbPath: string, entry: WorkEntry, date: string): Promise<void>;
/**
 * Get all entries from a daily file
 */
export declare function getEntriesFromFile(filePath: string): Promise<{
    date: string;
    week: string;
    month: string;
    entries: WorkEntry[];
} | null>;
/**
 * Get today's entries count
 */
export declare function getTodayEntriesCount(kbPath: string): Promise<number>;
/**
 * Get week entries count
 */
export declare function getWeekEntriesCount(kbPath: string, week: string): Promise<number>;
/**
 * Get month entries count
 */
export declare function getMonthEntriesCount(kbPath: string, month: string): Promise<number>;
/**
 * Format entry title with wikilink for Obsidian
 */
export declare function formatEntryWithWikilink(entry: WorkEntry): string;
/**
 * Extract wikilinks from entry title or details
 */
export declare function extractWikilinks(text: string): string[];
//# sourceMappingURL=storage.d.ts.map