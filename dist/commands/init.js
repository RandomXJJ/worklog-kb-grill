import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { ensureDir, getKbPaths, getDefaultKbPath, dirExists } from '../utils/fs.js';
import { initConfig, LLM_PROVIDERS } from '../lib/config.js';
import fs from 'fs/promises';
import path from 'path';
export const initCommand = new Command('init')
    .description('Initialize work log knowledge base')
    .option('-p, --path <path>', 'Custom kb directory path')
    .option('--provider <provider>', 'LLM provider (none, openai, anthropic, gemini, ollama)')
    .option('--key <key>', 'API key for LLM provider')
    .option('--skip-prompts', 'Skip interactive prompts, use defaults')
    .action(async (options) => {
    console.log(chalk.blue('🚀 初始化 Work-Log 知识库'));
    let kbPath = options.path;
    let llmProvider = 'none';
    let apiKey = options.key || '';
    // Validate and set provider from option
    const validProviders = ['none', 'openai', 'anthropic', 'gemini', 'deepseek', 'ollama'];
    if (options.provider && validProviders.includes(options.provider)) {
        llmProvider = options.provider;
    }
    // Interactive prompts if not skipped and provider not specified via option
    if (!options.skipPrompts && !options.provider) {
        const answers = await inquirer.prompt([
            {
                type: 'input',
                name: 'kbPath',
                message: '知识库存放路径',
                default: getDefaultKbPath(),
                when: !options.path,
            },
            {
                type: 'list',
                name: 'llmProvider',
                message: '选择 LLM 提供商（用于智能分类）',
                choices: [
                    { name: '无（仅使用规则分类）', value: 'none' },
                    { name: 'OpenAI (GPT-4)', value: 'openai' },
                    { name: 'Anthropic (Claude)', value: 'anthropic' },
                    { name: 'Google Gemini', value: 'gemini' },
                    { name: 'DeepSeek (国产)', value: 'deepseek' },
                    { name: 'Ollama (本地模型)', value: 'ollama' },
                ],
                default: 'none',
            },
            {
                type: 'password',
                name: 'apiKey',
                message: '输入 API Key',
                when: (ans) => ans.llmProvider !== 'none' && ans.llmProvider !== 'ollama' && !options.key,
                mask: '*',
            },
        ]);
        kbPath = kbPath || answers.kbPath;
        llmProvider = answers.llmProvider;
        apiKey = answers.apiKey || '';
    }
    // Use default path if still not set
    kbPath = kbPath || getDefaultKbPath();
    // Check if path already exists
    if (await dirExists(kbPath)) {
        console.log(chalk.yellow(`⚠️  目录已存在: ${kbPath}`));
        const confirm = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'continue',
                message: '继续初始化（将更新现有文件）？',
                default: true,
            },
        ]);
        if (!confirm.continue) {
            console.log(chalk.gray('初始化已取消'));
            return;
        }
    }
    // Create directory structure
    console.log(chalk.gray('创建目录结构...'));
    const paths = getKbPaths(kbPath);
    await ensureDir(paths.inbox);
    await ensureDir(paths.daily);
    await ensureDir(paths.weekly);
    await ensureDir(paths.monthly);
    await ensureDir(paths.tags);
    await ensureDir(paths.templates);
    // Create initial files
    console.log(chalk.gray('创建初始文件...'));
    // Tags index
    const tagsIndexPath = path.join(paths.tags, 'index.md');
    if (!await dirExists(tagsIndexPath)) {
        await fs.writeFile(tagsIndexPath, `# 标签索引

此文件自动维护，记录每个标签关联的日志条目。

`, 'utf-8');
    }
    // Tags dictionary
    const tagsDictPath = path.join(paths.tags, 'dictionary.md');
    if (!await dirExists(tagsDictPath)) {
        await fs.writeFile(tagsDictPath, `# 标签词典

定义常用标签及其含义。

## 项目类
- #中邮 - 中邮保险项目
- #保险师 - 保险师 APP

## 技术类
- #前端 - 前端开发
- #后端 - 后端开发
- #API - API 开发

`, 'utf-8');
    }
    // Tags synonyms
    const tagsSynonymsPath = path.join(paths.tags, 'synonyms.md');
    if (!await dirExists(tagsSynonymsPath)) {
        await fs.writeFile(tagsSynonymsPath, `# 标签同义词

记录标签的同义词映射。

`, 'utf-8');
    }
    // Templates - copy built-in templates to kb/templates/
    const templatesDir = path.join(paths.templates);
    // Daily log template
    await fs.writeFile(path.join(templatesDir, 'daily-log.md'), `---
title: "{{date}}"
date: "{{date}}"
tags:
  - diary
aliases:
  - 今天
---

# {{date}}

> [!todo] 今天要做的
> - [ ] 任务列表

> [!tip]+ 工作记录
> <!-- 使用 worklog log 或 worklog git 自动添加 -->

> [!note]- 笔记
> <!-- 随时记录的想法和学习点 -->

> [!warning] 明天继续
> <!-- 明日重点工作计划 -->

---

## 详细笔记

<!-- 补充详细描述，可使用 [[双向链接]] -->

## 今日总结

<!-- 重要的收获、问题 -->
`, 'utf-8');
    // Weekly summary template
    await fs.writeFile(path.join(templatesDir, 'weekly-summary.md'), `# 工作周报 - {{startDate}} - {{endDate}}（{{week}}）

> 自动生成周报，按分类汇总本周工作。

## 一、需求开发与上线

### 1.1 开发中需求

<!-- 本周进行中的需求开发 -->

### 1.2 已上线需求

<!-- 本周已上线的需求 -->

## 二、需求评审

<!-- 本周参与的需求评审 -->

## 三、技术设计

<!-- 本周完成的技术方案设计 -->

## 四、Bug 修复

<!-- 本周修复的 Bug -->

## 五、面试

<!-- 本周面试记录 -->

## 六、学习成长

<!-- 本周学习的新技术/知识 -->

## 七、下周计划

<!-- 下周重点工作计划 -->

## 八、风险与问题

<!-- 需要关注的风险或待解决问题 -->

---

**本周统计：**

| 类别 | 数量 |
|------|------|
| 需求开发 | {{devCount}} |
| 需求评审 | {{reviewCount}} |
| Bug 修复 | {{bugfixCount}} |
| 其他 | {{otherCount}} |
| **总计** | {{totalCount}} |
`, 'utf-8');
    // Monthly rollup template
    await fs.writeFile(path.join(templatesDir, 'monthly-rollup.md'), `# 工作月报 - {{month}}

> 本月工作总结，按分类汇总。

## 本月概览

<!-- 总体工作概述 -->

## 需求开发

<!-- 本月完成的需求开发 -->

## 技术设计

<!-- 本月的技术方案设计 -->

## Bug 修复

<!-- 本月修复的问题 -->

## 学习成长

<!-- 本月学习收获 -->

## 重要事项

<!-- 本月的重要事件、会议、决策 -->

## 下月计划

<!-- 下月重点工作规划 -->

---

## 本月统计

| 类别 | 数量 |
|------|------|
| 需求开发 | {{devCount}} |
| 上线发布 | {{releaseCount}} |
| 需求评审 | {{reviewCount}} |
| 技术设计 | {{designCount}} |
| Bug 修复 | {{bugfixCount}} |
| 面试 | {{interviewCount}} |
| 学习成长 | {{learnCount}} |
| 会议 | {{meetingCount}} |
| 其他 | {{otherCount}} |
| **总计** | {{totalCount}} |
`, 'utf-8');
    // Type guide template
    await fs.writeFile(path.join(templatesDir, 'type-guide.md'), `# 工作类型说明

本文档说明工作日志的分类体系和使用方法。

## 分类类型

| 类型 | 标识 | 使用场景 | 示例 |
|------|------|----------|------|
| 需求开发 | \`dev\` | 功能开发、代码编写 | 完成了用户管理登录API |
| 上线发布 | \`release\` | 版本上线、部署 | 上线了订单模块8.1.0 |
| 需求评审 | \`review\` | 需求评审、讨论 | 评审了支付模块需求 |
| 技术设计 | \`design\` | 方案设计、架构 | 设计了缓存优化方案 |
| Bug 修复 | \`bugfix\` | 问题修复 | 修复了登录验证Bug |
| 数据修复 | \`datafix\` | 数据问题处理 | 修复了订单数据异常 |
| 面试 | \`interview\` | 面试记录 | 静试了前端候选人 |
| 学习成长 | \`learn\` | 技术学习 | 学习了 React Hooks |
| 会议 | \`meeting\` | 会议记录 | 参加了项目启动会 |
| 其他 | \`other\` | 其他事项 | 处理了行政事务 |

## 使用方法

### CLI 命令行

\`\`\`bash
# 结构化输入
worklog dev 完成了用户管理API开发
worklog review 评审了订单需求

# 自然语言（使用 LLM 分类）
worklog log --ai 今天做了用户管理需求，下午评审了订单
\`\`\`

## 标签使用

使用 \`#标签\` 格式标记项目和技能：

- 项目标签：\`#中邮\`、\`#保险师\`、\`#订单中心\`
- 技术标签：\`#React\`、\`#API\`、\`#前端\`
- 业务标签：\`#录单\`、\`#理赔\`

示例：
\`\`\`
worklog dev 完成了用户管理API #中邮 #订单中心
\`\`\`

## 周报生成

每周五运行：
\`\`\`bash
worklog weekly
\`\`\`

系统自动汇总本周记录，生成格式化周报。
`, 'utf-8');
    // Save configuration
    console.log(chalk.gray('保存配置...'));
    initConfig({
        kbPath,
        llmProvider,
        apiKey,
        defaultMode: llmProvider === 'none' ? 'rule-based' : 'llm',
    });
    console.log(chalk.green('✅ 知识库初始化完成'));
    console.log();
    console.log(chalk.blue('📁 知识库路径:'), kbPath);
    console.log(chalk.blue('🤖 LLM 提供商:'), LLM_PROVIDERS[llmProvider]?.name || '无');
    console.log();
    console.log(chalk.gray('下一步:'));
    console.log(chalk.gray('  worklog log 完成了用户管理需求开发'));
    console.log(chalk.gray('  worklog weekly  # 生成周报'));
});
//# sourceMappingURL=init.js.map