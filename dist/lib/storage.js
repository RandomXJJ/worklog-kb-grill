import matter from 'gray-matter';
import { ensureDir, readFileSafe, getDailyFilePath, getInboxFilePath, getTagsIndexPath, } from '../utils/fs.js';
import { getDateInfo } from '../utils/date.js';
import fs from 'fs/promises';
import path from 'path';
/**
 * Build YAML frontmatter manually (avoids gray-matter anchor issues)
 */
function buildYamlFrontmatter(dateInfo, entries) {
    // Build proper YAML format for entries
    const entriesYaml = entries.map(entry => {
        const tagsYaml = entry.tags.map(t => `"${t}"`).join(', ');
        const projectNameYaml = entry.projectName ? `\n    projectName: "${escapeYamlString(entry.projectName)}"` : '';
        return `  - type: "${entry.type}"
    title: "${escapeYamlString(entry.title)}"
    details: "${escapeYamlString(entry.details)}"
    tags: [${tagsYaml}]${projectNameYaml}`;
    }).join('\n');
    return `---
date: "${dateInfo.date}"
week: "${dateInfo.week}"
month: "${dateInfo.month}"
entries:
${entriesYaml}
---`;
}
/**
 * Escape special characters for YAML strings
 */
function escapeYamlString(str) {
    return str
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n');
}
/**
 * Generate Obsidian callouts body for daily log.
 * If bodyContent is null, return empty template.
 * If provided, fill the 4 retrospective sections (work/note/details/summary)
 * while preserving plan sections (todo/warning) as empty template.
 */
function generateCalloutsBody(date, bodyContent = null) {
    // ponytail: defensive — strip leading markdown heading from LLM output
    // (LLM sometimes echoes "## 详细笔记" / "## 今日总结" inside the field
    // value despite prompt instructions, causing duplicate headings).
    const stripHeading = (text) => typeof text === 'string' ? text.replace(/^\s*#{1,6}\s+[^\n]*\n+/, '') : text;

    const todoBlock = `> [!todo] 今天要做的
> - [ ]`;

    const workBlock = bodyContent?.work
        ? `> [!tip]+ 工作记录
${bodyContent.work.split('\n').map(l => `> ${l}`).join('\n')}`
        : `> [!tip]+ 工作记录`;

    const noteBlock = bodyContent?.note
        ? `> [!note]- 笔记
${bodyContent.note.split('\n').map(l => `> ${l}`).join('\n')}`
        : `> [!note]- 笔记`;

    const warningBlock = `> [!warning] 明天继续`;

    const detailsBlock = bodyContent?.details
        ? `## 详细笔记

${stripHeading(bodyContent.details)}`
        : `## 详细笔记

<!-- 补充详细描述，可使用 [[双向链接]] -->`;

    const summaryBlock = bodyContent?.summary
        ? `## 今日总结

${stripHeading(bodyContent.summary)}`
        : `## 今日总结

<!-- 重要的收获、问题 -->`;

    return `# ${date}

${todoBlock}

${workBlock}

${noteBlock}

${warningBlock}

---

${detailsBlock}

${summaryBlock}
`;
}
/**
 * Read daily log file and parse frontmatter
 */
export async function readDailyLog(filePath) {
    const content = await readFileSafe(filePath);
    if (!content)
        return null;
    try {
        const parsed = matter(content);
        return parsed.data;
    }
    catch {
        return null;
    }
}
/**
 * Write daily log file with frontmatter
 */
export async function writeDailyLog(filePath, frontmatter, bodyContent = '') {
    const dateInfo = {
        date: frontmatter.date,
        week: frontmatter.week,
        month: frontmatter.month,
    };
    const yaml = buildYamlFrontmatter(dateInfo, frontmatter.entries);
    await ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, yaml + '\n' + bodyContent, 'utf-8');
}
/**
 * Add entry to daily log
 */
export async function addEntryToDaily(kbPath, entry, bodyContent = null) {
    const dateInfo = getDateInfo();
    const inboxPath = getInboxFilePath(kbPath, dateInfo.date);
    const dailyPath = getDailyFilePath(kbPath, dateInfo.date);
    // Create fresh copy of entry
    const entryForInbox = {
        type: entry.type,
        title: entry.title,
        details: entry.details,
        tags: [...entry.tags],
        projectName: entry.projectName,
    };
    // Process inbox file
    await ensureDir(path.dirname(inboxPath));
    let inboxContent = await readFileSafe(inboxPath);
    // Create fresh array, don't modify parsed.data.entries directly
    let inboxEntries = [];
    if (inboxContent) {
        const parsed = matter(inboxContent);
        if (parsed.data.entries && Array.isArray(parsed.data.entries)) {
            // Deep copy each entry to avoid reference issues
            inboxEntries = parsed.data.entries.map((e) => ({
                type: e.type,
                title: e.title,
                details: e.details,
                tags: [...e.tags],
                projectName: e.projectName,
            }));
        }
    }
    inboxEntries.push(entryForInbox);
    const inboxYaml = buildYamlFrontmatter(dateInfo, inboxEntries);
    const inboxBody = generateCalloutsBody(dateInfo.date, bodyContent);
    await fs.writeFile(inboxPath, inboxYaml + '\n' + inboxBody, 'utf-8');
    // Create fresh copy for daily
    const entryForDaily = {
        type: entry.type,
        title: entry.title,
        details: entry.details,
        tags: [...entry.tags],
        projectName: entry.projectName,
    };
    // Process daily file
    await ensureDir(path.dirname(dailyPath));
    let dailyContent = await readFileSafe(dailyPath);
    // Create fresh array
    let dailyEntries = [];
    if (dailyContent) {
        const parsed = matter(dailyContent);
        if (parsed.data.entries && Array.isArray(parsed.data.entries)) {
            // Deep copy each entry
            dailyEntries = parsed.data.entries.map((e) => ({
                type: e.type,
                title: e.title,
                details: e.details,
                tags: [...e.tags],
                projectName: e.projectName,
            }));
        }
    }
    dailyEntries.push(entryForDaily);
    const dailyYaml = buildYamlFrontmatter(dateInfo, dailyEntries);
    const dailyBody = generateCalloutsBody(dateInfo.date, bodyContent);
    await fs.writeFile(dailyPath, dailyYaml + '\n' + dailyBody, 'utf-8');
    return { inboxPath, dailyPath };
}
/**
 * Update tags index
 */
export async function updateTagsIndex(kbPath, entry, date) {
    const tagsPath = getTagsIndexPath(kbPath);
    // Ensure tags directory exists
    await ensureDir(path.dirname(tagsPath));
    let tagsContent = await readFileSafe(tagsPath) || '';
    if (!tagsContent) {
        tagsContent = `# 标签索引

此文件自动维护，记录每个标签关联的日志条目。

`;
    }
    // Add each tag reference
    for (const tag of entry.tags) {
        const tagSection = `## ${tag}`;
        if (!tagsContent.includes(tagSection)) {
            // Add new tag section
            tagsContent += `\n${tagSection}\n- [[${date}]] - ${entry.title}\n`;
        }
        else {
            // Append to existing tag section
            const tagEntry = `- [[${date}]] - ${entry.title}`;
            if (!tagsContent.includes(tagEntry)) {
                // Find the tag section and append
                const lines = tagsContent.split('\n');
                let insertIndex = -1;
                for (let i = 0; i < lines.length; i++) {
                    if (lines[i] === tagSection) {
                        // Find the next section or end of file
                        for (let j = i + 1; j < lines.length; j++) {
                            if (lines[j].startsWith('## ') || j === lines.length - 1) {
                                insertIndex = j;
                                break;
                            }
                        }
                        break;
                    }
                }
                if (insertIndex !== -1) {
                    lines.splice(insertIndex, 0, tagEntry);
                    tagsContent = lines.join('\n');
                }
            }
        }
    }
    await fs.writeFile(tagsPath, tagsContent, 'utf-8');
}
/**
 * Get all entries from a daily file
 */
export async function getEntriesFromFile(filePath) {
    const frontmatter = await readDailyLog(filePath);
    if (!frontmatter)
        return null;
    // Ensure date is a string (handle Date object from YAML parsing)
    let dateStr;
    if (typeof frontmatter.date === 'string') {
        dateStr = frontmatter.date;
    }
    else {
        // Handle Date object or other formats
        const d = frontmatter.date;
        dateStr = d instanceof Date ? d.toISOString().split('T')[0] : String(frontmatter.date);
    }
    return {
        date: dateStr,
        week: frontmatter.week,
        month: frontmatter.month,
        entries: frontmatter.entries,
    };
}
/**
 * Get today's entries count
 */
export async function getTodayEntriesCount(kbPath) {
    const dateInfo = getDateInfo();
    const dailyPath = getDailyFilePath(kbPath, dateInfo.date);
    const data = await readDailyLog(dailyPath);
    return data?.entries.length || 0;
}
/**
 * Get week entries count
 */
export async function getWeekEntriesCount(kbPath, week) {
    const { scanDailyFiles } = await import('../utils/fs.js');
    const files = await scanDailyFiles(kbPath);
    let count = 0;
    for (const file of files) {
        const data = await readDailyLog(file);
        if (data && data.week === week) {
            count += data.entries.length;
        }
    }
    return count;
}
/**
 * Get month entries count
 */
export async function getMonthEntriesCount(kbPath, month) {
    const { scanDailyFiles } = await import('../utils/fs.js');
    const files = await scanDailyFiles(kbPath);
    let count = 0;
    for (const file of files) {
        const data = await readDailyLog(file);
        if (data && data.month === month) {
            count += data.entries.length;
        }
    }
    return count;
}
/**
 * Format entry title with wikilink for Obsidian
 */
export function formatEntryWithWikilink(entry) {
    if (entry.projectName) {
        return `${entry.title} [[${entry.projectName}]]`;
    }
    return entry.title;
}
/**
 * Extract wikilinks from entry title or details
 */
export function extractWikilinks(text) {
    const wikilinkRegex = /\[\[([^\]]+)\]\]/g;
    const links = [];
    let match;
    while ((match = wikilinkRegex.exec(text)) !== null) {
        links.push(match[1]);
    }
    return links;
}
//# sourceMappingURL=storage.js.map