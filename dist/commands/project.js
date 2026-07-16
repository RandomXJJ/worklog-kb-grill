import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { getConfig } from '../lib/config.js';
import { analyzeProject } from '../lib/analyzer.js';
import { ensureDir, readFileSafe } from '../utils/fs.js';
import { getDateInfo } from '../utils/date.js';
import { generateBackendApiCanvas, generateFrontendBackendCanvas, serializeCanvas, } from '../lib/canvas.js';
import fs from 'fs/promises';
import path from 'path';
export const projectCommand = new Command('project')
    .description('Generate project documentation from code analysis')
    .option('-p, --path <path>', 'Project directory path (default: current directory)')
    .option('-f, --force', 'Force overwrite existing project file')
    .option('--simple', 'Generate simple documentation only')
    .option('--canvas', 'Generate architecture canvas file')
    .action(async (options) => {
    const config = getConfig();
    if (!config.kbPath) {
        console.log(chalk.red('错误: 请先运行 worklog init 初始化知识库'));
        return;
    }
    const projectDir = options.path ? path.resolve(options.path) : process.cwd();
    const projectName = path.basename(projectDir);
    const dateInfo = getDateInfo();
    console.log(chalk.blue('🔍 分析项目代码库'));
    console.log(chalk.gray('项目目录: ' + projectDir));
    console.log();
    // Check if project file exists
    const projectsDir = path.join(config.kbPath, 'projects');
    await ensureDir(projectsDir);
    const projectFilePath = path.join(projectsDir, projectName + '.md');
    const existingContent = await readFileSafe(projectFilePath);
    if (existingContent && !options.force) {
        const answer = await inquirer.prompt([
            {
                type: 'list',
                name: 'action',
                message: '项目文档已存在，请选择操作',
                choices: [
                    { name: '快速更新 - 只更新基本信息和技术栈', value: 'quick' },
                    { name: '完整同步 - 重新分析 API、结构', value: 'full' },
                    { name: '取消操作', value: 'cancel' },
                ],
            },
        ]);
        if (answer.action === 'cancel') {
            console.log(chalk.yellow('操作已取消'));
            return;
        }
        options.simple = answer.action === 'quick';
    }
    // Analyze project
    console.log(chalk.gray('正在分析项目...'));
    const analysis = await analyzeProject(projectDir);
    console.log();
    console.log(chalk.bold('分析结果:'));
    console.log(chalk.gray('  语言: ' + analysis.language));
    console.log(chalk.gray('  框架: ' + analysis.framework));
    console.log(chalk.gray('  技术栈: ' + analysis.techStack.join(', ')));
    console.log(chalk.gray('  API 接口: ' + analysis.apiRoutes.length + ' 个'));
    console.log(chalk.gray('  关键文件: ' + analysis.keyFiles.length + ' 个'));
    console.log();
    // Generate documentation
    const docContent = generateProjectDoc(analysis, projectDir, dateInfo.date, options.simple);
    // Write file
    await fs.writeFile(projectFilePath, docContent, 'utf-8');
    console.log(chalk.green('✅ 项目文档已生成'));
    console.log();
    console.log(chalk.gray('文件: kb/projects/' + projectName + '.md'));
    console.log(chalk.gray('可在 Obsidian 中查看反向链接'));
    // Generate canvas if requested
    if (options.canvas) {
        console.log();
        console.log(chalk.blue('📊 生成架构画布'));
        const canvasFilePath = path.join(projectsDir, projectName + '.canvas');
        const canvas = generateCanvasForProject(analysis);
        const canvasContent = serializeCanvas(canvas);
        await fs.writeFile(canvasFilePath, canvasContent, 'utf-8');
        console.log(chalk.green('✅ 架构画布已生成'));
        console.log(chalk.gray('文件: kb/projects/' + projectName + '.canvas'));
        console.log(chalk.gray('可在 Obsidian Canvas 中查看'));
    }
});
/**
 * Generate project documentation content
 */
function generateProjectDoc(analysis, projectDir, date, simple) {
    const lines = [];
    // Frontmatter
    lines.push('---');
    lines.push('title: "' + analysis.name + '"');
    lines.push('date: "' + date + '"');
    lines.push('tags:');
    lines.push('  - project');
    lines.push('aliases:');
    lines.push('  - ' + analysis.name);
    lines.push('---');
    lines.push('');
    lines.push('# ' + analysis.name);
    lines.push('');
    lines.push(analysis.description || '项目代码库');
    lines.push('');
    lines.push('**Location:** `' + projectDir + '`');
    lines.push('');
    // Tech stack
    lines.push('> [!abstract] 技术栈');
    if (analysis.techStack.length > 0) {
        for (const tech of analysis.techStack) {
            lines.push('> - ' + tech);
        }
    }
    else {
        lines.push('> - ' + analysis.language);
        if (analysis.framework) {
            lines.push('> - ' + analysis.framework);
        }
    }
    lines.push('');
    // Directory structure (only for full mode)
    if (!simple && analysis.structure) {
        lines.push('> [!info] 目录结构');
        lines.push('> ```');
        for (const line of analysis.structure.split('\n')) {
            lines.push('> ' + line);
        }
        lines.push('> ```');
        lines.push('');
    }
    // API routes (only for full mode)
    if (!simple && analysis.apiRoutes.length > 0) {
        lines.push('> [!example] API 接口');
        lines.push('> | 方法 | 路径 | 说明 |');
        lines.push('> |------|------|------|');
        for (const route of analysis.apiRoutes) {
            lines.push('> | ' + route.method + ' | ' + route.path + ' | ' + (route.description || '') + ' |');
        }
        lines.push('');
    }
    else if (!simple) {
        lines.push('> [!example] API 接口');
        lines.push('> (未检测到 API 路由)');
        lines.push('');
    }
    // Key files
    if (analysis.keyFiles.length > 0) {
        lines.push('> [!tip] 关键文件');
        lines.push('> | 文件 | 作用 |');
        lines.push('> |------|------|');
        for (const file of analysis.keyFiles) {
            lines.push('> | ' + file.path + ' | ' + file.description + ' |');
        }
        lines.push('');
    }
    // Development guide
    lines.push('> [!success] 开发指引');
    if (analysis.startCommand) {
        lines.push('> **本地启动：**');
        lines.push('> ```bash');
        lines.push('> ' + analysis.startCommand);
        lines.push('> ```');
        lines.push('>');
    }
    if (analysis.testCommand) {
        lines.push('> **运行测试：**');
        lines.push('> ```bash');
        lines.push('> ' + analysis.testCommand);
        lines.push('> ```');
        lines.push('>');
    }
    lines.push('');
    // Notes section
    lines.push('> [!note]+ 笔记');
    lines.push('> - 重要决策、踩坑记录');
    lines.push('> - 可从日记反向链接查看开发历程');
    return lines.join('\n');
}
/**
 * Generate canvas for project based on analysis
 */
function generateCanvasForProject(analysis) {
    const techStack = analysis.techStack;
    // Detect frontend frameworks
    const frontendFrameworks = ['React', 'Vue', 'Next.js', 'Gatsby', 'Angular', 'Svelte'];
    const backendFrameworks = ['Express', 'NestJS', 'Koa', 'Fastify', 'Gin', 'Echo', 'Fiber', 'Django', 'Flask', 'FastAPI'];
    const hasFrontend = techStack.some(t => frontendFrameworks.includes(t));
    const hasBackend = techStack.some(t => backendFrameworks.includes(t));
    const projectName = analysis.name;
    const framework = analysis.framework || 'Unknown';
    // Detect database from tech stack
    let database = 'Database';
    if (techStack.some(t => t.toLowerCase().includes('postgres')))
        database = 'PostgreSQL';
    else if (techStack.some(t => t.toLowerCase().includes('mysql')))
        database = 'MySQL';
    else if (techStack.some(t => t.toLowerCase().includes('mongo')))
        database = 'MongoDB';
    else if (techStack.some(t => t.toLowerCase().includes('redis')))
        database = 'Redis';
    // Determine canvas type
    if (hasFrontend && hasBackend) {
        // Frontend-Backend separation
        const frontendFramework = techStack.find(t => frontendFrameworks.includes(t)) || 'Frontend';
        const backendFramework = techStack.find(t => backendFrameworks.includes(t)) || 'Backend';
        return generateFrontendBackendCanvas(projectName, frontendFramework, backendFramework, database);
    }
    else if (hasBackend) {
        // Backend API project
        return generateBackendApiCanvas(projectName, framework, database);
    }
    else if (hasFrontend) {
        // Frontend-only project (use frontend-backend with minimal backend)
        return generateFrontendBackendCanvas(projectName, framework, 'API Server', database);
    }
    else {
        // Default: Backend API canvas
        return generateBackendApiCanvas(projectName, framework, database);
    }
}
//# sourceMappingURL=project.js.map