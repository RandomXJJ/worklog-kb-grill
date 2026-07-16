/**
 * Work entry types matching the original skill categorization
 */
export type EntryType = 'dev' | 'release' | 'review' | 'design' | 'bugfix' | 'datafix' | 'interview' | 'learn' | 'meeting' | 'other';
/**
 * Work entry structure matching frontmatter format
 */
export interface WorkEntry {
    type: EntryType;
    title: string;
    details: string;
    tags: string[];
    projectName?: string;
}
/**
 * Daily log file frontmatter
 */
export interface DailyFrontmatter {
    date: string;
    week: string;
    month: string;
    entries: WorkEntry[];
}
/**
 * Configuration stored in ~/.worklog/
 */
export interface WorklogConfig {
    kbPath: string;
    llmProvider: 'openai' | 'anthropic' | 'gemini' | 'deepseek' | 'ollama' | 'none';
    apiKey?: string;
    defaultMode: 'rule-based' | 'llm';
    createdAt: string;
    updatedAt: string;
}
/**
 * LLM provider configuration
 */
export interface LLMProviderConfig {
    name: string;
    apiKeyEnv?: string;
    defaultModel: string;
    endpoint?: string;
}
/**
 * Classification result from LLM or rule-based
 */
export interface ClassificationResult {
    type: EntryType;
    title: string;
    details: string;
    suggestedTags?: string[];
    projectName?: string;
}
/**
 * Weekly report structure
 */
export interface WeeklyReport {
    weekNumber: string;
    startDate: string;
    endDate: string;
    entries: Array<{
        entry: WorkEntry;
        sourceDate: string;
    }>;
}
/**
 * Monthly report structure
 */
export interface MonthlyReport {
    month: string;
    entries: Array<{
        entry: WorkEntry;
        sourceDate: string;
    }>;
}
/**
 * CLI command options
 */
export interface LogOptions {
    ai?: boolean;
    tags?: string;
    type?: EntryType;
}
export interface InitOptions {
    path?: string;
    provider?: string;
    skipPrompts?: boolean;
}
export interface ConfigOptions {
    path?: string;
    provider?: string;
    key?: string;
    show?: boolean;
}
/**
 * Status information
 */
export interface StatusInfo {
    kbPath: string;
    kbExists: boolean;
    todayEntries: number;
    weekEntries: number;
    monthEntries: number;
    llmProvider: string;
    defaultMode: string;
}
//# sourceMappingURL=index.d.ts.map