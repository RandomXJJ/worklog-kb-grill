import { execSync } from 'child_process';
import path from 'path';
/**
 * Check if current directory is a git repository
 */
export function isGitRepository(dir = process.cwd()) {
    try {
        execSync('git rev-parse --is-inside-work-tree', { cwd: dir, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
        return true;
    }
    catch {
        return false;
    }
}
/**
 * Get today's git commits
 */
export function getTodayCommits(dir = process.cwd()) {
    if (!isGitRepository(dir)) {
        return [];
    }
    try {
        // Get commits since midnight
        const output = execSync('git log --since="midnight" --pretty=format:"%h|%s|%ad|%an" --date=short --no-merges', { cwd: dir, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
        if (!output.trim()) {
            return [];
        }
        return output.trim().split('\n').map(line => {
            const [hash, message, date, author] = line.split('|');
            return {
                hash: hash || '',
                message: message || '',
                date: date || '',
                author: author || '',
            };
        });
    }
    catch {
        return [];
    }
}
/**
 * Get git commits for a specific date range
 */
export function getCommitsInRange(startDate, endDate, dir = process.cwd()) {
    if (!isGitRepository(dir)) {
        return [];
    }
    try {
        const output = execSync(`git log --since="${startDate}" --until="${endDate} 23:59:59" --pretty=format:"%h|%s|%ad|%an" --date=short --no-merges`, { cwd: dir, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
        if (!output.trim()) {
            return [];
        }
        return output.trim().split('\n').map(line => {
            const [hash, message, date, author] = line.split('|');
            return {
                hash: hash || '',
                message: message || '',
                date: date || '',
                author: author || '',
            };
        });
    }
    catch {
        return [];
    }
}
/**
 * Infer project name from directory path
 */
export function inferProjectName(dir = process.cwd()) {
    // Get the directory name
    const dirName = path.basename(dir);
    // Clean up common patterns
    let projectName = dirName
        .replace(/^api-/, '')
        .replace(/^web-/, '')
        .replace(/^app-/, '')
        .replace(/^backend-/, '')
        .replace(/^frontend-/, '')
        .replace(/-service$/, '')
        .replace(/-api$/, '')
        .replace(/-web$/, '')
        .replace(/-app$/, '');
    return projectName || dirName;
}
/**
 * Get the remote repository URL
 */
export function getRemoteUrl(dir = process.cwd()) {
    if (!isGitRepository(dir)) {
        return null;
    }
    try {
        const output = execSync('git remote get-url origin', { cwd: dir, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
        return output.trim();
    }
    catch {
        return null;
    }
}
/**
 * Get current branch name
 */
export function getCurrentBranch(dir = process.cwd()) {
    if (!isGitRepository(dir)) {
        return null;
    }
    try {
        const output = execSync('git branch --show-current', { cwd: dir, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
        return output.trim();
    }
    catch {
        return null;
    }
}
/**
 * Format commit message for display
 */
export function formatCommitMessage(commit) {
    return `${commit.hash.substring(0, 7)} ${commit.message}`;
}
/**
 * Extract core content from commit message (remove hash, keep description)
 */
export function extractCommitContent(message) {
    // Remove common prefixes like "feat:", "fix:", "refactor:", etc.
    let content = message
        .replace(/^(feat|fix|refactor|docs|test|chore|perf|style|build|ci|revert):\s*/i, '')
        .trim();
    return content;
}
//# sourceMappingURL=git.js.map