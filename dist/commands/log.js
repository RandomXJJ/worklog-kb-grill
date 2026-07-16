import { Command } from 'commander';
import chalk from 'chalk';
import { getConfig, hasConfig, LLM_PROVIDERS } from '../lib/config.js';
import { classify, parseStructuredInput, getTypeDisplayName } from '../lib/classifier.js';
import { addEntryToDaily, updateTagsIndex } from '../lib/storage.js';
import { getDateInfo } from '../utils/date.js';
import { grillFollowUp } from '../lib/grill.js';
export const logCommand = new Command('log')
    .description('Record a work entry')
    .argument('[content]', 'Work entry content')
    .option('-t, --type <type>', 'Explicit entry type (dev, release, review, etc.)')
    .option('--tags <tags>', 'Comma-separated tags (e.g., #项目,#技术)')
    .option('--ai', 'Use LLM for classification')
    .option('--grill', 'LLM 追问循环生成正文（需要交互式终端）')
    .action(async (content, options) => {
    // Check configuration
    if (!hasConfig()) {
        console.log(chalk.red('❌ 请先初始化: worklog init'));
        return;
    }
    if (!content) {
        console.log(chalk.yellow('请输入工作内容'));
        console.log(chalk.gray('用法: worklog log <内容>'));
        console.log(chalk.gray('示例: worklog log 完成了用户管理需求开发'));
        console.log(chalk.gray('LLM分类: worklog log --ai 今天做了用户管理需求'));
        return;
    }
    const config = getConfig();
    // Parse tags from options
    let tags = [];
    if (options.tags) {
        tags = options.tags.split(',').map(t => t.trim());
    }
    // Extract existing tags from content
    const contentTags = content.match(/#[\u4e00-\u9fa5a-zA-Z0-9_\/]+/g) || [];
    tags = [...tags, ...contentTags];
    // Determine classification method
    let entryType = options.type;
    let classificationContent = content;
    let classificationResult = null;
    let usedLLM = false;
    // Check for structured input (type prefix)
    const parsed = parseStructuredInput(content);
    if (parsed.type && !entryType) {
        entryType = parsed.type;
        classificationContent = parsed.content;
    }
    // Classify if type not specified
    if (!entryType) {
        const useLLM = options.ai || config.defaultMode === 'llm';
        usedLLM = useLLM && config.llmProvider !== 'none';
        if (usedLLM) {
            console.log(chalk.gray(`使用 ${LLM_PROVIDERS[config.llmProvider]?.name} 进行分类...`));
        }
        classificationResult = await classify(classificationContent, config, useLLM);
        entryType = classificationResult.type;
        if (classificationResult.suggestedTags) {
            tags = [...tags, ...classificationResult.suggestedTags];
        }
        console.log(chalk.gray(`分类结果: ${getTypeDisplayName(entryType)}`));
    }
    // Create entry - use LLM's title if available
    const entry = {
        type: entryType,
        title: classificationResult?.title || extractTitle(classificationContent),
        details: classificationResult?.details || classificationContent,
        tags: [...new Set(tags)], // Remove duplicates
    };
    // Optional grill follow-up
    let bodyContent = null;
    if (options.grill && usedLLM) {
        try {
            bodyContent = await grillFollowUp({
                type: entryType,
                title: entry.title,
                details: classificationContent,
                tags: [...new Set(tags)],
            }, config);
        }
        catch (err) {
            if (err.message === 'ABORT') {
                console.log(chalk.yellow('\n⚠️  已中断，不写入文件'));
                return;
            }
            throw err;
        }
    }
    else if (options.grill && !usedLLM) {
        console.log(chalk.yellow('⚠️  --grill 需要 --ai（或 defaultMode=llm），已忽略'));
    }
    // Save entry
    const dateInfo = getDateInfo();
    console.log(chalk.gray(`日期: ${dateInfo.date} | 周: ${dateInfo.week}`));
    try {
        const paths = await addEntryToDaily(config.kbPath, entry, bodyContent);
        // Update tags index
        if (entry.tags.length > 0) {
            await updateTagsIndex(config.kbPath, entry, dateInfo.date);
        }
        console.log(chalk.green('✅ 工作条目已记录'));
        console.log();
        console.log(chalk.blue('类型:'), getTypeDisplayName(entry.type));
        console.log(chalk.blue('标题:'), entry.title);
        if (usedLLM && entry.details !== classificationContent) {
            console.log(chalk.blue('详情:'), entry.details);
        }
        if (entry.tags.length > 0) {
            console.log(chalk.blue('标签:'), entry.tags.join(' '));
        }
        console.log(chalk.gray(`文件: ${paths.dailyPath}`));
    }
    catch (error) {
        console.log(chalk.red('❌ 记录失败'), error);
    }
});
/**
 * Extract title from content
 */
function extractTitle(content) {
    // Limit to 50 chars for title
    const clean = content.replace(/#[\u4e00-\u9fa5a-zA-Z0-9_\/]+/g, '').trim();
    if (clean.length <= 50)
        return clean;
    return clean.slice(0, 50) + '...';
}
//# sourceMappingURL=log.js.map