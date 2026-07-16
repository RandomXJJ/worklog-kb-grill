import { getEntriesFromFile, formatEntryWithWikilink } from './storage.js';
import { scanDailyFiles, getWeeklyFilePathWithFormat, getMonthlyFilePathWithFormat, ensureDir } from '../utils/fs.js';
import { getCurrentWeekBoundaries, getWeekBoundaries, formatChineseDate, formatChineseWeek, getDateInfo, } from '../utils/date.js';
import { getTypeDisplayName } from './classifier.js';
import fs from 'fs/promises';
import path from 'path';
/**
 * Type to chapter mapping for weekly report
 */
const TYPE_TO_CHAPTER = {
    dev: { chapter: '一、需求开发与上线', section: '1.1 开发中需求' },
    release: { chapter: '一、需求开发与上线', section: '1.2 已上线需求' },
    review: { chapter: '二、需求评审' },
    design: { chapter: '三、技术设计' },
    bugfix: { chapter: '四、Bug 修复' },
    datafix: { chapter: '四、Bug 修复' }, // Data fixes grouped with bugfix
    interview: { chapter: '五、面试' },
    learn: { chapter: '六、学习成长' },
    meeting: { chapter: '七、下周计划' }, // Meetings often relate to planning
    other: { chapter: '八、风险与问题' },
};
/**
 * Collect all entries for current week
 */
export async function collectWeekEntries(kbPath, week) {
    const boundaries = week
        ? { week, ...getWeekBoundaries(week) }
        : getCurrentWeekBoundaries();
    const files = await scanDailyFiles(kbPath);
    const weekEntries = [];
    for (const file of files) {
        const data = await getEntriesFromFile(file);
        if (data && data.week === boundaries.week) {
            for (const entry of data.entries) {
                weekEntries.push({
                    entry,
                    sourceDate: data.date,
                });
            }
        }
    }
    // Sort by date
    weekEntries.sort((a, b) => a.sourceDate.localeCompare(b.sourceDate));
    return {
        weekNumber: boundaries.week,
        startDate: boundaries.startDate,
        endDate: boundaries.endDate,
        entries: weekEntries,
    };
}
/**
 * Check if entry indicates released/deployed
 */
function isReleasedEntry(entry) {
    const releaseKeywords = ['已上线', '已发布', '已部署', '上线', '发布', '部署'];
    return releaseKeywords.some(kw => entry.details.includes(kw));
}
/**
 * Generate Chinese weekly report (Markdown format)
 */
export function generateWeeklyReport(report) {
    const startDateCN = formatChineseDate(report.startDate);
    const endDateCN = formatChineseDate(report.endDate);
    const weekCN = formatChineseWeek(report.weekNumber);
    let output = `# 工作周报 - ${startDateCN} - ${endDateCN}（${weekCN}）\n\n`;
    // Group entries by chapter
    const chapters = {};
    for (const item of report.entries) {
        const mapping = TYPE_TO_CHAPTER[item.entry.type] || TYPE_TO_CHAPTER.other;
        // For dev type, check if released
        let section = mapping.section;
        if (item.entry.type === 'dev') {
            section = isReleasedEntry(item.entry) ? '1.2 已上线需求' : '1.1 开发中需求';
        }
        if (!chapters[mapping.chapter]) {
            chapters[mapping.chapter] = [];
        }
        chapters[mapping.chapter].push({
            entry: item.entry,
            sourceDate: item.sourceDate,
            section,
        });
    }
    // Write chapters in order
    const chapterOrder = [
        '一、需求开发与上线',
        '二、需求评审',
        '三、技术设计',
        '四、Bug 修复',
        '五、面试',
        '六、学习成长',
        '七、下周计划',
        '八、风险与问题',
    ];
    for (const chapter of chapterOrder) {
        output += `## ${chapter}\n`;
        const items = chapters[chapter];
        if (!items || items.length === 0) {
            output += '本周无相关记录\n\n';
            continue;
        }
        // Handle sections for "一、需求开发与上线"
        if (chapter === '一、需求开发与上线') {
            const devItems = items.filter(i => i.section === '1.1 开发中需求');
            const releaseItems = items.filter(i => i.section === '1.2 已上线需求');
            output += '### 1.1 开发中需求\n';
            if (devItems.length === 0) {
                output += '本周无相关记录\n';
            }
            else {
                for (const item of devItems) {
                    const titleWithLink = formatEntryWithWikilink(item.entry);
                    output += `- ${titleWithLink}：${item.entry.details}（来源：${item.sourceDate}）\n`;
                }
            }
            output += '\n### 1.2 已上线需求\n';
            if (releaseItems.length === 0) {
                output += '本周无相关记录\n';
            }
            else {
                for (const item of releaseItems) {
                    const titleWithLink = formatEntryWithWikilink(item.entry);
                    output += `- ${titleWithLink}：${item.entry.details}（来源：${item.sourceDate}）\n`;
                }
            }
        }
        else {
            // Other chapters
            for (const item of items) {
                const titleWithLink = formatEntryWithWikilink(item.entry);
                output += `- ${titleWithLink}：${item.entry.details}（来源：${item.sourceDate}）\n`;
            }
        }
        output += '\n';
    }
    return output;
}
/**
 * Generate Chinese weekly report (Plain text format)
 */
export function generateWeeklyReportTxt(report) {
    const startDateCN = formatChineseDate(report.startDate);
    const endDateCN = formatChineseDate(report.endDate);
    const weekCN = formatChineseWeek(report.weekNumber);
    let output = `工作周报 - ${startDateCN} - ${endDateCN}（${weekCN})\n`;
    output += `${'='.repeat(50)}\n\n`;
    // Group entries by chapter
    const chapters = {};
    for (const item of report.entries) {
        const mapping = TYPE_TO_CHAPTER[item.entry.type] || TYPE_TO_CHAPTER.other;
        // For dev type, check if released
        let section = mapping.section;
        if (item.entry.type === 'dev') {
            section = isReleasedEntry(item.entry) ? '1.2 已上线需求' : '1.1 开发中需求';
        }
        if (!chapters[mapping.chapter]) {
            chapters[mapping.chapter] = [];
        }
        chapters[mapping.chapter].push({
            entry: item.entry,
            sourceDate: item.sourceDate,
            section,
        });
    }
    // Write chapters in order
    const chapterOrder = [
        '一、需求开发与上线',
        '二、需求评审',
        '三、技术设计',
        '四、Bug 修复',
        '五、面试',
        '六、学习成长',
        '七、下周计划',
        '八、风险与问题',
    ];
    for (const chapter of chapterOrder) {
        output += `${chapter}\n`;
        output += `${'─'.repeat(30)}\n`;
        const items = chapters[chapter];
        if (!items || items.length === 0) {
            output += '本周无相关记录\n\n';
            continue;
        }
        // Handle sections for "一、需求开发与上线"
        if (chapter === '一、需求开发与上线') {
            const devItems = items.filter(i => i.section === '1.1 开发中需求');
            const releaseItems = items.filter(i => i.section === '1.2 已上线需求');
            output += '1.1 开发中需求\n';
            if (devItems.length === 0) {
                output += '  本周无相关记录\n';
            }
            else {
                for (const item of devItems) {
                    // Strip wikilinks for txt format
                    const title = item.entry.projectName
                        ? `${item.entry.title} [${item.entry.projectName}]`
                        : item.entry.title;
                    output += `  - ${title}（${item.sourceDate})\n`;
                }
            }
            output += '\n1.2 已上线需求\n';
            if (releaseItems.length === 0) {
                output += '  本周无相关记录\n';
            }
            else {
                for (const item of releaseItems) {
                    const title = item.entry.projectName
                        ? `${item.entry.title} [${item.entry.projectName}]`
                        : item.entry.title;
                    output += `  - ${title}（${item.sourceDate})\n`;
                }
            }
        }
        else {
            // Other chapters
            for (const item of items) {
                const title = item.entry.projectName
                    ? `${item.entry.title} [${item.entry.projectName}]`
                    : item.entry.title;
                output += `  - ${title}（${item.sourceDate})\n`;
            }
        }
        output += '\n';
    }
    return output;
}
/**
 * Save weekly report to file
 */
export async function saveWeeklyReport(kbPath, content, week, format = 'md') {
    const filePath = getWeeklyFilePathWithFormat(kbPath, week, format);
    await ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, content, 'utf-8');
    return filePath;
}
/**
 * Collect all entries for current month
 */
export async function collectMonthEntries(kbPath, month) {
    const targetMonth = month || getDateInfo().month;
    const files = await scanDailyFiles(kbPath);
    const monthEntries = [];
    for (const file of files) {
        const data = await getEntriesFromFile(file);
        if (data && data.month === targetMonth) {
            for (const entry of data.entries) {
                monthEntries.push({
                    entry,
                    sourceDate: data.date,
                });
            }
        }
    }
    // Sort by date
    monthEntries.sort((a, b) => a.sourceDate.localeCompare(b.sourceDate));
    return {
        month: targetMonth,
        entries: monthEntries,
    };
}
/**
 * Generate Chinese monthly report (Markdown format)
 */
export function generateMonthlyReport(report) {
    const [year, monthNum] = report.month.split('-');
    const monthCN = `${year}年${monthNum}月`;
    let output = `# 工作月报 - ${monthCN}\n\n`;
    output += `> 本月共记录 ${report.entries.length} 条工作事项\n\n`;
    // Group by type
    const byType = {};
    for (const item of report.entries) {
        if (!byType[item.entry.type]) {
            byType[item.entry.type] = [];
        }
        byType[item.entry.type].push(item);
    }
    // Type order for display
    const typeOrder = [
        'dev', 'release', 'review', 'design',
        'bugfix', 'datafix', 'interview', 'learn', 'meeting', 'other',
    ];
    for (const type of typeOrder) {
        const items = byType[type];
        if (!items || items.length === 0)
            continue;
        const typeName = getTypeDisplayName(type);
        output += `## ${typeName}\n`;
        output += `> 共 ${items.length} 条记录\n\n`;
        for (const item of items) {
            output += `- **${item.sourceDate}**：${item.entry.title}\n`;
            output += `  ${item.entry.details}\n`;
            if (item.entry.tags.length > 0) {
                output += `  标签：${item.entry.tags.join(' ')}\n`;
            }
            output += '\n';
        }
    }
    // Summary statistics
    output += '## 本月统计\n\n';
    output += '| 类别 | 数量 |\n';
    output += '|------|------|\n';
    for (const type of typeOrder) {
        const count = byType[type]?.length || 0;
        if (count > 0) {
            output += `| ${getTypeDisplayName(type)} | ${count} |\n`;
        }
    }
    return output;
}
/**
 * Generate Chinese monthly report (Plain text format)
 */
export function generateMonthlyReportTxt(report) {
    const [year, monthNum] = report.month.split('-');
    const monthCN = `${year}年${monthNum}月`;
    let output = `工作月报 - ${monthCN}\n`;
    output += `${'='.repeat(50)}\n\n`;
    output += `本月共记录 ${report.entries.length} 条工作事项\n\n`;
    // Group by type
    const byType = {};
    for (const item of report.entries) {
        if (!byType[item.entry.type]) {
            byType[item.entry.type] = [];
        }
        byType[item.entry.type].push(item);
    }
    // Type order for display
    const typeOrder = [
        'dev', 'release', 'review', 'design',
        'bugfix', 'datafix', 'interview', 'learn', 'meeting', 'other',
    ];
    for (const type of typeOrder) {
        const items = byType[type];
        if (!items || items.length === 0)
            continue;
        const typeName = getTypeDisplayName(type);
        output += `${typeName}\n`;
        output += `${'─'.repeat(30)}\n`;
        output += `共 ${items.length} 条记录\n\n`;
        for (const item of items) {
            const title = item.entry.projectName
                ? `${item.entry.title} [${item.entry.projectName}]`
                : item.entry.title;
            output += `  ${item.sourceDate}：${title}\n`;
            output += `    ${item.entry.details}\n`;
            if (item.entry.tags.length > 0) {
                output += `    标签：${item.entry.tags.join(' ')}\n`;
            }
            output += '\n';
        }
    }
    // Summary statistics
    output += '本月统计\n';
    output += `${'─'.repeat(30)}\n\n`;
    for (const type of typeOrder) {
        const count = byType[type]?.length || 0;
        if (count > 0) {
            output += `  ${getTypeDisplayName(type)}：${count} 条\n`;
        }
    }
    return output;
}
/**
 * Save monthly report to file
 */
export async function saveMonthlyReport(kbPath, content, month, format = 'md') {
    const filePath = getMonthlyFilePathWithFormat(kbPath, month, format);
    await ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, content, 'utf-8');
    return filePath;
}
//# sourceMappingURL=report.js.map