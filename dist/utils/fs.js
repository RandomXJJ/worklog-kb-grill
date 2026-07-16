import fs from 'fs/promises';
import path from 'path';
import { DateTime } from 'luxon';
/**
 * Ensure directory exists, create if not
 */
export async function ensureDir(dirPath) {
    try {
        await fs.mkdir(dirPath, { recursive: true });
    }
    catch (error) {
        // Directory already exists or other error
        if (error.code !== 'EEXIST') {
            throw error;
        }
    }
}
/**
 * Check if file exists
 */
export async function fileExists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    }
    catch {
        return false;
    }
}
/**
 * Check if directory exists
 */
export async function dirExists(dirPath) {
    try {
        await fs.access(dirPath);
        const stat = await fs.stat(dirPath);
        return stat.isDirectory();
    }
    catch {
        return false;
    }
}
/**
 * Read file content safely
 */
export async function readFileSafe(filePath) {
    try {
        return await fs.readFile(filePath, 'utf-8');
    }
    catch {
        return null;
    }
}
/**
 * Get kb directory structure paths
 */
export function getKbPaths(kbRoot) {
    return {
        inbox: path.join(kbRoot, 'inbox'),
        daily: path.join(kbRoot, 'daily'),
        weekly: path.join(kbRoot, 'weekly'),
        monthly: path.join(kbRoot, 'monthly'),
        tags: path.join(kbRoot, 'tags'),
        templates: path.join(kbRoot, 'templates'),
        resources: path.join(kbRoot, 'resources'),
        projects: path.join(kbRoot, 'projects'),
    };
}
/**
 * Get daily log file path
 */
export function getDailyFilePath(kbRoot, dateStr) {
    const dt = DateTime.fromISO(dateStr);
    const year = dt.toFormat('yyyy');
    const month = dt.toFormat('MM');
    return path.join(kbRoot, 'daily', year, month, `${dateStr}.md`);
}
/**
 * Get inbox file path
 */
export function getInboxFilePath(kbRoot, dateStr) {
    return path.join(kbRoot, 'inbox', `${dateStr}.md`);
}
/**
 * Get weekly report file path
 */
export function getWeeklyFilePath(kbRoot, weekStr) {
    return path.join(kbRoot, 'weekly', `${weekStr}.md`);
}
/**
 * Get weekly report file path with format
 */
export function getWeeklyFilePathWithFormat(kbRoot, weekStr, format) {
    return path.join(kbRoot, 'weekly', `${weekStr}.${format}`);
}
/**
 * Get monthly report file path
 */
export function getMonthlyFilePath(kbRoot, monthStr) {
    return path.join(kbRoot, 'monthly', `${monthStr}.md`);
}
/**
 * Get monthly report file path with format
 */
export function getMonthlyFilePathWithFormat(kbRoot, monthStr, format) {
    return path.join(kbRoot, 'monthly', `${monthStr}.${format}`);
}
/**
 * Get tags index file path
 */
export function getTagsIndexPath(kbRoot) {
    return path.join(kbRoot, 'tags', 'index.md');
}
/**
 * Scan all daily files
 */
export async function scanDailyFiles(kbRoot) {
    const dailyRoot = path.join(kbRoot, 'daily');
    if (!await dirExists(dailyRoot)) {
        return [];
    }
    const files = [];
    // Recursively find all .md files
    async function scanDir(dir) {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                await scanDir(fullPath);
            }
            else if (entry.isFile() && entry.name.endsWith('.md')) {
                files.push(fullPath);
            }
        }
    }
    await scanDir(dailyRoot);
    return files.sort();
}
/**
 * Get default kb path (current directory or home)
 */
export function getDefaultKbPath() {
    return path.join(process.cwd(), 'kb');
}
/**
 * Get alternative default kb path (home directory)
 */
export function getHomeKbPath() {
    return path.join(process.env.HOME || '~', 'worklog', 'kb');
}
//# sourceMappingURL=fs.js.map