import { Command } from 'commander';
import chalk from 'chalk';
import { getConfig, hasConfig } from '../lib/config.js';
import { collectMonthEntries, generateMonthlyReport, generateMonthlyReportTxt, saveMonthlyReport } from '../lib/report.js';
import { getDateInfo } from '../utils/date.js';
export const monthlyCommand = new Command('monthly')
    .description('Generate monthly report')
    .option('-m, --month <month>', 'Specific month (e.g., 2026-04)')
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
    const month = options.month || getDateInfo().month;
    console.log(chalk.blue('📊 生成月报'));
    console.log();
    try {
        // Collect entries
        const report = await collectMonthEntries(config.kbPath, month);
        console.log(chalk.gray(`月份: ${month}`));
        console.log(chalk.gray(`条目数量: ${report.entries.length}`));
        console.log(chalk.gray(`格式: ${format === 'txt' ? '纯文本' : 'Markdown'}`));
        console.log();
        if (report.entries.length === 0) {
            console.log(chalk.yellow('本月暂无工作记录'));
            return;
        }
        // Generate report based on format
        const content = format === 'txt'
            ? generateMonthlyReportTxt(report)
            : generateMonthlyReport(report);
        // Save to file
        const filePath = await saveMonthlyReport(config.kbPath, content, month, format);
        // Output to terminal
        console.log(content);
        console.log(chalk.gray('---'));
        console.log(chalk.green(`✅ 月报已保存: ${filePath}`));
    }
    catch (error) {
        console.log(chalk.red('❌ 生成月报失败'), error);
    }
});
//# sourceMappingURL=monthly.js.map