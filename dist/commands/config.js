import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { getConfig, hasConfig, updateConfig, setKbPath, setLLMProvider, setApiKey, LLM_PROVIDERS } from '../lib/config.js';
import { dirExists } from '../utils/fs.js';
export const configCommand = new Command('config')
    .description('View or update configuration')
    .option('-p, --path <path>', 'Set kb directory path')
    .option('--provider <provider>', 'Set LLM provider')
    .option('-k, --key <key>', 'Set API key')
    .option('--show', 'Show current configuration')
    .action(async (options) => {
    // Check configuration
    if (!hasConfig()) {
        console.log(chalk.red('❌ 请先初始化: worklog init'));
        return;
    }
    const currentConfig = getConfig();
    // Show mode
    if (options.show) {
        console.log(chalk.blue('📋 当前配置'));
        console.log();
        console.log(chalk.blue('知识库路径:'), currentConfig.kbPath);
        console.log(chalk.blue('LLM 提供商:'), LLM_PROVIDERS[currentConfig.llmProvider]?.name || '无');
        console.log(chalk.blue('默认模式:'), currentConfig.defaultMode);
        console.log(chalk.blue('API Key:'), currentConfig.apiKey ? '已设置' : '未设置');
        console.log(chalk.blue('创建时间:'), currentConfig.createdAt);
        console.log(chalk.blue('更新时间:'), currentConfig.updatedAt);
        return;
    }
    // Direct update mode
    if (options.path || options.provider || options.key) {
        if (options.path) {
            // Verify path exists
            if (!await dirExists(options.path)) {
                console.log(chalk.yellow('⚠️  目录不存在，请确保路径正确'));
            }
            setKbPath(options.path);
            console.log(chalk.green('✅ 知识库路径已更新'), options.path);
        }
        if (options.provider) {
            try {
                setLLMProvider(options.provider);
                console.log(chalk.green('✅ LLM 提供商已更新'), LLM_PROVIDERS[options.provider]?.name);
            }
            catch (error) {
                console.log(chalk.red('❌ 无效的提供商'), options.provider);
            }
        }
        if (options.key) {
            setApiKey(options.key);
            console.log(chalk.green('✅ API Key 已更新'));
        }
        return;
    }
    // Interactive mode
    const answers = await inquirer.prompt([
        {
            type: 'input',
            name: 'kbPath',
            message: '知识库路径',
            default: currentConfig.kbPath,
        },
        {
            type: 'list',
            name: 'llmProvider',
            message: 'LLM 提供商',
            choices: [
                { name: '无（仅使用规则分类）', value: 'none' },
                { name: 'OpenAI (GPT-4)', value: 'openai' },
                { name: 'Anthropic (Claude)', value: 'anthropic' },
                { name: 'Google Gemini', value: 'gemini' },
                { name: 'DeepSeek (国产)', value: 'deepseek' },
                { name: 'Ollama (本地模型)', value: 'ollama' },
            ],
            default: currentConfig.llmProvider,
        },
        {
            type: 'password',
            name: 'apiKey',
            message: 'API Key',
            when: (ans) => ans.llmProvider !== 'none' && ans.llmProvider !== 'ollama',
            mask: '*',
        },
        {
            type: 'list',
            name: 'defaultMode',
            message: '默认分类模式',
            choices: [
                { name: '规则分类（无 API 成本）', value: 'rule-based' },
                { name: 'LLM 分类（智能解析）', value: 'llm' },
            ],
            default: currentConfig.defaultMode,
        },
    ]);
    // Update configuration
    updateConfig({
        kbPath: answers.kbPath,
        llmProvider: answers.llmProvider,
        apiKey: answers.apiKey || currentConfig.apiKey,
        defaultMode: answers.defaultMode,
    });
    console.log(chalk.green('✅ 配置已更新'));
    console.log();
    console.log(chalk.blue('知识库路径:'), answers.kbPath);
    console.log(chalk.blue('LLM 提供商:'), LLM_PROVIDERS[answers.llmProvider]?.name || '无');
    console.log(chalk.blue('默认模式:'), answers.defaultMode);
});
//# sourceMappingURL=config.js.map