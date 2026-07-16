import { LLM_PROVIDERS } from './config.js';
/**
 * Classification prompt template
 */
const CLASSIFICATION_PROMPT = `你是一个工作日志分类助手。请将以下工作内容分类并提取关键信息。

分类类别（选择最匹配的一个）：
- dev: 需求开发（完成、开发、实现、编写功能）
- release: 上线发布（上线、发布、部署、灰度）
- review: 需求评审（评审、过需求、需求讨论）
- design: 技术设计（设计、方案、架构、技术评审）
- bugfix: Bug修复（修复bug、排查问题、解决故障）
- datafix: 数据修复（数据修正、数据清洗、数据问题）
- interview: 面试（面试候选人、招聘）
- learn: 学习成长（学习技术、研究框架、了解新知识）
- meeting: 会议（开会、同步、对齐、讨论）
- other: 其他（无法归类的其他事项）

请以JSON格式返回，格式如下：
{
  "type": "类别标识（dev/release/review等）",
  "title": "简短标题（20字以内，概括核心内容）",
  "details": "详细描述（原始内容或稍微润色）",
  "suggestedTags": ["建议标签列表（如#项目名、#技术栈）"]
}

工作内容：
{{content}}

请直接返回JSON，不要有其他说明文字。`;
/**
 * Parse LLM response to ClassificationResult
 */
function parseLLMResponse(response) {
    // Try to extract JSON from response
    let jsonStr = response.trim();
    // Remove markdown code blocks if present
    if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.slice(7);
    }
    if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.slice(3);
    }
    if (jsonStr.endsWith('```')) {
        jsonStr = jsonStr.slice(0, -3);
    }
    jsonStr = jsonStr.trim();
    try {
        const parsed = JSON.parse(jsonStr);
        // Validate type is valid
        const validTypes = [
            'dev', 'release', 'review', 'design',
            'bugfix', 'datafix', 'interview', 'learn', 'meeting', 'other'
        ];
        if (!validTypes.includes(parsed.type)) {
            parsed.type = 'other';
        }
        return {
            type: parsed.type,
            title: parsed.title || '',
            details: parsed.details || '',
            suggestedTags: parsed.suggestedTags || [],
        };
    }
    catch (error) {
        // JSON parse failed, return fallback
        return {
            type: 'other',
            title: 'LLM解析失败',
            details: response,
            suggestedTags: [],
        };
    }
}
/**
 * Call OpenAI API
 */
async function callOpenAI(prompt, apiKey) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'user', content: prompt }
            ],
            temperature: 0.3,
            max_tokens: 500,
        }),
    });
    if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }
    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
}
/**
 * Call Anthropic Claude API
 */
async function callAnthropic(prompt, apiKey) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
            model: 'claude-3-5-haiku-latest',
            max_tokens: 500,
            messages: [
                { role: 'user', content: prompt }
            ],
        }),
    });
    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Anthropic API error: ${response.status} - ${error}`);
    }
    const data = await response.json();
    return data.content?.[0]?.text || '';
}
/**
 * Call Google Gemini API
 */
async function callGemini(prompt, apiKey) {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            contents: [
                { parts: [{ text: prompt }] }
            ],
            generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 500,
            },
        }),
    });
    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Gemini API error: ${response.status} - ${error}`);
    }
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}
/**
 * Call DeepSeek API (OpenAI-compatible format)
 */
async function callDeepSeek(prompt, apiKey) {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [
                { role: 'user', content: prompt }
            ],
            temperature: 0.3,
            max_tokens: 500,
        }),
    });
    if (!response.ok) {
        const error = await response.text();
        throw new Error(`DeepSeek API error: ${response.status} - ${error}`);
    }
    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
}
/**
 * Call Ollama local API
 */
async function callOllama(prompt, model = 'llama3') {
    const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model,
            prompt,
            stream: false,
            options: {
                temperature: 0.3,
                num_predict: 500,
            },
        }),
    });
    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Ollama API error: ${response.status} - ${error}`);
    }
    const data = await response.json();
    return data.response || '';
}
/**
 * Main LLM classification function
 * Calls appropriate API based on provider config
 */
export async function classifyWithLLM(content, config) {
    const provider = config.llmProvider;
    const apiKey = config.apiKey || '';
    // Validate API key for non-local providers
    if (provider !== 'none' && provider !== 'ollama' && !apiKey) {
        throw new Error(`API key required for ${provider}. Run: worklog config --key <your-key>`);
    }
    let raw;
    try {
        switch (provider) {
            case 'openai':
                raw = await callOpenAI(CLASSIFICATION_PROMPT.replace('{{content}}', content), apiKey);
                break;
            case 'anthropic':
                raw = await callAnthropic(CLASSIFICATION_PROMPT.replace('{{content}}', content), apiKey);
                break;
            case 'gemini':
                raw = await callGemini(CLASSIFICATION_PROMPT.replace('{{content}}', content), apiKey);
                break;
            case 'deepseek':
                raw = await callDeepSeek(CLASSIFICATION_PROMPT.replace('{{content}}', content), apiKey);
                break;
            case 'ollama':
                raw = await callOllama(CLASSIFICATION_PROMPT.replace('{{content}}', content));
                break;
            default:
                throw new Error(`Unknown LLM provider: ${provider}`);
        }
    }
    catch (error) {
        // Re-throw for error handling in caller
        throw error;
    }
    return parseLLMResponse(raw);
}
/**
 * Get provider display name
 */
export function getProviderName(provider) {
    return LLM_PROVIDERS[provider]?.name || provider;
}
/**
 * Raw LLM call returning plain text (skips JSON parsing).
 * Used by grill.js for free-form prompts.
 */
export async function callLLMRaw(prompt, config) {
    const provider = config.llmProvider;
    const apiKey = config.apiKey || '';
    if (provider === 'none') {
        throw new Error('LLM provider not configured. Run: worklog config --provider <name>');
    }
    switch (provider) {
        case 'openai':
            return await callOpenAI(prompt, apiKey);
        case 'anthropic':
            return await callAnthropic(prompt, apiKey);
        case 'gemini':
            return await callGemini(prompt, apiKey);
        case 'deepseek':
            return await callDeepSeek(prompt, apiKey);
        case 'ollama':
            return await callOllama(prompt);
        default:
            throw new Error(`Unknown LLM provider: ${provider}`);
    }
}
//# sourceMappingURL=llm.js.map