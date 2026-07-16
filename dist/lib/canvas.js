/**
 * Color palette for canvas nodes
 */
const COLORS = {
    title: '0', // Gray
    entry: '1', // Red - Entry/Core
    api: '5', // Cyan - API/Network
    data: '3', // Yellow - Data/Database
    ui: '4', // Green - UI/Frontend
    cache: '2', // Orange - Cache/Messaging
    label: '6', // Purple - Layer labels
};
/**
 * Generate canvas for backend API project
 */
export function generateBackendApiCanvas(projectName, framework, database = 'Database') {
    const nodes = [
        // Title
        {
            id: 'title',
            type: 'text',
            text: '# ' + projectName + ' Architecture',
            x: 100,
            y: -500,
            width: 400,
            height: 80,
            color: COLORS.title,
        },
        // Entry layer label
        {
            id: 'label_entry',
            type: 'text',
            text: '**入口层**',
            x: -40,
            y: -350,
            width: 180,
            height: 60,
            color: COLORS.label,
        },
        // Client node
        {
            id: 'client',
            type: 'text',
            text: '## 客户端\n\nWeb / App / Mobile\nHTTP 请求',
            x: 200,
            y: -360,
            width: 340,
            height: 120,
            color: COLORS.ui,
        },
        // API layer label
        {
            id: 'label_api',
            type: 'text',
            text: '**API 层**',
            x: -40,
            y: -150,
            width: 180,
            height: 60,
            color: COLORS.label,
        },
        // API node
        {
            id: 'api',
            type: 'text',
            text: '## API 服务\n\n' + framework + '\n路由 / Handler / 中间件',
            x: 200,
            y: -160,
            width: 340,
            height: 120,
            color: COLORS.api,
        },
        // Data layer label
        {
            id: 'label_data',
            type: 'text',
            text: '**数据层**',
            x: -40,
            y: 50,
            width: 180,
            height: 60,
            color: COLORS.label,
        },
        // Database node
        {
            id: 'db',
            type: 'text',
            text: '## 数据库\n\n' + database + '\n数据持久化',
            x: 200,
            y: 40,
            width: 340,
            height: 120,
            color: COLORS.data,
        },
    ];
    const edges = [
        {
            id: 'e1',
            fromNode: 'client',
            fromSide: 'bottom',
            toNode: 'api',
            toSide: 'top',
        },
        {
            id: 'e2',
            fromNode: 'api',
            fromSide: 'bottom',
            toNode: 'db',
            toSide: 'top',
        },
    ];
    return { nodes, edges };
}
/**
 * Generate canvas for frontend-backend separation project
 */
export function generateFrontendBackendCanvas(projectName, frontendFramework, backendFramework, database = 'Database') {
    const nodes = [
        // Title
        {
            id: 'title',
            type: 'text',
            text: '# ' + projectName + ' Architecture',
            x: 100,
            y: -600,
            width: 400,
            height: 80,
            color: COLORS.title,
        },
        // Frontend layer label
        {
            id: 'label_frontend',
            type: 'text',
            text: '**前端层**',
            x: -40,
            y: -450,
            width: 180,
            height: 60,
            color: COLORS.label,
        },
        // Frontend node
        {
            id: 'frontend',
            type: 'text',
            text: '## 前端应用\n\n' + frontendFramework + '\n组件 / 状态管理 / 路由',
            x: 200,
            y: -460,
            width: 340,
            height: 120,
            color: COLORS.ui,
        },
        // Gateway layer label
        {
            id: 'label_gateway',
            type: 'text',
            text: '**网关层**',
            x: -40,
            y: -250,
            width: 180,
            height: 60,
            color: COLORS.label,
        },
        // Gateway node
        {
            id: 'gateway',
            type: 'text',
            text: '## API 网关\n\nNginx / Gateway\n负载均衡 / 反向代理',
            x: 200,
            y: -260,
            width: 340,
            height: 120,
            color: COLORS.api,
        },
        // Backend layer label
        {
            id: 'label_backend',
            type: 'text',
            text: '**后端层**',
            x: -40,
            y: -50,
            width: 180,
            height: 60,
            color: COLORS.label,
        },
        // Backend node
        {
            id: 'backend',
            type: 'text',
            text: '## 后端服务\n\n' + backendFramework + '\n业务逻辑 / API',
            x: 200,
            y: -60,
            width: 340,
            height: 120,
            color: COLORS.api,
        },
        // Data layer label
        {
            id: 'label_data',
            type: 'text',
            text: '**数据层**',
            x: -40,
            y: 150,
            width: 180,
            height: 60,
            color: COLORS.label,
        },
        // Database node
        {
            id: 'db',
            type: 'text',
            text: '## 数据库\n\n' + database,
            x: 200,
            y: 140,
            width: 340,
            height: 120,
            color: COLORS.data,
        },
        // Cache node
        {
            id: 'cache',
            type: 'text',
            text: '## 缓存\n\nRedis\n会话 / 热数据',
            x: 560,
            y: 140,
            width: 340,
            height: 120,
            color: COLORS.cache,
        },
    ];
    const edges = [
        {
            id: 'e1',
            fromNode: 'frontend',
            fromSide: 'bottom',
            toNode: 'gateway',
            toSide: 'top',
        },
        {
            id: 'e2',
            fromNode: 'gateway',
            fromSide: 'bottom',
            toNode: 'backend',
            toSide: 'top',
        },
        {
            id: 'e3',
            fromNode: 'backend',
            fromSide: 'bottom',
            toNode: 'db',
            toSide: 'top',
        },
        {
            id: 'e4',
            fromNode: 'backend',
            fromSide: 'bottom',
            toNode: 'cache',
            toSide: 'top',
        },
    ];
    return { nodes, edges };
}
/**
 * Generate canvas for microservices project
 */
export function generateMicroservicesCanvas(projectName, services = ['用户服务', '订单服务', '商品服务']) {
    const nodes = [
        // Title
        {
            id: 'title',
            type: 'text',
            text: '# ' + projectName + ' Architecture\n微服务架构',
            x: 200,
            y: -700,
            width: 400,
            height: 100,
            color: COLORS.title,
        },
        // Gateway layer label
        {
            id: 'label_gateway',
            type: 'text',
            text: '**网关层**',
            x: -40,
            y: -550,
            width: 180,
            height: 60,
            color: COLORS.label,
        },
        // Gateway node
        {
            id: 'gateway',
            type: 'text',
            text: '## API Gateway\n\nKong / Nginx\n路由 / 限流 / 认证',
            x: 200,
            y: -560,
            width: 340,
            height: 120,
            color: COLORS.api,
        },
        // Services layer label
        {
            id: 'label_services',
            type: 'text',
            text: '**服务层**',
            x: -40,
            y: -350,
            width: 180,
            height: 60,
            color: COLORS.label,
        },
    ];
    // Add service nodes
    let serviceX = 200;
    for (let i = 0; i < services.length; i++) {
        nodes.push({
            id: 'service_' + i,
            type: 'text',
            text: '## ' + services[i] + '\n\n' + services[i] + '\n业务处理',
            x: serviceX,
            y: -360,
            width: 340,
            height: 120,
            color: COLORS.api,
        });
        serviceX += 360;
        // Add edge from gateway to service
        nodes[0]; // placeholder
    }
    // Infrastructure layer label
    nodes.push({
        id: 'label_infra',
        type: 'text',
        text: '**基础设施**',
        x: -40,
        y: -150,
        width: 180,
        height: 60,
        color: COLORS.label,
    });
    // Database cluster
    nodes.push({
        id: 'db',
        type: 'text',
        text: '## 数据库集群\n\nPostgreSQL / MySQL\n主从复制',
        x: 200,
        y: -160,
        width: 340,
        height: 120,
        color: COLORS.data,
    });
    // Message queue
    nodes.push({
        id: 'mq',
        type: 'text',
        text: '## 消息队列\n\nKafka / RabbitMQ\n异步通信',
        x: 560,
        y: -160,
        width: 340,
        height: 120,
        color: COLORS.cache,
    });
    // Cache cluster
    nodes.push({
        id: 'cache_cluster',
        type: 'text',
        text: '## 缓存集群\n\nRedis Cluster\n分布式缓存',
        x: 920,
        y: -160,
        width: 340,
        height: 120,
        color: COLORS.cache,
    });
    // Build edges
    const edges = [];
    // Gateway to services
    for (let i = 0; i < services.length; i++) {
        edges.push({
            id: 'e_gw_' + i,
            fromNode: 'gateway',
            fromSide: 'bottom',
            toNode: 'service_' + i,
            toSide: 'top',
        });
    }
    // Services to infrastructure
    for (let i = 0; i < services.length; i++) {
        edges.push({
            id: 'e_svc_db_' + i,
            fromNode: 'service_' + i,
            fromSide: 'bottom',
            toNode: 'db',
            toSide: 'top',
        });
        edges.push({
            id: 'e_svc_mq_' + i,
            fromNode: 'service_' + i,
            fromSide: 'bottom',
            toNode: 'mq',
            toSide: 'top',
        });
        edges.push({
            id: 'e_svc_cache_' + i,
            fromNode: 'service_' + i,
            fromSide: 'bottom',
            toNode: 'cache_cluster',
            toSide: 'top',
        });
    }
    return { nodes, edges };
}
/**
 * Serialize canvas to JSON string
 */
export function serializeCanvas(canvas) {
    return JSON.stringify(canvas, null, 0);
}
//# sourceMappingURL=canvas.js.map