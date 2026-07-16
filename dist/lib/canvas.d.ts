/**
 * Canvas file structure for Obsidian
 */
export interface CanvasFile {
    nodes: CanvasNode[];
    edges: CanvasEdge[];
}
export interface CanvasNode {
    id: string;
    type: 'text' | 'file' | 'group';
    text?: string;
    file?: string;
    x: number;
    y: number;
    width: number;
    height: number;
    color: string;
}
export interface CanvasEdge {
    id: string;
    fromNode: string;
    fromSide: 'top' | 'bottom' | 'left' | 'right';
    toNode: string;
    toSide: 'top' | 'bottom' | 'left' | 'right';
}
/**
 * Generate canvas for backend API project
 */
export declare function generateBackendApiCanvas(projectName: string, framework: string, database?: string): CanvasFile;
/**
 * Generate canvas for frontend-backend separation project
 */
export declare function generateFrontendBackendCanvas(projectName: string, frontendFramework: string, backendFramework: string, database?: string): CanvasFile;
/**
 * Generate canvas for microservices project
 */
export declare function generateMicroservicesCanvas(projectName: string, services?: string[]): CanvasFile;
/**
 * Serialize canvas to JSON string
 */
export declare function serializeCanvas(canvas: CanvasFile): string;
//# sourceMappingURL=canvas.d.ts.map