# Work-Log KB Grill

> worklog-kb v1.1.0 的 fork 版本，新增 `--grill` LLM 追问循环选项

CLI 工具用于个人工作日志知识库管理。本 fork 在原版基础上新增 `--grill` 模式：分类后跑 3 轮 LLM 追问 + 1 轮汇总，把问答填入 daily 文件正文的 4 块回顾性 callout/section。

## 特点

### 继承自 worklog-kb v1.1.0

- 规则分类（免费）+ LLM 智能分类（可选）
- LLM 支持：DeepSeek / OpenAI / Claude / Gemini / Ollama
- 自动生成中文周报 / 月报
- Obsidian 兼容：纯 Markdown + YAML + 双向链接 + 标签

### 本 fork 新增：`--grill`

```bash
worklog log --ai --grill "今天完成了 AccuCheck 项目的整体梳理"
```

跑完整流程：

1. LLM 分类
2. 3 轮追问（细节 → 障碍 → 收获）
3. 1 轮汇总
4. 写入 daily/inbox，正文 4 块 callout 自动填充

## 安装

```bash
npm install -g https://github.com/RandomXJJ/worklog-kb-grill.git
```

命令名仍是 `worklog`，可与原 `worklog-kb` 互替（不可同时装）。  
需要 Node >= 18。

## 快速上手

```bash
worklog init
worklog config --provider deepseek --key <your-api-key>
worklog log --ai --grill "今天完成了 X 项目的整体梳理"
```

完整命令文档（`init` / `log` / `weekly` / `monthly` / `config` / `status` 等）请参考 [上游 worklog-kb npm 包](https://www.npmjs.com/package/worklog-kb)。

## Grill 模式详解

### 工作流

```
worklog log --ai --grill "<事件>"
  ├─ 1. LLM 分类 → type / title / details / tags
  ├─ 2. 追问 3 轮（每轮输入一行；空行跳过；Ctrl+C 中止）
  ├─ 3. 汇总 1 轮（LLM 综合 4 块结构化正文）
  └─ 4. 写入 daily/inbox（frontmatter + 4 块 callout）
```

### 4 块 section 的归属

| 模板位置 | grill 填充 |
|---|---|
| `[!tip]+ 工作记录` | 轮 1 细节挖掘 + 汇总润色 |
| `[!note]- 笔记` | 轮 2 障碍反思 + 汇总润色 |
| `## 详细笔记` | 汇总轮基于全部问答润色 |
| `## 今日总结` | 轮 3 收获总结 + 汇总润色 |

`[!todo]` 今日计划 与 `[!warning]` 明天继续 不由 grill 填充（属于早晚手写计划）。

### 行为表

| 场景 | 行为 |
|---|---|
| `--grill` 但 LLM provider=none | 黄字警告，正常写入，正文留空 |
| 单轮 LLM 失败 | warn + 跳过该轮，继续 |
| 汇总轮 LLM 失败 | 4 块 section 留空，frontmatter 正常写入 |
| 用户 Ctrl+C | 立刻退出，不写文件 |
| 非交互终端（CI / 管道） | 黄字警告，跳过 grill |

### 注意事项

- grill 模式需要 LLM provider 已配置
- 4 次 LLM API 调用延迟约 6-10 秒（顺序依赖历史）
- Windows Git Bash 下 Ctrl+C 会直接终止 Node 进程；本 fork 的顶层 SIGINT 处理器覆盖此场景

## 与上游的关系

- 上游：[worklog-kb v1.1.0](https://www.npmjs.com/package/worklog-kb)（MIT）
- 上游源码仓库 `https://github.com/yangmeishux/worklog-cli` 在本 fork 时 404，所有改动基于 npm v1.1.0 的 `dist/` 编译产物
- 本仓不包含 src/ TypeScript 源码
- LICENSE 文件保留原作者版权声明 + 本 fork 修改声明

## 升级与回滚

- 装本 fork：`npm install -g https://github.com/RandomXJJ/worklog-kb-grill.git`
- 装上游：`npm install -g worklog-kb`
- 切换：先 `npm uninstall -g <当前包>` 再装另一个

## 仓库

- 仓：https://github.com/RandomXJJ/worklog-kb-grill
- Issues：https://github.com/RandomXJJ/worklog-kb-grill/issues
- 上游：https://www.npmjs.com/package/worklog-kb

## License

MIT — 详见 [LICENSE](./LICENSE)。  
Copyright (c) 2024 yangmeishux (worklog-kb v1.1.0, original work) · 2026 xiaojiyao (worklog-kb-grill, modifications).