import type { EntryType, ClassificationResult, WorklogConfig } from '../types/index.js';
/**
 * Rule-based classifier (no API cost)
 */
export declare function classifyRuleBased(content: string): ClassificationResult;
/**
 * Parse structured input like "/log dev 完成了..."
 */
export declare function parseStructuredInput(input: string): {
    type: EntryType | null;
    content: string;
};
/**
 * LLM classifier (uses API)
 * Calls actual LLM API for intelligent classification
 */
export declare function classifyWithLLM(content: string, config: WorklogConfig): Promise<ClassificationResult>;
/**
 * Main classification function
 * Chooses between rule-based and LLM based on config/options
 */
export declare function classify(content: string, config: WorklogConfig, useLLM?: boolean): Promise<ClassificationResult>;
/**
 * Get type display name in Chinese
 */
export declare function getTypeDisplayName(type: EntryType): string;
/**
 * Get type keywords for display
 */
export declare function getTypeKeywords(type: EntryType): string[];
//# sourceMappingURL=classifier.d.ts.map