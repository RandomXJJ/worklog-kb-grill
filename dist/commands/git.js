import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { isGitRepository, getTodayCommits, inferProjectName, formatCommitMessage, extractCommitContent, getCurrentBranch, } from '../lib/git.js';
import { addEntryToDaily, updateTagsIndex } from '../lib/storage.js';
import { getConfig } from '../lib/config.js';
import { getDateInfo } from '../utils/date.js';
export const gitCommand = new Command('git')
    .description('Extract today\'s git commits and record as work entries')
    .option('-a, --all', 'Include all commits without selection')
    .option('--project <project>', 'Specify project name manually')
    .action(async (options) => {
    const config = getConfig();
    if (!config.kbPath) {
        console.log(chalk.red('错误: 请先运行 worklog init 初始化知识库'));
        return;
    }
    // Check if in git repository
    if (!isGitRepository()) {
        console.log(chalk.yellow('当前目录不是 git 仓库，无法提取提交记录'));
        console.log(chalk.gray('请在项目目录中运行此命令'));
        return;
    }
    console.log(chalk.blue('📦 提取今日 git 提交...'));
    console.log();
    // Get today's commits
    const commits = getTodayCommits();
    if (commits.length === 0) {
        console.log(chalk.yellow('今日没有 git 提交记录'));
        console.log(chalk.gray('使用 worklog log 命令手动记录工作'));
        return;
    }
    // Show current branch
    const branch = getCurrentBranch();
    if (branch) {
        console.log(chalk.gray(`当前分支: ${branch}`));
    }
    // Infer project name
    const projectName = options.project || inferProjectName();
    console.log(chalk.gray(`项目: ${projectName}`));
    console.log();
    // Display commits
    console.log(chalk.bold('今日提交记录:'));
    commits.forEach((commit, index) => {
        console.log(chalk.gray(`  ${index + 1}. ${formatCommitMessage(commit)}`));
    });
    console.log();
    // Select commits to record
    let selectedCommits = [];
    if (options.all) {
        selectedCommits = commits;
    }
    else {
        const answer = await inquirer.prompt([
            {
                type: 'checkbox',
                name: 'selected',
                message: '选择要记录的提交',
                choices: commits.map((commit, index) => ({
                    name: formatCommitMessage(commit),
                    value: index,
                    checked: true,
                })),
            },
        ]);
        selectedCommits = commits.filter((_, index) => answer.selected.includes(index));
    }
    if (selectedCommits.length === 0) {
        console.log(chalk.yellow('未选择任何提交'));
        return;
    }
    // Ask for additional work (skip if --all)
    let additionalWork = [];
    if (!options.all) {
        const additionalAnswer = await inquirer.prompt([
            {
                type: 'input',
                name: 'additional',
                message: '其他工作（会议、Code Review 等，逗号分隔）',
                default: '',
            },
        ]);
        additionalWork = additionalAnswer.additional
            .split(',')
            .map((s) => s.trim())
            .filter((s) => s.length > 0);
    }
    // Combine commits and additional work
    const dateInfo = getDateInfo();
    const entries = [];
    // Add commits as dev entries
    for (const commit of selectedCommits) {
        const content = extractCommitContent(commit.message);
        const entry = {
            type: 'dev',
            title: content,
            details: content,
            tags: [`#${projectName}`],
            projectName: projectName,
        };
        entries.push(entry);
    }
    // Add additional work (classify by keywords)
    for (const work of additionalWork) {
        const entry = {
            type: classifyWork(work),
            title: work,
            details: work,
            tags: [],
        };
        entries.push(entry);
    }
    // Write entries
    console.log();
    console.log(chalk.blue('📝 写入工作记录...'));
    for (const entry of entries) {
        await addEntryToDaily(config.kbPath, entry);
        await updateTagsIndex(config.kbPath, entry, dateInfo.date);
    }
    console.log(chalk.green(`✅ 已记录 ${entries.length} 条工作`));
    console.log();
    // Display recorded entries
    console.log(chalk.bold('今日工作:'));
    entries.forEach((entry) => {
        const projectTag = entry.tags.find((t) => t.startsWith('#') && t !== '#项目');
        const projectLink = projectTag ? ` [[${projectTag.substring(1)}]]` : '';
        console.log(chalk.gray(`  - ${entry.title}${projectLink}`));
    });
    console.log();
    console.log(chalk.gray(`日记文件: kb/daily/${dateInfo.date}.md`));
});
/**
 * Classify additional work by keywords
 */
function classifyWork(work) {
    const keywords = {
        dev: ['完成', '开发', '实现', '编写', '做了'],
        release: ['上线', '发布', '部署', '灰度'],
        review: ['评审', '过需求', '需求评审'],
        design: ['设计', '方案', '架构'],
        bugfix: ['修复', '排查', '解决', 'Bug'],
        datafix: ['数据修复', '数据修正'],
        interview: ['面试', '候选人'],
        learn: ['学习', '研究', '了解'],
        meeting: ['开会', '会议', '同步', '对齐', '周会', '周报', 'Code Review'],
        other: [],
    };
    for (const [type, words] of Object.entries(keywords)) {
        if (words.some((word) => work.includes(word))) {
            return type;
        }
    }
    return 'other';
}
//# sourceMappingURL=git.js.map