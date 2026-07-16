/**
 * Ensure directory exists, create if not
 */
export declare function ensureDir(dirPath: string): Promise<void>;
/**
 * Check if file exists
 */
export declare function fileExists(filePath: string): Promise<boolean>;
/**
 * Check if directory exists
 */
export declare function dirExists(dirPath: string): Promise<boolean>;
/**
 * Read file content safely
 */
export declare function readFileSafe(filePath: string): Promise<string | null>;
/**
 * Get kb directory structure paths
 */
export declare function getKbPaths(kbRoot: string): {
    inbox: string;
    daily: string;
    weekly: string;
    monthly: string;
    tags: string;
    templates: string;
    resources: string;
    projects: string;
};
/**
 * Get daily log file path
 */
export declare function getDailyFilePath(kbRoot: string, dateStr: string): string;
/**
 * Get inbox file path
 */
export declare function getInboxFilePath(kbRoot: string, dateStr: string): string;
/**
 * Get weekly report file path
 */
export declare function getWeeklyFilePath(kbRoot: string, weekStr: string): string;
/**
 * Get weekly report file path with format
 */
export declare function getWeeklyFilePathWithFormat(kbRoot: string, weekStr: string, format: 'md' | 'txt'): string;
/**
 * Get monthly report file path
 */
export declare function getMonthlyFilePath(kbRoot: string, monthStr: string): string;
/**
 * Get monthly report file path with format
 */
export declare function getMonthlyFilePathWithFormat(kbRoot: string, monthStr: string, format: 'md' | 'txt'): string;
/**
 * Get tags index file path
 */
export declare function getTagsIndexPath(kbRoot: string): string;
/**
 * Scan all daily files
 */
export declare function scanDailyFiles(kbRoot: string): Promise<string[]>;
/**
 * Get default kb path (current directory or home)
 */
export declare function getDefaultKbPath(): string;
/**
 * Get alternative default kb path (home directory)
 */
export declare function getHomeKbPath(): string;
//# sourceMappingURL=fs.d.ts.map