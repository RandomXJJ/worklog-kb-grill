import type { WorklogConfig, LLMProviderConfig } from '../types/index.js';
/**
 * Default LLM provider configurations
 */
export declare const LLM_PROVIDERS: Record<string, LLMProviderConfig>;
/**
 * Get current configuration
 */
export declare function getConfig(): WorklogConfig;
/**
 * Check if configuration exists
 */
export declare function hasConfig(): boolean;
/**
 * Initialize configuration
 */
export declare function initConfig(options: Partial<WorklogConfig>): WorklogConfig;
/**
 * Update configuration
 */
export declare function updateConfig(updates: Partial<WorklogConfig>): WorklogConfig;
/**
 * Set kb path
 */
export declare function setKbPath(path: string): void;
/**
 * Set LLM provider
 */
export declare function setLLMProvider(provider: string): void;
/**
 * Set API key
 */
export declare function setApiKey(key: string): void;
/**
 * Get LLM provider info
 */
export declare function getLLMProviderInfo(providerName: string): LLMProviderConfig;
/**
 * Clear configuration
 */
export declare function clearConfig(): void;
/**
 * Get config file path
 */
export declare function getConfigPath(): string;
//# sourceMappingURL=config.d.ts.map