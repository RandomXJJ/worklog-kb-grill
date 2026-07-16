/**
 * Manual smoke test for grill pipeline.
 * Mocks LLM responses and readline via a one-shot Node ESM loader hook
 * registered with module.register(), so production code (llm.js / grill.js /
 * storage.js) stays untouched.
 *
 * Why a loader hook: Node ESM 命名空间对象是 sealed 的，无法直接赋值；
 * 直接改 llm.js/grill.js 增加 setCallLLMRaw/setCreateInterface 测试钩子
 * 会污染生产代码。loader hook 在模块源码层面注入 mock 通道，对调用方零侵入。
 *
 * Run: node grill.demo.js
 */
import { register } from 'node:module';
import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';

// === Loader hook ===
// 1) llm.js: 在 callLLMRaw 体内插入 mock 短路（globalThis.__grillDemoMockCallLLMRaw）
// 2) grill.js: 把 readline.createInterface(...) 调用替换为 mockCreateInterface(...)
//    并注入 mockCreateInterface 包装函数（同样查 globalThis）
// 3) storage.js: 给 generateCalloutsBody 加上 export 关键字
const HOOK_SOURCE = `
export async function load(url, context, nextLoad) {
  const result = await nextLoad(url, context);
  const u = url.replace(/\\\\/g, '/');

  if (u.endsWith('/worklog-kb/dist/lib/llm.js') && result.source) {
    let src = typeof result.source === 'string' ? result.source : Buffer.from(result.source).toString('utf8');
    if (!src.includes('__grillDemoMockCallLLMRaw')) {
      src = src.replace(
        /export async function callLLMRaw\\(prompt, config\\) \\{/,
        'export async function callLLMRaw(prompt, config) { if (globalThis.__grillDemoMockCallLLMRaw) return globalThis.__grillDemoMockCallLLMRaw(prompt, config);'
      );
      result.source = src;
    }
  }

  if (u.endsWith('/worklog-kb/dist/lib/grill.js') && result.source) {
    let src = typeof result.source === 'string' ? result.source : Buffer.from(result.source).toString('utf8');
    if (!src.includes('__grillDemoMockCreateInterface')) {
      const helper = 'const mockCreateInterface = (...args) => globalThis.__grillDemoMockCreateInterface ? globalThis.__grillDemoMockCreateInterface(...args) : readline.createInterface(...args);\\n';
      src = src.replace(/readline\\.createInterface\\(/g, 'mockCreateInterface(');
      // 插入到第一个 import 之后
      const lastImportEnd = src.indexOf('\\n', src.lastIndexOf('import ')) + 1;
      src = src.slice(0, lastImportEnd) + '\\n' + helper + src.slice(lastImportEnd);
      result.source = src;
    }
  }

  if (u.endsWith('/worklog-kb/dist/lib/storage.js') && result.source) {
    let src = typeof result.source === 'string' ? result.source : Buffer.from(result.source).toString('utf8');
    if (!/^export function generateCalloutsBody/m.test(src)) {
      src = src.replace(/^function generateCalloutsBody\\(/m, 'export function generateCalloutsBody(');
      result.source = src;
    }
  }

  return result;
}
`;

const HOOK_URL = 'data:text/javascript;base64,' + Buffer.from(HOOK_SOURCE).toString('base64');
register(HOOK_URL);

// === Mock 配置 ===
const mockedResponses = [
  'Q1: 你具体梳理了哪些模块？',
  'Q2: 过程中遇到什么卡点？',
  'Q3: 这次梳理最大的收获是什么？',
  // 注：原文 mock 使用单 \\n，JS 解析后变成字面换行符，是非法 JSON；
  // 这里使用 \\\\n 让 JS 字符串携带 \\n（合法 JSON 转义）。
  '{"work":"- 梳理了 3 个核心模块\\n- 画了数据流图","note":"数据流是单向的","details":"raw → clean → aggregate 三阶段，每阶段独立服务","summary":"理解了整体架构，可作为新人 onboarding 材料"}',
];
let callIdx = 0;
globalThis.__grillDemoMockCallLLMRaw = async () => mockedResponses[callIdx++];

const mockAnswers = ['3 个核心模块：采集、计算、可视化', '数据流边界一开始没想清楚', '学会了从整体到细节的拆解'];
let answerIdx = 0;
globalThis.__grillDemoMockCreateInterface = () => ({
  question: async () => mockAnswers[answerIdx++] || '',
  close: () => {},
});

const origIsTTY = process.stdin.isTTY;
Object.defineProperty(process.stdin, 'isTTY', { value: true, configurable: true });

// === 加载被测模块（已被 hook 改写） ===
const { grillFollowUp } = await import('./grill.js');
const { generateCalloutsBody } = await import('./storage.js');

const config = { llmProvider: 'deepseek', apiKey: 'mock' };
const entry = {
  type: 'learn',
  title: 'AccuCheck 整体梳理',
  details: '今天完成了 AccuCheck 项目的整体梳理',
  tags: ['#AccuCheck'],
};

try {
  const result = await grillFollowUp(entry, config);
  assert.equal(typeof result.work, 'string', 'work 必须是 string');
  assert.equal(typeof result.note, 'string', 'note 必须是 string');
  assert.equal(typeof result.details, 'string', 'details 必须是 string');
  assert.equal(typeof result.summary, 'string', 'summary 必须是 string');
  assert.ok(result.work.length > 0, 'work 应有内容');
  assert.ok(result.summary.length > 0, 'summary 应有内容');
  console.log('✓ grillFollowUp 返回 4 字段结构正确');

  const body = generateCalloutsBody('2026-07-16', result);
  assert.ok(body.includes('> [!tip]+ 工作记录'), '应包含 work callout');
  assert.ok(body.includes('> [!note]- 笔记'), '应包含 note callout');
  assert.ok(body.includes('## 详细笔记'), '应包含 details 章节');
  assert.ok(body.includes('## 今日总结'), '应包含 summary 章节');
  assert.ok(body.includes('- 梳理了 3 个核心模块'), 'work 内容应渲染进 callout');
  assert.ok(!body.includes('```'), '不应有 markdown 代码块');
  console.log('✓ generateCalloutsBody 渲染正文正确');
  console.log('\n--- 渲染结果预览 ---');
  console.log(body);
} finally {
  Object.defineProperty(process.stdin, 'isTTY', { value: origIsTTY, configurable: true });
  globalThis.__grillDemoMockCallLLMRaw = null;
  globalThis.__grillDemoMockCreateInterface = null;
}