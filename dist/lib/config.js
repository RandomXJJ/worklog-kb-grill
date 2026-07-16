import Conf from 'conf';
const CONFIG_NAME = 'worklog-kb';
/**
 * Default LLM provider configurations
 */
export const LLM_PROVIDERS = {
    openai: {
        name: 'OpenAI',
        apiKeyEnv: 'OPENAI_API_KEY',
        defaultModel: 'gpt-4o-mini',
    },
    anthropic: {
        name: 'Anthropic (Claude)',
        apiKeyEnv: 'ANTHROPIC_API_KEY',
        defaultModel: 'claude-3-5-haiku-latest',
    },
    gemini: {
        name: 'Google Gemini',
        apiKeyEnv: 'GOOGLE_API_KEY',
        defaultModel: 'gemini-2.0-flash',
    },
    deepseek: {
        name: 'DeepSeek',
        apiKeyEnv: 'DEEPSEEK_API_KEY',
        defaultModel: 'deepseek-chat',
    },
    ollama: {
        name: 'Ollama (Local)',
        defaultModel: 'llama3',
        endpoint: 'http://localhost:11434',
    },
    none: {
        name: 'None (Rule-based only)',
        defaultModel: '',
    },
};
/**
 * Configuration store using conf package
 */
const configStore = new Conf({
    projectName: CONFIG_NAME,
    schema: {
        kbPath: {
            type: 'string',
            default: '',
        },
        llmProvider: {
            type: 'string',
            enum: ['openai', 'anthropic', 'gemini', 'deepseek', 'ollama', 'none'],
            default: 'none',
        },
        apiKey: {
            type: 'string',
            default: '',
        },
        defaultMode: {
            type: 'string',
            enum: ['rule-based', 'llm'],
            default: 'rule-based',
        },
        createdAt: {
            type: 'string',
            default: '',
        },
        updatedAt: {
            type: 'string',
            default: '',
        },
    },
});
/**
 * Get current configuration
 */
export function getConfig() {
    return configStore.store;
}
/**
 * Check if configuration exists
 */
export function hasConfig() {
    return configStore.has('kbPath') && configStore.get('kbPath') !== '';
}
/**
 * Initialize configuration
 */
export function initConfig(options) {
    const now = new Date().toISOString();
    const config = {
        kbPath: options.kbPath || '',
        llmProvider: options.llmProvider || 'none',
        apiKey: options.apiKey || '',
        defaultMode: options.defaultMode || 'rule-based',
        createdAt: now,
        updatedAt: now,
    };
    configStore.store = config;
    return config;
}
/**
 * Update configuration
 */
export function updateConfig(updates) {
    const current = getConfig();
    const updated = {
        ...current,
        ...updates,
        updatedAt: new Date().toISOString(),
    };
    configStore.store = updated;
    return updated;
}
/**
 * Set kb path
 */
export function setKbPath(path) {
    configStore.set('kbPath', path);
    configStore.set('updatedAt', new Date().toISOString());
}
/**
 * Set LLM provider
 */
export function setLLMProvider(provider) {
    if (!LLM_PROVIDERS[provider]) {
        throw new Error(`Unknown LLM provider: ${provider}`);
    }
    configStore.set('llmProvider', provider);
    configStore.set('updatedAt', new Date().toISOString());
}
/**
 * Set API key
 */
export function setApiKey(key) {
    configStore.set('apiKey', key);
    configStore.set('updatedAt', new Date().toISOString());
}
/**
 * Get LLM provider info
 */
export function getLLMProviderInfo(providerName) {
    return LLM_PROVIDERS[providerName] || LLM_PROVIDERS.none;
}
/**
 * Clear configuration
 */
export function clearConfig() {
    configStore.clear();
}
/**
 * Get config file path
 */
export function getConfigPath() {
    return configStore.path;
}
//# sourceMappingURL=config.js.map