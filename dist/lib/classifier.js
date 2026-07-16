import { classifyWithLLM as classifyLLMApi } from './llm.js';
/**
 * Keyword mapping for rule-based classification
 * Matches original skill categorization
 */
const TYPE_KEYWORDS = {
    dev: ['完成', '开发', '实现', '编写', '做了', '做', '功能', '需求'],
    release: ['上线', '发布', '部署', '灰度', '已上线', '已发布'],
    review: ['评审', '过需求', '需求评审', '评审了', '评审过'],
    design: ['设计', '方案', '架构', '技术评审', '技术方案', '技术设计'],
    bugfix: ['修复', '修了', '排查', '解决', 'bug', 'Bug', 'BUG', '问题修复'],
    datafix: ['数据修复', '数据修正', '数据清洗', '数据问题'],
    interview: ['面试', '面了', '候选人', '招聘', '面试了'],
    learn: ['学习', '看了', '研究', '了解', '掌握', '学习了', '研究了'],
    meeting: ['开会', '会议', '同步', '对齐', '参加了', '会议纪要'],
    other: [],
};
/**
 * Priority order for classification
 * Higher priority types are checked first
 */
const TYPE_PRIORITY = [
    'datafix', // Most specific
    'design',
    'release',
    'review',
    'bugfix',
    'dev',
    'meeting',
    'interview',
    'learn',
    'other', // Default fallback
];
/**
 * Rule-based classifier (no API cost)
 */
export function classifyRuleBased(content) {
    // Check each type by priority
    for (const type of TYPE_PRIORITY) {
        const keywords = TYPE_KEYWORDS[type];
        if (keywords.length === 0 && type !== 'other')
            continue;
        // Check if any keyword matches
        const matchedKeyword = keywords.find(kw => content.includes(kw));
        if (matchedKeyword) {
            return {
                type,
                title: extractTitle(content, type),
                details: content,
                suggestedTags: extractTags(content),
            };
        }
    }
    // Default to 'other'
    return {
        type: 'other',
        title: extractTitle(content, 'other'),
        details: content,
        suggestedTags: extractTags(content),
    };
}
/**
 * Extract title from content (first 50 chars or key phrase)
 */
function extractTitle(content, type) {
    // Try to find key action phrase
    const keywords = TYPE_KEYWORDS[type];
    // Find the keyword position and extract surrounding text
    for (const kw of keywords) {
        const idx = content.indexOf(kw);
        if (idx !== -1) {
            // Extract from keyword position, limit to 50 chars
            const start = Math.max(0, idx);
            const end = Math.min(content.length, start + 50);
            let title = content.slice(start, end).trim();
            // Clean up and limit
            if (title.length > 30) {
                title = title.slice(0, 30) + '...';
            }
            return title;
        }
    }
    // Fallback: first 30 chars
    const title = content.slice(0, 30).trim();
    return title.length < content.length ? title + '...' : title;
}
/**
 * Extract tags from content (look for #tag patterns)
 */
function extractTags(content) {
    const tagRegex = /#[\u4e00-\u9fa5a-zA-Z0-9_\/]+/g;
    const matches = content.match(tagRegex);
    return matches || [];
}
/**
 * Parse structured input like "/log dev 完成了..."
 */
export function parseStructuredInput(input) {
    // Check for explicit type prefix
    const validTypes = [
        'dev', 'release', 'review', 'design',
        'bugfix', 'datafix', 'interview', 'learn', 'meeting', 'other'
    ];
    const parts = input.trim().split(/\s+/);
    const firstPart = parts[0]?.toLowerCase();
    if (validTypes.includes(firstPart)) {
        return {
            type: firstPart,
            content: parts.slice(1).join(' '),
        };
    }
    return {
        type: null,
        content: input,
    };
}
/**
 * LLM classifier (uses API)
 * Calls actual LLM API for intelligent classification
 */
export async function classifyWithLLM(content, config) {
    // If no LLM configured, fall back to rule-based
    if (config.llmProvider === 'none') {
        return classifyRuleBased(content);
    }
    try {
        // Call actual LLM API
        const result = await classifyLLMApi(content, config);
        return result;
    }
    catch (error) {
        // On API failure, warn and fall back to rule-based
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.log(`⚠️  LLM API 调用失败，使用规则分类: ${errorMessage}`);
        return classifyRuleBased(content);
    }
}
/**
 * Main classification function
 * Chooses between rule-based and LLM based on config/options
 */
export async function classify(content, config, useLLM = false) {
    if (useLLM && config.llmProvider !== 'none') {
        return classifyWithLLM(content, config);
    }
    return classifyRuleBased(content);
}
/**
 * Get type display name in Chinese
 */
export function getTypeDisplayName(type) {
    const names = {
        dev: '需求开发',
        release: '上线发布',
        review: '需求评审',
        design: '技术设计',
        bugfix: 'Bug 修复',
        datafix: '数据修复',
        interview: '面试',
        learn: '学习成长',
        meeting: '会议',
        other: '其他',
    };
    return names[type];
}
/**
 * Get type keywords for display
 */
export function getTypeKeywords(type) {
    return TYPE_KEYWORDS[type];
}
//# sourceMappingURL=classifier.js.map