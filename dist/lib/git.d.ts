/**
 * Git commit info
 */
export interface GitCommit {
    hash: string;
    message: string;
    date: string;
    author: string;
}
/**
 * Check if current directory is a git repository
 */
export declare function isGitRepository(dir?: string): boolean;
/**
 * Get today's git commits
 */
export declare function getTodayCommits(dir?: string): GitCommit[];
/**
 * Get git commits for a specific date range
 */
export declare function getCommitsInRange(startDate: string, endDate: string, dir?: string): GitCommit[];
/**
 * Infer project name from directory path
 */
export declare function inferProjectName(dir?: string): string;
/**
 * Get the remote repository URL
 */
export declare function getRemoteUrl(dir?: string): string | null;
/**
 * Get current branch name
 */
export declare function getCurrentBranch(dir?: string): string | null;
/**
 * Format commit message for display
 */
export declare function formatCommitMessage(commit: GitCommit): string;
/**
 * Extract core content from commit message (remove hash, keep description)
 */
export declare function extractCommitContent(message: string): string;
//# sourceMappingURL=git.d.ts.map