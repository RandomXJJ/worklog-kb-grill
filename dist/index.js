#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import { initCommand } from './commands/init.js';
import { logCommand } from './commands/log.js';
import { gitCommand } from './commands/git.js';
import { projectCommand } from './commands/project.js';
import { archiveCommand } from './commands/archive.js';
import { weeklyCommand } from './commands/weekly.js';
import { monthlyCommand } from './commands/monthly.js';
import { configCommand } from './commands/config.js';
import { statusCommand } from './commands/status.js';
const program = new Command();
program
    .name('worklog')
    .description('CLI tool for personal work log knowledge base')
    .version('1.0.0');
// Register commands
program.addCommand(initCommand);
program.addCommand(logCommand);
program.addCommand(gitCommand);
program.addCommand(projectCommand);
program.addCommand(archiveCommand);
program.addCommand(weeklyCommand);
program.addCommand(monthlyCommand);
program.addCommand(configCommand);
program.addCommand(statusCommand);
// Default action when no command provided
program.action(() => {
    console.log(chalk.blue('Work-Log KB - 个人工作日志知识库工具'));
    console.log();
    console.log('用法:');
    console.log('  worklog init        初始化知识库');
    console.log('  worklog log <内容>  记录工作条目');
    console.log('  worklog git         提取今日 git 提交');
    console.log('  worklog project     生成项目文档');
    console.log('  worklog archive     整理笔记到资源库');
    console.log('  worklog weekly      生成周报');
    console.log('  worklog monthly     生成月报');
    console.log('  worklog config      配置设置');
    console.log('  worklog status      查看状态');
    console.log();
    console.log(chalk.gray('使用 --help 查看详细帮助'));
});
program.parse();
//# sourceMappingURL=index.js.map