import readline from 'readline/promises';
import { stdin as input, stdout as output } from 'process';
import { callLLMRaw } from './llm.js';

/**
 * Round themes for 3-round follow-up.
 */
export const ROUND_THEMES = [
  '细节挖掘（具体做了什么、怎么做、涉及哪些模块）',
  '障碍与反思（遇到什么问题、有什么纠结、走了哪些弯路）',
  '收获总结（学到了什么、可复用的经验、下一步计划）',
];

/**
 * Per-round question prompt.
 */
export const QUESTIONS_PROMPT = `你是一个工作日志追问助手。基于用户的工作内容和已有问答历史，生成下一个最值得追问的问题。

要求：
- 中文，1-2 句，直接提问，不要寒暄
- 不要重复历史中已问过的问题
- 根据当前轮次侧重不同维度

当前轮次: 第 {{round}}/3 轮
本轮主题建议: {{theme}}
工作内容: {{entry.details}}
已有问答历史:
{{history}}

直接返回问题文本，不要 JSON，不要 markdown 代码块。`;

/**
 * Summary prompt — synthesize 4 sections from full Q&A history.
 */
export const SUMMARY_PROMPT = `基于用户的工作内容和 3 轮问答历史，整理润色 4 块结构化中文工作日志正文。

工作内容: {{entry.details}}
问答历史:
{{history}}

以严格 JSON 返回:
{
  "work": "工作记录（[!tip]+ 内部内容，多行 bullet，使用 - 开头）",
  "note": "笔记（[!note]- 内部内容）",
  "details": "详细笔记（## 详细笔记 内部内容）",
  "summary": "今日总结（## 今日总结 内部内容）"
}

要求：
- **只整理与润色用户在问答中已表达的内容，不得补充未提及的具体信息**
- 禁止扩写：不要把短答案展开成长段落
- 每块 1-5 行；润色后的总长度不超过用户原话 1.5 倍
- 不要包含 callout 语法（> 或 [!tip] 等），只返回纯内容
- **不要在字段值中包含任何 markdown 标题（## xxx / ### xxx），标题由调用方添加**
- 不要 markdown 代码块包裹`;

/**
 * Read user answer for one round.
 * Returns null if user sent empty line (skip round).
 * Throws 'ABORT' if user pressed Ctrl+C.
 */
async function askQuestion(question) {
  const rl = readline.createInterface({ input, output });
  console.log();
  console.log(`\x1b[36m?\x1b[0m ${question}`);
  try {
    const answer = await rl.question('\x1b[90m> \x1b[0m');
    if (answer.trim() === '') return null;
    return answer.trim();
  } finally {
    rl.close();
  }
}

/**
 * Format history for prompt injection.
 */
function formatHistory(history) {
  if (history.length === 0) return '(无)';
  return history.map((h, i) => `Q${i + 1}: ${h.q}\nA${i + 1}: ${h.a || '(跳过)'}`).join('\n\n');
}

/**
 * Strip ```json``` fences and parse summary response.
 */
function parseSummary(text) {
  let s = text.trim();
  if (s.startsWith('```json')) s = s.slice(7);
  else if (s.startsWith('```')) s = s.slice(3);
  if (s.endsWith('```')) s = s.slice(0, -3);
  s = s.trim();
  try {
    const obj = JSON.parse(s);
    return {
      work: typeof obj.work === 'string' ? obj.work : '',
      note: typeof obj.note === 'string' ? obj.note : '',
      details: typeof obj.details === 'string' ? obj.details : '',
      summary: typeof obj.summary === 'string' ? obj.summary : '',
    };
  } catch {
    return { work: '', note: '', details: '', summary: '' };
  }
}

/**
 * Run 3-round LLM follow-up + 1 summary call.
 * Returns 4-section body content for storage.js.
 */
export async function grillFollowUp(entry, config) {
  // Non-TTY guard
  if (!input.isTTY) {
    console.log('\x1b[33m⚠️  --grill 需要交互式终端，跳过 grill 流程\x1b[0m');
    return { work: '', note: '', details: '', summary: '' };
  }

  const history = [];

  for (let round = 1; round <= 3; round++) {
    const theme = ROUND_THEMES[round - 1];
    const prompt = QUESTIONS_PROMPT
      .replace('{{round}}', String(round))
      .replace('{{theme}}', theme)
      .replace('{{entry.details}}', entry.details || entry.title || '')
      .replace('{{history}}', formatHistory(history));

    let question;
    try {
      console.log(`\x1b[90m正在生成问题 ${round}/3...\x1b[0m`);
      question = (await callLLMRaw(prompt, config)).trim();
    } catch (err) {
      console.log(`\x1b[33m⚠️  LLM 调用失败，跳过本轮: ${err.message}\x1b[0m`);
      history.push({ q: `(轮 ${round} LLM 失败)`, a: '' });
      continue;
    }

    if (!question) {
      console.log(`\x1b[33m⚠️  LLM 返回空问题，跳过本轮\x1b[0m`);
      history.push({ q: '(空问题)', a: '' });
      continue;
    }

    let answer;
    try {
      answer = await askQuestion(question);
    } catch (err) {
      // Ctrl+C — abort without writing.
      // On Windows Git Bash, SIGINT may kill the Node process before
      // rl.question rejects; the top-level SIGINT handler at file footer
      // covers that case.
      throw new Error('ABORT');
    }

    history.push({ q: question, a: answer || '(跳过)' });
  }

  // Summary round
  const summaryPrompt = SUMMARY_PROMPT
    .replace('{{entry.details}}', entry.details || entry.title || '')
    .replace('{{history}}', formatHistory(history));

  try {
    console.log('\x1b[90m正在汇总生成正文...\x1b[0m');
    const raw = await callLLMRaw(summaryPrompt, config);
    return parseSummary(raw);
  } catch (err) {
    console.log(`\x1b[33m⚠️  汇总失败，正文留空: ${err.message}\x1b[0m`);
    return { work: '', note: '', details: '', summary: '' };
  }
}

// Top-level SIGINT handler: covers Windows Git Bash where Ctrl+C
// kills the Node process before rl.question can reject.
process.once('SIGINT', () => {
  console.log('\n\x1b[33m⚠️  收到 SIGINT，已中断，不写入文件\x1b[0m');
  process.exit(0);
});