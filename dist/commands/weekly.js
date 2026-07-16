import { Command } from 'commander';
import chalk from 'chalk';
import { getConfig, hasConfig } from '../lib/config.js';
import { collectWeekEntries, generateWeeklyReport, generateWeeklyReportTxt, saveWeeklyReport } from '../lib/report.js';
import { formatChineseDate, formatChineseWeek } from '../utils/date.js';
export const weeklyCommand = new Command('weekly')
    .description('Generate weekly report')
    .option('-w, --week <week>', 'Specific week number (e.g., 2026-W18)')
    .option('-f, --format <format>', 'Output format: md or txt (default: md)', 'md')
    .action(async (options) => {
    // Check configuration
    if (!hasConfig()) {
        console.log(chalk.red('❌ 请先初始化: worklog init'));
        return;
    }
    // Validate format
    const format = options.format;
    if (format !== 'md' && format !== 'txt') {
        console.log(chalk.red('❌ 格式参数无效，请使用 md 或 txt'));
        return;
    }
    const config = getConfig();
    const week = options.week;
    console.log(chalk.blue('📊 生成周报'));
    console.log();
    try {
        // Collect entries
        const report = await collectWeekEntries(config.kbPath, week);
        console.log(chalk.gray(`周号: ${formatChineseWeek(report.weekNumber)}`));
        console.log(chalk.gray(`日期范围: ${formatChineseDate(report.startDate)} - ${formatChineseDate(report.endDate)}`));
        console.log(chalk.gray(`条目数量: ${report.entries.length}`));
        console.log(chalk.gray(`格式: ${format === 'txt' ? '纯文本' : 'Markdown'}`));
        console.log();
        if (report.entries.length === 0) {
            console.log(chalk.yellow('本周暂无工作记录'));
            return;
        }
        // Generate report based on format
        const content = format === 'txt'
            ? generateWeeklyReportTxt(report)
            : generateWeeklyReport(report);
        // Save to file
        const filePath = await saveWeeklyReport(config.kbPath, content, report.weekNumber, format);
        // Output to terminal
        console.log(content);
        console.log(chalk.gray('---'));
        console.log(chalk.green(`✅ 周报已保存: ${filePath}`));
    }
    catch (error) {
        console.log(chalk.red('❌ 生成周报失败'), error);
    }
});
//# sourceMappingURL=weekly.js.map