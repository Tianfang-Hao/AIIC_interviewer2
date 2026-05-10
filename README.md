# AI 求职助手 — 智能面试教练平台

面向互联网实习/校招求职者的 AI 面试训练平台。核心差异化：**双栏实时教练系统**——左栏模拟真实面试对话，右栏同步显示面试官 OS、维度评分、改进建议和推荐话术，实现"边练边学"的刻意练习体验。

## 线上访问

- **地址**: http://182.92.217.87
- **测试账号**: `test@example.com` / `Test123456`

## 项目简介

每年大量本科生准备大厂实习面试或保研复试，普遍痛点是：找不到资深学长进行高频对练、没有得到针对性的可执行反馈。本平台通过 AI 面试官 + AI 教练的双角色架构，让用户每一轮回答后立刻获得：面试官视角解读、五维度量化评分、具体改进建议和可模仿的优秀回答。

### 核心功能

| 功能 | 说明 |
|------|------|
| 双栏实时教练 | 面试对话 + 实时反馈并行，每轮回答后右栏自动更新 |
| 面试官 OS | 揭示考察意图和对回答的真实反应 |
| 五维度评分 | 内容相关性/结构清晰度/量化数据/技术深度/表达流畅度 |
| 推荐话术 | 基于用户简历的完整优秀回答（折叠式） |
| 一键重练 | 回退到问题状态重新作答 |
| 错题本 | 低分题自动收录，按薄弱维度筛选，支持重练 |
| 能力雷达 | 面试结束后五维度 SVG 雷达图 |
| 3轮×5风格 | 技术面/思维面/HR面 × 温和/细节/压力/发散/沉默 |
| 简历管理 | 上传→AI解析→多版本→PDF导出 |
| 岗位匹配 | 五维度加权匹配算法 |
| AI简历优化 | 针对目标岗位生成优化方案 |
| 投递管理 | 高级表格+批量操作+转化漏斗+CSV导出 |

## 技术栈

| 层级 | 技术 | 版本 | 用途 |
|------|------|------|------|
| 框架 | Next.js (App Router) | 16.2 | 全栈 React，SSR + API Routes |
| 语言 | TypeScript | 5.x | 全栈类型安全 |
| 样式 | Tailwind CSS + shadcn/ui | v4 | 响应式 UI |
| 数据库 | PostgreSQL | 16 | 主数据库 |
| ORM | Prisma | 7 | 类型安全数据库操作 |
| 认证 | NextAuth.js | v5 beta | JWT 会话，邮箱密码登录 |
| AI | Anthropic Claude API | claude-opus-4-6 | 面试对话/教练/解析/优化/评估 |
| 表格 | TanStack Table | v8 | 投递管理高级表格 |
| PDF | @react-pdf/renderer | - | 客户端简历 PDF 生成 |
| 表单 | React Hook Form + Zod | - | 表单处理 + 数据验证 |
| 容器 | Docker Compose | - | PostgreSQL + Redis |

## 运行方式

### 环境要求

- Node.js >= 20
- Docker & Docker Compose
- Anthropic API Key

### 本地开发

```bash
# 1. 克隆项目
git clone https://github.com/Tianfang-Hao/AIIC_interviewer2.git
cd AIIC_interviewer2

# 2. 安装依赖（自动生成 Prisma 客户端）
npm install

# 3. 启动数据库
docker compose up -d

# 4. 配置环境变量
cp .env.example .env
# 编辑 .env，填写 ANTHROPIC_API_KEY（必须）和 ANTHROPIC_BASE_URL（可选代理）

# 5. 同步数据库表结构
npx prisma db push

# 6. 导入种子数据（40条示例岗位）
npm run prisma:seed

# 7. 启动开发服务器
npm run dev
```

访问 http://localhost:3000

### 生产部署

```bash
npm run build
PORT=80 npm start
```

### 环境变量

| 变量 | 必须 | 说明 |
|------|------|------|
| `DATABASE_URL` | 是 | PostgreSQL 连接串 |
| `NEXTAUTH_SECRET` | 是 | JWT 加密密钥（`openssl rand -base64 32` 生成） |
| `AUTH_TRUST_HOST` | 生产环境 | 设为 `true` |
| `ANTHROPIC_API_KEY` | AI功能 | Anthropic API 密钥 |
| `ANTHROPIC_BASE_URL` | 否 | API 代理地址（国内服务器需要） |

## 项目结构

```
src/
├── app/
│   ├── (auth)/              # 登录/注册
│   ├── (dashboard)/         # 所有业务页面
│   │   ├── dashboard/       # 仪表盘 + 新手引导
│   │   ├── resumes/         # 简历（上传/解析/版本/对比/导出/优化）
│   │   ├── jobs/            # 岗位（列表/详情/添加/匹配）
│   │   ├── applications/    # 投递管理
│   │   ├── interviews/      # 模拟面试 + 双栏教练
│   │   ├── mistakes/        # 错题本
│   │   └── preferences/     # 求职意向
│   └── api/                 # 20 个 API 端点
├── components/
│   ├── ui/                  # shadcn/ui 基础组件
│   ├── layout/              # 侧边栏、头部、移动端导航
│   └── features/            # 业务组件
│       ├── interview/       # 教练卡片、教练面板、雷达图、聊天
│       ├── resume/          # 上传、编辑、版本、PDF
│       ├── job/             # 岗位卡片、匹配详情
│       ├── application/     # 表格、看板、添加表单
│       └── mistakes/        # 错题列表
└── lib/
    ├── ai/                  # AI 服务层
    │   ├── interview-coach.ts    # 实时教练（面试官OS+评分+建议+话术）
    │   ├── interview-prompts.ts  # 面试官 Prompt 生成
    │   ├── interview-evaluator.ts# 面试评估报告
    │   ├── resume-parser.ts      # 简历 AI 解析
    │   └── resume-optimizer.ts   # 简历 AI 优化
    ├── services/
    │   └── job-matcher.ts        # 五维度匹配算法
    ├── auth.ts              # NextAuth 配置
    └── prisma.ts            # 数据库客户端

prisma/
├── schema.prisma            # 8 个数据模型 + 5 个枚举
└── seed.ts                  # 种子数据

docker-compose.yml           # PostgreSQL 16 + Redis 7
```

## Commit History

本项目采用增量开发模式，每个功能模块独立提交，commit history 完整记录了从零到一的开发过程。

## License

MIT
