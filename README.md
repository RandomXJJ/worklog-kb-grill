# Work-Log KB Grill

> 个人工作日志知识库命令行工具 —— 每天一分钟记录，周报自动生成

> **本仓是 [worklog-kb v1.1.0](https://www.npmjs.com/package/worklog-kb) 的 fork 版本**，新增 `--grill` 选项：在 LLM 分类后进入 3 轮追问循环（grill 风格），把问答整理填入 daily 文件正文的 4 块回顾性内容。原 worklog-kb 的所有功能完全保留。

CLI 工具用于个人工作日志知识库管理。无需 AI 编码助手，直接在命令行中记录工作、生成周报月报。

## 特点

### 继承自 worklog-kb v1.1.0

- **零依赖 AI 助手** — 独立 CLI 工具，不需要 Claude Code/Cursor/OpenCode
- **两种分类模式** — 规则分类（免费）+ LLM 智能分类（可选）
- **灵活的 LLM 支持** — DeepSeek/OpenAI/Claude/Gemini/Ollama，按需选择
- **中文周报自动生成** — 格式规范，按分类汇总，标注来源日期
- **Obsidian 兼容** — 纯 Markdown + YAML，支持双向链接和标签
- **跨平台** — macOS/Linux/Windows 全支持

### 本 fork 新增

- **`worklog log --ai --grill "<事件>"`** — 3 轮 LLM 追问 + 1 轮汇总，把问答填入 daily 文件正文的 `[!tip]+ 工作记录` / `[!note]- 笔记` / `## 详细笔记` / `## 今日总结` 四块。Frontmatter 结构不变。
- **追问主题**：轮 1 细节挖掘 → `[!tip]+ 工作记录`；轮 2 障碍反思 → `[!note]- 笔记`；轮 3 收获总结 → `## 今日总结`。
- **润色而非扩写**：汇总轮 prompt 限制 LLM 只整理润色用户原话，不补充未提及内容。
- **SIGINT 兜底**：Ctrl+C 中止时不写入半成品文件（Windows Git Bash 兼容）。
- **`worklog log --grill`（无 `--ai`）**：黄字警告后正常写入（graceful 退化）。

## 安装

### 从 GitHub 仓直接安装（本 fork 的推荐方式）

```bash
npm install -g https://github.com/RandomXJJ/WorkGit.git
```

安装后命令名仍是 `worklog`（与原 worklog-kb 命令名一致，可直接替换）。

### 从 npm 安装（要装原版 worklog-kb）

```bash
npm install -g worklog-kb
```

> 原版不含 `--grill` 功能。要 grill 模式必须用本 fork。

### 从源码安装（开发用）

```bash
git clone https://github.com/RandomXJJ/WorkGit.git
cd WorkGit
npm install
npm install -g .
```

> 本仓只包含编译产物 `dist/`（无 src/ TypeScript 源码），因为上游 worklog-kb 声明的源码仓库 URL (https://github.com/yangmeishux/worklog-cli) 在 fork 时 404 不可达。所有改动基于 npm v1.1.0 的 `dist/` 反向工程。

## 快速上手

```bash
# 1. 初始化
worklog init

# 2. 配置 LLM provider（grill 模式需要）
worklog config --provider deepseek --key <your-deepseek-api-key>

# 3. 普通记录
worklog log "完成了用户管理需求开发"

# 4. LLM 智能分类
worklog log --ai "今天梳理了 AccuCheck 项目的数据流转"

# 5. Grill 模式（追问循环生成正文）
worklog log --ai --grill "今天完成了 AccuCheck 项目的整体梳理，包括核心功能、数据流转、核心功能代码"
```

## Grill 模式详解

### 工作流

```
worklog log --ai --grill "<事件>"
  │
  ├─ 1. LLM 分类（DeepSeek/OpenAI/Claude/Gemini/Ollama 任选）
  │     → type / title / details / tags
  │
  ├─ 2. 追问循环（3 轮）：
  │     轮 1：细节挖掘 → 填 [!tip]+ 工作记录
  │     轮 2：障碍反思 → 填 [!note]- 笔记
  │     轮 3：收获总结 → 填 ## 今日总结
  │     每轮你输入一行回答（空行跳过该轮，Ctrl+C 中止且不写文件）
  │
  ├─ 3. 汇总轮（1 次 LLM 调用）：把问答综合成 4 块结构化正文
  │
  └─ 4. 写入 daily/inbox 文件：
        - Frontmatter entries 数组（结构化数据，不变）
        - Markdown 正文 4 块 callout/section 自动填充
```

### 4 块 section 的归属

| 模板位置 | 内容 | 来源 |
|---|---|---|
| `[!todo] 今天要做的` | 今日计划 | **不填**（属于早晨写的计划，由 Obsidian 手写） |
| `[!tip]+ 工作记录` | 工作记录详情 | grill 轮 1 + 汇总轮润色 |
| `[!note]- 笔记` | 想法、问题、洞察 | grill 轮 2 + 汇总轮润色 |
| `[!warning] 明天继续` | 明日计划 | **不填**（属于晚间写的计划） |
| `## 详细笔记` | 深度展开 | grill 汇总轮基于全部问答润色 |
| `## 今日总结` | 收获总结 | grill 轮 3 + 汇总轮润色 |

### 中止与降级

| 场景 | 行为 |
|---|---|
| `--grill` 但 LLM provider=none | 黄字警告 `--grill 需要 --ai`，正常写入，正文留空 |
| 单轮 LLM 失败 | warn + 跳过该轮，继续 |
| 汇总轮 LLM 失败 | 4 块 section 全留空，frontmatter 正常写入 |
| 用户 Ctrl+C | 立刻退出，**不写文件**（已收集问答全部丢弃，避免半成品） |
| 非交互终端（CI / 管道） | 黄字警告，跳过 grill，正常写入 |

### 注意事项

- Grill 模式需要 LLM provider 已配置（`worklog config --provider <name> --key <key>`）
- 4 次 LLM API 调用延迟约 6-10 秒（顺序依赖历史，无法并发）
- Ctrl+C 在 Windows Git Bash 下会被 SIGINT 立即终止 Node 进程；本 fork 的顶层 SIGINT 处理器覆盖此场景

## 原始 worklog-kb 命令

`worklog log` / `worklog weekly` / `worklog monthly` / `worklog project` / `worklog archive` / `worklog git` / `worklog config` / `worklog status` 等所有原命令行为不变。

详见原 worklog-kb README（https://www.npmjs.com/package/worklog-kb）或本仓 README 后半部分（保留上游原文）。

## 与上游的关系

- 上游：[yangmeishux/worklog-cli](https://www.npmjs.com/package/worklog-kb)（v1.1.0，MIT 协议）
- 本 fork 上游源码 URL 在 fork 时不可达（404），改动基于 npm v1.1.0 的 `dist/` 编译产物
- LICENSE 文件保留原作者 yangmeishux 的版权声明（MIT），并加注本 fork 的修改声明
- 本 fork 的所有新增功能都在 `dist/lib/grill.js` 等 dist 目录下，未修改上游源码（因不可达）

## 升级与回滚

本 fork 是独立包（`worklog-kb-grill`），与上游 `worklog-kb` 并存：

- 装本 fork：`npm install -g https://github.com/RandomXJJ/WorkGit.git`
- 装上游：`npm install -g worklog-kb`
- 切换：卸载一个再装另一个（`npm uninstall -g worklog-kb-grill && npm install -g worklog-kb` 或反之）

## 仓库

- GitHub：https://github.com/RandomXJJ/WorkGit
- 问题反馈：https://github.com/RandomXJJ/WorkGit/issues
- 上游 npm：https://www.npmjs.com/package/worklog-kb

- **零依赖 AI 助手** — 独立 CLI 工具，不需要 Claude Code/Cursor/OpenCode
- **两种分类模式** — 规则分类（免费）+ LLM 智能分类（可选）
- **灵活的 LLM 支持** — DeepSeek/OpenAI/Claude/Gemini/Ollama，按需选择
- **中文周报自动生成** — 格式规范，按分类汇总，标注来源日期
- **Obsidian 兼容** — 纯 Markdown + YAML，支持双向链接和标签
- **跨平台** — macOS/Linux/Windows 全支持

## 安装

> 安装方式见本 README 前文 [## 安装](#安装) 段。

### 系统要求

- Node.js >= 18
- npm 或 yarn

## 快速开始

### 第一步：初始化知识库

```bash
# 交互式初始化（推荐）
worklog init

# 快速初始化（不配置 LLM，使用规则分类）
worklog init --skip-prompts

# 直接配置 DeepSeek
worklog init --provider deepseek --key sk-xxx

# 自定义路径
worklog init --path ~/my-worklog
```

**交互式选项：**

| 选项 | 说明 |
|------|------|
| 知识库路径 | 默认当前目录 `kb/`，可自定义 |
| LLM 提供商 | 6 种选择，默认"无"（规则分类） |
| API Key | 选择非本地模型后提示输入 |

### 第二步：记录工作

```bash
# 结构化输入（无需 LLM，零成本）
worklog log dev 完成了用户管理登录API开发
worklog log review 评审了订单模块需求
worklog log bugfix 修复了登录页面表单验证问题

# 自然语言输入（需要配置 LLM）
worklog log --ai 今天完成了登录API开发，下午评审了订单需求

# 指定标签
worklog log dev 完成了登录API --tags #中邮,#订单中心
```

### 第三步：生成周报

```bash
worklog weekly
```

自动扫描本周所有日志，按分类汇总生成中文周报。

### 第四步：查看状态

```bash
worklog status
```

显示今日/本周/本月条目统计、配置信息、目录结构。

## 命令详解

### `worklog init`

初始化知识库目录结构和配置。

```bash
worklog init [options]

选项：
  -p, --path <path>       自定义知识库路径
  --provider <provider>   LLM 提供商（none, deepseek, openai, anthropic, gemini, ollama）
  --key <key>             API Key
  --skip-prompts          跳过交互提示，使用默认值
```

**示例：**

```bash
# 最简单的方式（规则分类，无 API 成本）
worklog init

# 直接配置 DeepSeek
worklog init --provider deepseek --key sk-xxx

# 自定义路径 + DeepSeek
worklog init --path ~/Documents/worklog --provider deepseek --key sk-xxx

# 使用本地模型（Ollama，无 API Key）
worklog init --provider ollama
```

### `worklog log`

记录工作条目。

```bash
worklog log [content] [options]

选项：
  -t, --type <type>       指定分类类型（dev, review, bugfix 等）
  --tags <tags>           标签（逗号分隔，如 #中邮,#订单）
  --ai                    使用 LLM 进行智能分类
```

**输入方式：**

| 方式 | 命令 | 说明 |
|------|------|------|
| 结构化 | `worklog log dev 内容` | 指定类型，无需 LLM |
| 自然语言 | `worklog log --ai 内容` | LLM 自动分类 |
| 带标签 | `worklog log dev 内容 --tags #标签` | 添加项目/技术标签 |
| 类型前缀 | `worklog log dev 完成了xxx` | 自动识别类型前缀 |

**示例：**

```bash
# 结构化输入（推荐，无 API 成本）
worklog log dev 完成了用户管理登录API
worklog log review 评审了订单模块需求
worklog log bugfix 修复了登录验证问题

# 自然语言 + LLM（智能分类）
worklog log --ai 今天做了用户管理需求，下午评审了订单，还面试了一个前端候选人

# 带标签
worklog log dev 完成了登录API --tags #中邮,#订单中心

# 直接指定类型（跳过分类）
worklog log -t dev 完成了登录API
```

### `worklog weekly`

生成周报。

```bash
worklog weekly [options]

选项：
  -w, --week <week>       指定周号（如 2026-W18）
```

**周报格式：**

```markdown
# 工作周报 - 2026年05月04日 - 05月10日（第W19周）

## 一、需求开发与上线
### 1.1 开发中需求
- 完成用户管理登录API：完成了用户管理登录API（来源：2026-05-05）

### 1.2 已上线需求
本周无相关记录

## 二、需求评审
- 订单模块需求评审：评审了订单模块需求（来源：2026-05-05）

## 三、技术设计
本周无相关记录

## 四、Bug 修复
本周无相关记录

## 五、面试
- 静试前端候选人：面试了前端候选人（来源：2026-05-05）

...

## 八、风险与问题
本周无相关记录
```

### `worklog monthly`

生成月报。

```bash
worklog monthly [options]

选项：
  -m, --month <month>     指定月份（如 2026-05）
```

**月报包含：**
- 本月概览
- 各分类汇总
- 重要事项
- 下月计划
- 统计表格

### `worklog config`

查看或更新配置。

```bash
worklog config [options]

选项：
  -p, --path <path>       更新知识库路径
  --provider <provider>   更换 LLM 提供商
  -k, --key <key>         更新 API Key
  --show                  显示当前配置
```

**示例：**

```bash
# 查看配置
worklog config --show

# 更换为 DeepSeek
worklog config --provider deepseek --key sk-xxx

# 更换为规则分类（无 LLM）
worklog config --provider none

# 更新知识库路径
worklog config --path ~/new-worklog/kb

# 交互式配置
worklog config
```

### `worklog status`

显示知识库状态。

```bash
worklog status
```

**输出内容：**
- 知识库路径和状态
- LLM 配置信息
- 今日/本周/本月条目统计
- 目录结构检查

## 分类体系

| 类型 | 标识 | 关键词（规则分类） | 使用场景 |
|------|------|-------------------|----------|
| 需求开发 | `dev` | 完成/开发/实现/做了 | 功能开发、代码编写 |
| 上线发布 | `release` | 上线/发布/部署/灰度 | 版本上线、部署 |
| 需求评审 | `review` | 评审/过需求 | 需求评审、讨论 |
| 技术设计 | `design` | 设计/方案/架构 | 方案设计、架构 |
| Bug 修复 | `bugfix` | 修复/排查/解决/Bug | 问题修复 |
| 数据修复 | `datafix` | 数据修复/数据修正 | 数据问题处理 |
| 静试 | `interview` | 静试/候选人 | 静试记录 |
| 学习成长 | `learn` | 学习/研究/了解 | 技术学习 |
| 会议 | `meeting` | 开会/会议/同步 | 会议记录 |
| 其他 | `other` | — | 无法归类的事项 |

## LLM 集成

### 支持的提供商

| 提供商 | 标识 | 模型 | API Key 来源 | 价格 |
|--------|------|------|--------------|------|
| **DeepSeek** | `deepseek` | deepseek-chat | platform.deepseek.com | ~$0.14/M tokens（推荐） |
| **OpenAI** | `openai` | gpt-4o-mini | platform.openai.com | ~$0.15/M tokens |
| **Anthropic** | `anthropic` | claude-3-5-haiku | console.anthropic.com | ~$0.25/M tokens |
| **Google Gemini** | `gemini` | gemini-2.0-flash | aistudio.google.com | 免费额度 |
| **Ollama** | `ollama` | llama3 | 本地安装 | 免费 |

### 配置方式

```bash
# 初始化时配置
worklog init --provider deepseek --key sk-xxx

# 后续配置
worklog config --provider deepseek --key sk-xxx

# 交互式配置
worklog config
```

### LLM 分类优势

| 功能 | 规则分类 | LLM 分类 |
|------|----------|----------|
| 类型识别 | 关键词匹配 | 智能理解 |
| 标题提取 | 截取原文 | 自动概括 |
| 标签建议 | 无 | 自动建议 |
| 复杂输入 | 可能误判 | 精准识别 |

**示例对比：**

```bash
# 输入：今天完成了用户管理登录API开发，使用了JWT认证，下午还评审了订单模块需求

# 规则分类结果：
类型: dev
标题: 完成了用户管理登录API开发，使用了JWT认证

# LLM 分类结果：
类型: dev
标题: 用户管理登录API开发
标签: #用户管理 #API #JWT
```

### 错误处理

- API 调用失败自动降级到规则分类
- 显示清晰的错误提示
- 不会阻塞记录流程

## 知识库结构

```
kb/
├── inbox/              # 当日收件箱
│   └── 2026-05-05.md   # 临时存储，可手动清理
│
├── daily/              # 每日正式日志（按年/月组织）
│   └── 2026/
│       └── 05/
│           └── 2026-05-05.md
│
├── weekly/             # 自动生成的周报
│   └── 2026-W19.md
│
├── monthly/            # 自动生成的月报
│   └── 2026-05.md
│
├── tags/               # 标签系统
│   ├── index.md        # 标签索引（自动维护）
│   ├── dictionary.md   # 标签词典
│   └── synonyms.md     # 标签同义词
│
└── templates/          # 模板文件
    ├── daily-log.md    # 日志模板
    ├── weekly-summary.md # 周报模板
    ├── monthly-rollup.md # 月报模板
    └── type-guide.md   # 分类说明
```

### 日志文件格式

```markdown
---
date: "2026-05-05"
week: "2026-W19"
month: "2026-05"
entries:
  - type: "dev"
    title: "完成用户管理登录API"
    details: "完成了用户管理登录API开发"
    tags: ["#用户管理", "#API"]
  - type: "review"
    title: "订单模块需求评审"
    details: "评审了订单模块需求"
    tags: ["#订单模块"]
---

# 工作日志 - 2026-05-05

## 详细笔记
```

## 配置存储

配置文件位置：`~/.config/worklog-kb-nodejs/config.json`

```json
{
  "kbPath": "/Users/xxx/worklog/kb",
  "llmProvider": "deepseek",
  "apiKey": "sk-xxx",
  "defaultMode": "llm",
  "createdAt": "2026-05-05T12:00:00.000Z",
  "updatedAt": "2026-05-05T12:00:00.000Z"
}
```

### 配置字段说明

| 字段 | 说明 | 默认值 |
|------|------|--------|
| `kbPath` | 知识库路径 | `./kb` |
| `llmProvider` | LLM 提供商 | `none` |
| `apiKey` | API Key | 空 |
| `defaultMode` | 默认分类模式 | `rule-based` |

## 与原系统集成

本 CLI 工具与原有的 Claude Code/Cursor/OpenCode 系统完全兼容：

| 特性 | CLI | Claude Code/Cursor |
|------|-----|-------------------|
| 数据格式 | Markdown + YAML | 相同 |
| 分类体系 | 10 种类型 | 相同 |
| 周报格式 | 中文规范格式 | 相同 |
| 标签系统 | #标签 + 索引 | 相同 |

**迁移方式：**

1. CLI 创建的知识库可在 Claude Code 中打开
2. Claude Code 创建的记录 CLI 可直接读取
3. 两种方式可在同一 `kb/` 目录混用

**使用建议：**

- 快速记录时使用 CLI：`worklog log dev 完成了xxx`
- 详细笔记时打开 Claude Code/Cursor 补充

## 标签使用

### 标签格式

使用 `#标签` 格式，支持层级：

```bash
# 扁平标签
worklog log dev 完成了登录API #中邮 #API

# 层级标签
worklog log dev 完成了登录API #项目/中邮 #技术/API
```

### 标签建议

| 类型 | 示例 | 说明 |
|------|------|------|
| 项目 | `#中邮` `#保险师` | 标记所属项目 |
| 业务 | `#录单` `#理赔` | 标记业务模块 |
| 技术 | `#React` `#API` `#前端` | 标记技术栈 |
| 团队 | `#前端组` `#后端组` | 标记团队 |

### 标签索引

所有标签自动索引到 `kb/tags/index.md`：

```markdown
# 标签索引

## #中邮
- [[2026-05-05]] - 完成用户管理登录API

## #API
- [[2026-05-05]] - 完成用户管理登录API
```

## Obsidian 使用

1. 打开 Obsidian
2. 选择"打开文件夹"，选择 `kb/` 目录
3. 可使用：
   - 日历插件查看每日日志
   - 标签面板筛选
   - 双向链接导航
   - 图谱视图关联

## 开发指南

### 项目结构

```
worklog-kb/
├── package.json          # npm 配置
├── tsconfig.json         # TypeScript 配置
├── src/
│   ├── index.ts          # CLI 入口
│   ├── commands/         # 命令实现
│   │   ├── init.ts
│   │   ├── log.ts
│   │   ├── weekly.ts
│   │   ├── monthly.ts
│   │   ├── config.ts
│   │   └── status.ts
│   ├── lib/              # 核心逻辑
│   │   ├── config.ts     # 配置管理
│   │   ├── classifier.ts # 分类逻辑
│   │   ├── llm.ts        # LLM API
│   │   ├── storage.ts    # 文件操作
│   │   └── report.ts     # 报告生成
│   ├── utils/            # 工具函数
│   │   ├── date.ts       # 日期处理
│   │   └── fs.ts         # 文件系统
│   └── types/            # TypeScript 类型
│       └── index.ts
└── dist/                 # 编译输出
```

### 开发命令

```bash
# 开发模式（监听编译）
npm run dev

# 构建
npm run build

# 测试
npm test

# 发布
npm publish
```

### 技术栈

- **TypeScript** — 类型安全
- **Commander** — CLI 框架
- **Inquirer** — 交互提示
- **Luxon** — 日期处理
- **gray-matter** — YAML 解析

## 常见问题

### Q: 需要编程能力吗？

不需要。整个系统使用命令行和 Markdown，无需编写代码。

### Q: 数据存在哪里？

全部是本地 Markdown 文件，存在 `kb/` 目录下。不依赖任何外部服务。

### Q: 可以多人协作吗？

可以。将项目推送到 git 仓库，多人各自记录，周报按人按周生成。

### Q: 不配置 LLM 可以用吗？

可以。规则分类已覆盖大部分场景，零 API 成本。

### Q: DeepSeek API Key 怎么获取？

访问 https://platform.deepseek.com/ 注册并创建 API Key。

### Q: Ollama 怎么使用？

```bash
# 安装 Ollama
brew install ollama  # macOS

# 下载模型
ollama pull llama3

# 配置 CLI
worklog init --provider ollama
```

### Q: 如何备份？

```bash
# 备份知识库
cp -r kb/ backup/

# 或使用 git
git add kb/
git commit -m "备份工作日志"
```

### Q: 周报日期范围如何确定？

周报范围固定为本周一到本周日，无论周几触发。使用 ISO 周号（如 2026-W19）。

## 更新日志

### v1.0.0

- 完整 CLI 工具实现
- 6 个命令：init, log, weekly, monthly, config, status
- 5 种 LLM 支持：DeepSeek, OpenAI, Anthropic, Gemini, Ollama
- 规则分类 + LLM 智能分类双模式
- 中文周报/月报自动生成
- Obsidian 兼容的数据格式
- 4 个模板文件

## License

MIT

## 作者

Work-Log CLI Team

---

**快速回顾：**

```bash
# 1. 安装
npm install -g worklog-kb

# 2. 初始化
worklog init

# 3. 记录
worklog log dev 完成了登录API

# 4. 周报
worklog weekly
```