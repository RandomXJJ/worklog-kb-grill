import { Command } from 'commander';
import chalk from 'chalk';
import { getConfig, hasConfig, LLM_PROVIDERS } from '../lib/config.js';
import { getTodayEntriesCount, getWeekEntriesCount, getMonthEntriesCount } from '../lib/storage.js';
import { dirExists, getKbPaths } from '../utils/fs.js';
import { getDateInfo } from '../utils/date.js';
export const statusCommand = new Command('status')
    .description('Show work log status')
    .action(async () => {
    console.log(chalk.blue('📈 Work-Log 状态'));
    // Check configuration
    if (!hasConfig()) {
        console.log();
        console.log(chalk.yellow('⚠️  未初始化'));
        console.log(chalk.gray('请运行: worklog init'));
        return;
    }
    const config = getConfig();
    const dateInfo = getDateInfo();
    console.log();
    console.log(chalk.blue('知识库路径:'), config.kbPath);
    console.log(chalk.blue('路径状态:'), await dirExists(config.kbPath) ? chalk.green('✓ 存在') : chalk.red('✗ 不存在'));
    console.log();
    console.log(chalk.blue('LLM 配置:'));
    console.log(`  提供商: ${LLM_PROVIDERS[config.llmProvider]?.name || '无'}`);
    console.log(`  默认模式: ${config.defaultMode}`);
    console.log(`  API Key: ${config.apiKey ? '已设置' : '未设置'}`);
    console.log();
    // Count entries
    if (await dirExists(config.kbPath)) {
        console.log(chalk.blue('条目统计:'));
        console.log(`  今日 (${dateInfo.date}): ${await getTodayEntriesCount(config.kbPath)} 条`);
        console.log(`  本周 (${dateInfo.week}): ${await getWeekEntriesCount(config.kbPath, dateInfo.week)} 条`);
        console.log(`  本月 (${dateInfo.month}): ${await getMonthEntriesCount(config.kbPath, dateInfo.month)} 条`);
        console.log();
        // Show kb structure
        const paths = getKbPaths(config.kbPath);
        console.log(chalk.blue('目录结构:'));
        console.log(`  inbox/   ${await dirExists(paths.inbox) ? '✓' : '✗'}`);
        console.log(`  daily/   ${await dirExists(paths.daily) ? '✓' : '✗'}`);
        console.log(`  weekly/  ${await dirExists(paths.weekly) ? '✓' : '✗'}`);
        console.log(`  monthly/ ${await dirExists(paths.monthly) ? '✓' : '✗'}`);
        console.log(`  tags/    ${await dirExists(paths.tags) ? '✓' : '✗'}`);
    }
    console.log();
    console.log(chalk.gray('快速操作:'));
    console.log(chalk.gray('  worklog log <内容>  记录工作'));
    console.log(chalk.gray('  worklog weekly      生成周报'));
    console.log(chalk.gray('  worklog config      修改配置'));
});
//# sourceMappingURL=status.js.map