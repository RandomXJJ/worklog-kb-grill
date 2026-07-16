import fs from 'fs/promises';
import path from 'path';
/**
 * Analyze project directory
 */
export async function analyzeProject(projectDir) {
    const name = path.basename(projectDir);
    const analysis = {
        name,
        description: '',
        language: '',
        framework: '',
        techStack: [],
        structure: '',
        apiRoutes: [],
        keyFiles: [],
        startCommand: '',
        testCommand: '',
    };
    // Detect language and framework
    await detectTechStack(projectDir, analysis);
    // Scan directory structure
    analysis.structure = await scanDirectoryStructure(projectDir);
    // Extract API routes
    analysis.apiRoutes = await extractAPIRoutes(projectDir, analysis.language);
    // Find key files
    analysis.keyFiles = await findKeyFiles(projectDir);
    return analysis;
}
/**
 * Detect technology stack from config files
 */
async function detectTechStack(dir, analysis) {
    // Check package.json (Node.js/JavaScript/TypeScript)
    const packageJsonPath = path.join(dir, 'package.json');
    try {
        const packageJson = await fs.readFile(packageJsonPath, 'utf-8');
        const pkg = JSON.parse(packageJson);
        analysis.language = 'JavaScript/TypeScript';
        analysis.description = pkg.description || '';
        // Detect framework
        const deps = { ...pkg.dependencies, ...pkg.devDependencies };
        if (deps.react || deps['react-dom']) {
            analysis.framework = 'React';
        }
        else if (deps.vue) {
            analysis.framework = 'Vue';
        }
        else if (deps.next) {
            analysis.framework = 'Next.js';
        }
        else if (deps.express) {
            analysis.framework = 'Express';
        }
        else if (deps.nestjs || deps['@nestjs/core']) {
            analysis.framework = 'NestJS';
        }
        else if (deps.koa) {
            analysis.framework = 'Koa';
        }
        else if (deps.fastify) {
            analysis.framework = 'Fastify';
        }
        else if (deps.gatsby) {
            analysis.framework = 'Gatsby';
        }
        // Build tech stack
        analysis.techStack = [];
        if (deps.typescript)
            analysis.techStack.push('TypeScript');
        if (analysis.framework)
            analysis.techStack.push(analysis.framework);
        if (deps.tailwindcss)
            analysis.techStack.push('Tailwind CSS');
        if (deps.vite)
            analysis.techStack.push('Vite');
        if (deps.webpack)
            analysis.techStack.push('Webpack');
        if (deps.eslint)
            analysis.techStack.push('ESLint');
        if (deps.prettier)
            analysis.techStack.push('Prettier');
        // Extract commands
        if (pkg.scripts) {
            if (pkg.scripts.dev)
                analysis.startCommand = 'npm run dev';
            else if (pkg.scripts.start)
                analysis.startCommand = 'npm start';
            else if (pkg.scripts.serve)
                analysis.startCommand = 'npm run serve';
            else
                analysis.startCommand = 'npm install && npm run dev';
            if (pkg.scripts.test)
                analysis.testCommand = 'npm test';
            else
                analysis.testCommand = 'npm test';
        }
    }
    catch {
        // No package.json, check other files
    }
    // Check go.mod (Go)
    const goModPath = path.join(dir, 'go.mod');
    try {
        const goMod = await fs.readFile(goModPath, 'utf-8');
        analysis.language = 'Go';
        analysis.techStack.push('Go');
        // Detect Go framework
        const goFiles = await scanGoFiles(dir);
        if (goFiles.some(f => f.includes('gin.'))) {
            analysis.framework = 'Gin';
        }
        else if (goFiles.some(f => f.includes('echo.'))) {
            analysis.framework = 'Echo';
        }
        else if (goFiles.some(f => f.includes('fiber.'))) {
            analysis.framework = 'Fiber';
        }
        analysis.startCommand = 'go run main.go';
        analysis.testCommand = 'go test ./...';
    }
    catch {
        // No go.mod
    }
    // Check requirements.txt or pyproject.toml (Python)
    const requirementsPath = path.join(dir, 'requirements.txt');
    const pyprojectPath = path.join(dir, 'pyproject.toml');
    try {
        const requirements = await fs.readFile(requirementsPath, 'utf-8');
        analysis.language = 'Python';
        analysis.techStack.push('Python');
        const lines = requirements.split('\n');
        if (lines.some(l => l.includes('django'))) {
            analysis.framework = 'Django';
        }
        else if (lines.some(l => l.includes('flask'))) {
            analysis.framework = 'Flask';
        }
        else if (lines.some(l => l.includes('fastapi'))) {
            analysis.framework = 'FastAPI';
        }
        analysis.startCommand = 'python main.py';
        analysis.testCommand = 'pytest';
    }
    catch {
        // Check pyproject.toml
        try {
            const pyproject = await fs.readFile(pyprojectPath, 'utf-8');
            analysis.language = 'Python';
            analysis.techStack.push('Python');
            if (pyproject.includes('django'))
                analysis.framework = 'Django';
            else if (pyproject.includes('flask'))
                analysis.framework = 'Flask';
            else if (pyproject.includes('fastapi'))
                analysis.framework = 'FastAPI';
        }
        catch {
            // No Python files
        }
    }
}
/**
 * Scan Go source files
 */
async function scanGoFiles(dir) {
    const files = [];
    try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
            if (entry.isDirectory() && !entry.name.startsWith('.')) {
                const subFiles = await scanGoFiles(path.join(dir, entry.name));
                files.push(...subFiles);
            }
            else if (entry.isFile() && entry.name.endsWith('.go')) {
                const content = await fs.readFile(path.join(dir, entry.name), 'utf-8');
                files.push(content);
            }
        }
    }
    catch {
        // Ignore errors
    }
    return files;
}
/**
 * Scan directory structure (2-3 levels)
 */
async function scanDirectoryStructure(dir, depth = 3) {
    const lines = [];
    async function scan(currentDir, prefix, currentDepth) {
        if (currentDepth > depth)
            return;
        try {
            const entries = await fs.readdir(currentDir, { withFileTypes: true });
            const filtered = entries.filter(e => !e.name.startsWith('.') &&
                e.name !== 'node_modules' &&
                e.name !== 'vendor' &&
                e.name !== 'dist' &&
                e.name !== 'build');
            for (const entry of filtered) {
                const fullName = entry.isDirectory() ? `${entry.name}/` : entry.name;
                lines.push(`${prefix}${fullName}`);
                if (entry.isDirectory()) {
                    await scan(path.join(currentDir, entry.name), prefix + '  ', currentDepth + 1);
                }
            }
        }
        catch {
            // Ignore errors
        }
    }
    await scan(dir, '', 1);
    return lines.join('\n');
}
/**
 * Extract API routes from source files
 */
async function extractAPIRoutes(dir, language) {
    const routes = [];
    // For Node.js/Express
    if (language === 'JavaScript/TypeScript') {
        const routeFiles = await findRouteFiles(dir, ['route', 'router', 'api', 'controller']);
        for (const file of routeFiles) {
            try {
                const content = await fs.readFile(file, 'utf-8');
                // Express patterns
                const expressPatterns = [
                    /app\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/g,
                    /router\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/g,
                ];
                for (const pattern of expressPatterns) {
                    let match;
                    while ((match = pattern.exec(content)) !== null) {
                        routes.push({
                            method: match[1].toUpperCase(),
                            path: match[2],
                            description: '',
                        });
                    }
                }
            }
            catch {
                // Ignore errors
            }
        }
    }
    // For Go
    if (language === 'Go') {
        const goFiles = await findGoFiles(dir);
        for (const file of goFiles) {
            try {
                const content = await fs.readFile(file, 'utf-8');
                // Gin patterns
                const ginPattern = /r\.(GET|POST|PUT|DELETE|PATCH)\s*\(\s*["`']([^"`']+)["`']/g;
                let match;
                while ((match = ginPattern.exec(content)) !== null) {
                    routes.push({
                        method: match[1],
                        path: match[2],
                        description: '',
                    });
                }
            }
            catch {
                // Ignore errors
            }
        }
    }
    return routes;
}
/**
 * Find route/handler files
 */
async function findRouteFiles(dir, keywords) {
    const files = [];
    async function scan(currentDir) {
        try {
            const entries = await fs.readdir(currentDir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(currentDir, entry.name);
                if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
                    await scan(fullPath);
                }
                else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.js'))) {
                    if (keywords.some(k => entry.name.toLowerCase().includes(k))) {
                        files.push(fullPath);
                    }
                }
            }
        }
        catch {
            // Ignore errors
        }
    }
    await scan(dir);
    return files;
}
/**
 * Find Go files
 */
async function findGoFiles(dir) {
    const files = [];
    async function scan(currentDir) {
        try {
            const entries = await fs.readdir(currentDir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(currentDir, entry.name);
                if (entry.isDirectory() && !entry.name.startsWith('.')) {
                    await scan(fullPath);
                }
                else if (entry.isFile() && entry.name.endsWith('.go')) {
                    files.push(fullPath);
                }
            }
        }
        catch {
            // Ignore errors
        }
    }
    await scan(dir);
    return files;
}
/**
 * Find key files (entry points, configs, core modules)
 */
async function findKeyFiles(dir) {
    const keyFiles = [];
    // Common entry points
    const entryPoints = [
        { name: 'main.go', description: '服务入口' },
        { name: 'index.ts', description: '入口文件' },
        { name: 'index.js', description: '入口文件' },
        { name: 'app.ts', description: '应用入口' },
        { name: 'app.js', description: '应用入口' },
        { name: 'server.ts', description: '服务器入口' },
        { name: 'server.js', description: '服务器入口' },
        { name: 'main.py', description: 'Python 入口' },
        { name: 'app.py', description: 'Flask/Django 入口' },
    ];
    for (const entry of entryPoints) {
        const filePath = path.join(dir, entry.name);
        try {
            await fs.access(filePath);
            keyFiles.push({ path: entry.name, description: entry.description });
        }
        catch {
            // File doesn't exist
        }
    }
    // Config files
    const configs = [
        { name: 'config.yaml', description: '配置文件' },
        { name: 'config.json', description: '配置文件' },
        { name: '.env.example', description: '环境变量示例' },
        { name: 'docker-compose.yml', description: 'Docker 配置' },
    ];
    for (const config of configs) {
        const filePath = path.join(dir, config.name);
        try {
            await fs.access(filePath);
            keyFiles.push({ path: config.name, description: config.description });
        }
        catch {
            // File doesn't exist
        }
    }
    return keyFiles;
}
//# sourceMappingURL=analyzer.js.map