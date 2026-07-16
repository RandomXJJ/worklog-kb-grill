/**
 * Project analysis result
 */
export interface ProjectAnalysis {
    name: string;
    description: string;
    language: string;
    framework: string;
    techStack: string[];
    structure: string;
    apiRoutes: Array<{
        method: string;
        path: string;
        description: string;
    }>;
    keyFiles: Array<{
        path: string;
        description: string;
    }>;
    startCommand: string;
    testCommand: string;
}
/**
 * Analyze project directory
 */
export declare function analyzeProject(projectDir: string): Promise<ProjectAnalysis>;
//# sourceMappingURL=analyzer.d.ts.map