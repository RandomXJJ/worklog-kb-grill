import type { WorklogConfig, ClassificationResult } from '../types/index.js';
/**
 * Main LLM classification function
 * Calls appropriate API based on provider config
 */
export declare function classifyWithLLM(content: string, config: WorklogConfig): Promise<ClassificationResult>;
/**
 * Get provider display name
 */
export declare function getProviderName(provider: string): string;
//# sourceMappingURL=llm.d.ts.map