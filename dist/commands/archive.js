import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { getConfig } from '../lib/config.js';
import { scanDailyFiles, ensureDir, readFileSafe, } from '../utils/fs.js';
import { readDailyLog, extractWikilinks, } from '../lib/storage.js';
import fs from 'fs/promises';
import path from 'path';
import { getCurrentWeekBoundaries } from '../utils/date.js';
export const archiveCommand = new Command('archive')
    .description('Archive notes from diary to resources')
    .option('-w, --week <week>', 'Archive specific week (e.g., 2026-W19)')
    .option('--last-week', 'Archive last week')
    .option('--interactive', 'Interactive selection mode')
    .action(async (options) => {
    const config = getConfig();
    if (!config.kbPath) {
        console.log(chalk.red('错误: 请先运行 worklog init 初始化知识库'));
        return;
    }
    // Determine time range
    let week;
    if (options.week) {
        week = options.week;
    }
    else if (options.lastWeek) {
        const current = getCurrentWeekBoundaries();
        const lastWeekNum = parseInt(current.week.split('-W')[1]) - 1;
        const year = current.week.split('-W')[0];
        week = `${year}-W${lastWeekNum.toString().padStart(2, '0')}`;
    }
    else {
        week = getCurrentWeekBoundaries().week;
    }
    console.log(chalk.blue('📦 整理笔记到资源库'));
    console.log(chalk.gray(`时间范围: ${week}`));
    console.log();
    // Scan diary files
    const files = await scanDailyFiles(config.kbPath);
    const weekFiles = files.filter(async (file) => {
        const data = await readDailyLog(file);
        return data?.week === week;
    });
    if (weekFiles.length === 0) {
        console.log(chalk.yellow('该周没有日记记录'));
        return;
    }
    // Extract notes from diary files
    const allNotes = [];
    for (const file of await Promise.all(weekFiles)) {
        const content = await readFileSafe(file);
        if (!content)
            continue;
        // Extract from callouts format
        const noteMatch = content.match(/> \[!note\][+-] 笔记\n((?:> .*\n?)+)/);
        if (noteMatch) {
            const noteLines = noteMatch[1]
                .split('\n')
                .filter((line) => line.startsWith('> -') || line.startsWith('> '))
                .map((line) => line.replace(/^> /, '').replace(/^- /, '').trim())
                .filter((line) => line.length > 0);
            const date = path.basename(file, '.md');
            for (const note of noteLines) {
                const hasWikilink = extractWikilinks(note).length > 0;
                allNotes.push({
                    content: note,
                    date,
                    sourceFile: file,
                    archived: hasWikilink,
                });
            }
        }
        // Extract from traditional format
        const data = await readDailyLog(file);
        if (data && data.entries) {
            for (const entry of data.entries) {
                // Check for learn type entries as potential notes
                if (entry.type === 'learn') {
                    const hasWikilink = extractWikilinks(entry.title).length > 0 ||
                        extractWikilinks(entry.details).length > 0;
                    allNotes.push({
                        content: entry.details,
                        date: data.date,
                        sourceFile: file,
                        archived: hasWikilink,
                    });
                }
            }
        }
    }
    // Filter unarchived notes
    const unarchivedNotes = allNotes.filter((n) => !n.archived);
    if (unarchivedNotes.length === 0) {
        console.log(chalk.green('所有笔记已整理完成'));
        return;
    }
    console.log(chalk.bold(`发现 ${unarchivedNotes.length} 条未整理笔记`));
    console.log();
    // Interactive selection
    const answer = await inquirer.prompt([
        {
            type: 'checkbox',
            name: 'selected',
            message: '选择要整理的笔记',
            choices: unarchivedNotes.map((note, index) => ({
                name: note.content.substring(0, 50) + (note.content.length > 50 ? '...' : ''),
                value: index,
                checked: false,
            })),
        },
    ]);
    const selectedNotes = unarchivedNotes.filter((_, index) => answer.selected.includes(index));
    if (selectedNotes.length === 0) {
        console.log(chalk.yellow('未选择任何笔记'));
        return;
    }
    // Analyze and categorize notes
    console.log();
    console.log(chalk.blue('📝 分析笔记主题...'));
    for (const note of selectedNotes) {
        // Ask for target resource
        const categorizeAnswer = await inquirer.prompt([
            {
                type: 'input',
                name: 'resource',
                message: `归类笔记: "${note.content.substring(0, 30)}..."`,
                default: inferResourceName(note.content),
            },
        ]);
        const resourceName = categorizeAnswer.resource;
        await appendToResource(config.kbPath, resourceName, note.content, note.date);
        // Mark as archived in diary
        await markNoteAsArchived(note.sourceFile, note.content, resourceName);
        console.log(chalk.gray(`  ✓ 整理到 [[${resourceName}]]`));
    }
    console.log();
    console.log(chalk.green(`✅ 已整理 ${selectedNotes.length} 条笔记到资源库`));
    console.log(chalk.gray(`资源目录: kb/resources/`));
});
/**
 * Infer resource name from note content
 */
function inferResourceName(content) {
    // Common tech keywords
    const techKeywords = {
        MongoDB: ['MongoDB', 'mongo', 'Mongo'],
        Redis: ['Redis', 'redis', '缓存'],
        MySQL: ['MySQL', 'mysql', 'MySQL'],
        PostgreSQL: ['PostgreSQL', 'postgres', 'PostgreSQL'],
        Go: ['Go', 'golang', 'Golang'],
        React: ['React', 'react', 'React'],
        Vue: ['Vue', 'vue', 'Vue'],
        TypeScript: ['TypeScript', 'typescript', 'ts'],
        JavaScript: ['JavaScript', 'javascript', 'js'],
        Python: ['Python', 'python', 'Python'],
        Docker: ['Docker', 'docker', 'Docker'],
        Kubernetes: ['Kubernetes', 'k8s', 'Kubernetes'],
        Git: ['Git', 'git', 'Git'],
        API: ['API', 'api', '接口'],
        '前端': ['前端', 'frontend', 'CSS', 'HTML'],
        '后端': ['后端', 'backend', '服务端'],
        '性能优化': ['性能', '优化', 'performance'],
        '安全': ['安全', 'security', '认证', '加密'],
    };
    for (const [name, keywords] of Object.entries(techKeywords)) {
        if (keywords.some((kw) => content.toLowerCase().includes(kw.toLowerCase()))) {
            return name;
        }
    }
    // Default: extract first meaningful word
    const words = content.split(/\s+/).filter((w) => w.length > 2);
    return words[0] || '知识点';
}
/**
 * Append note to resource file
 */
async function appendToResource(kbPath, resourceName, content, sourceDate) {
    const resourcesDir = path.join(kbPath, 'resources');
    await ensureDir(resourcesDir);
    const resourcePath = path.join(resourcesDir, `${resourceName}.md`);
    let resourceContent = await readFileSafe(resourcePath);
    if (!resourceContent) {
        // Create new resource file
        const template = `---
title: "${resourceName}"
date: "${sourceDate}"
tags:
  - resource
aliases:
  - ${resourceName}
---

# ${resourceName}

知识点收集与整理。

> [!abstract] 核心要点

> [!example]+ 代码示例

> [!tip] 最佳实践

> [!quote] 参考
`;
        await fs.writeFile(resourcePath, template, 'utf-8');
        resourceContent = template;
    }
    // Append to 核心要点 section
    const lines = resourceContent.split('\n');
    let insertIndex = -1;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('> [!abstract] 核心要点')) {
            // Find next section or end
            for (let j = i + 1; j < lines.length; j++) {
                if (lines[j].startsWith('> [!') || j === lines.length - 1) {
                    insertIndex = j;
                    break;
                }
                // Skip empty callout lines
                if (lines[j] === '>' || lines[j].trim() === '') {
                    insertIndex = j;
                    break;
                }
            }
            break;
        }
    }
    if (insertIndex !== -1) {
        lines.splice(insertIndex, 0, `> - ${content}`);
        await fs.writeFile(resourcePath, lines.join('\n'), 'utf-8');
    }
}
/**
 * Mark note as archived in diary file
 */
async function markNoteAsArchived(filePath, noteContent, resourceName) {
    const content = await readFileSafe(filePath);
    if (!content)
        return;
    // Add wikilink to note content
    const newContent = content.replace(new RegExp(`> - ${escapeRegex(noteContent.substring(0, 50))}`, 'g'), `> - ${noteContent} [[${resourceName}]]`);
    await fs.writeFile(filePath, newContent, 'utf-8');
}
/**
 * Escape special regex characters
 */
function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
//# sourceMappingURL=archive.js.map