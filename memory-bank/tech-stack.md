# AI求职助手 - 技术栈文档

## 设计原则
- **MVP 优先**：选择成熟、开发效率高的技术，快速验证核心功能
- **单体优先**：V1.0 不做微服务，单体应用足以支撑初期用户量
- **全栈 TypeScript**：前后端统一语言，减少上下文切换
- **尽量少的基础设施**：减少运维复杂度

---

## 前端

| 选择 | 理由 |
|------|------|
| **Next.js 14 (App Router)** | React 生态最成熟的全栈框架，SSR/SSG 支持好，API Routes 可以直接写后端 |
| **TypeScript** | 类型安全，大型项目必备 |
| **Tailwind CSS** | 快速开发 UI，响应式设计方便 |
| **shadcn/ui** | 基于 Radix UI 的组件库，样式可定制，不是 npm 包而是复制到项目中 |
| **Zustand** | 轻量级状态管理，比 Redux 简单 |
| **React Hook Form + Zod** | 表单处理 + 数据验证 |
| **TanStack Table** | 投递管理表格组件，功能丰富（排序、筛选、分页） |
| **react-pdf** | 简历 PDF 预览 |
| **react-diff-viewer** | 简历修改前后对比 |

## 后端

| 选择 | 理由 |
|------|------|
| **Next.js API Routes + Server Actions** | 与前端同项目，无需单独后端服务 |
| **Prisma** | TypeScript ORM，类型安全，schema 即文档 |
| **PostgreSQL** | 关系型数据库，适合结构化的简历/岗位/投递数据 |
| **NextAuth.js (Auth.js v5)** | 认证方案，支持多种登录方式 |
| **Uploadthing / S3** | 文件上传（简历PDF、面试录音） |

## AI 服务

| 选择 | 理由 |
|------|------|
| **Claude API (claude-sonnet-4-6)** | 主力 LLM，用于简历解析、简历优化、模拟面试对话 |
| **OpenAI Embeddings (text-embedding-3-small)** | 用于岗位-简历的语义匹配向量化 |
| **Whisper API** | 面试录音转文字（V1.5） |

## 数据库 & 缓存

| 选择 | 理由 |
|------|------|
| **PostgreSQL** | 主数据库，存储用户、简历、岗位、投递记录等 |
| **pgvector 扩展** | 存储和检索 embedding 向量，用于岗位匹配 |
| **Redis (Upstash)** | 缓存、会话存储、速率限制 |

## 爬虫服务（V1.0 简化方案）

| 选择 | 理由 |
|------|------|
| **Playwright** | 浏览器自动化，处理 JS 渲染的招聘页面 |
| **Node-cron** | 定时调度爬取任务 |

> V1.0 暂时只做 Top20 公司官网的岗位抓取，数据量可控

## 部署

| 选择 | 理由 |
|------|------|
| **Vercel** | Next.js 官方部署平台，CI/CD 自动化 |
| **Supabase / Neon** | 托管 PostgreSQL（支持 pgvector） |
| **Upstash** | Serverless Redis |
| **Vercel Blob / S3** | 文件存储 |

## 开发工具

| 选择 | 理由 |
|------|------|
| **ESLint + Prettier** | 代码规范 |
| **Vitest** | 单元测试 |
| **Playwright** | E2E 测试 |
| **Docker Compose** | 本地开发环境（PostgreSQL + Redis） |

---

## 项目结构（预期）

```
ai-job-assistant/
├── memory-bank/                # 项目记忆文档
├── src/
│   ├── app/                    # Next.js App Router 页面
│   │   ├── (auth)/             # 登录/注册页面
│   │   ├── (dashboard)/        # 主面板
│   │   │   ├── resume/         # 简历管理
│   │   │   ├── jobs/           # 岗位匹配
│   │   │   ├── applications/   # 投递管理
│   │   │   └── interview/      # 模拟面试
│   │   └── api/                # API Routes
│   ├── components/             # 通用 UI 组件
│   │   ├── ui/                 # shadcn/ui 基础组件
│   │   └── features/           # 业务组件
│   ├── lib/                    # 工具函数
│   │   ├── ai/                 # AI 服务封装
│   │   ├── db/                 # 数据库相关
│   │   └── utils/              # 通用工具
│   ├── services/               # 业务逻辑层
│   └── types/                  # TypeScript 类型定义
├── prisma/
│   └── schema.prisma           # 数据库 schema
├── public/                     # 静态资源
├── tests/                      # 测试
├── docker-compose.yml          # 本地开发数据库
└── package.json
```

## 不在 V1.0 范围内的技术

- 微服务架构（单体够用）
- Elasticsearch（岗位搜索用 PostgreSQL 全文搜索即可）
- 消息队列（异步任务用 Vercel Background Functions 或简单的 Promise 处理）
- WebSocket（模拟面试用 SSE 流式响应即可）
- 语音面试 TTS/ASR（V1.5）
