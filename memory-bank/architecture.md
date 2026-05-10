# 架构文档

## 项目结构

```
ai-job-assistant/
├── memory-bank/                     # 项目记忆文档
├── prisma/
│   ├── schema.prisma                # 数据库模型定义 (8 models, 5 enums)
│   ├── seed.ts                      # 种子数据 (~50 条岗位)
│   └── prisma.config.ts             # Prisma 7 配置
├── src/
│   ├── app/
│   │   ├── layout.tsx               # 根布局 + SEO metadata
│   │   ├── page.tsx                 # 公开落地页
│   │   ├── not-found.tsx            # 404 页面
│   │   ├── (auth)/
│   │   │   ├── layout.tsx           # 居中布局
│   │   │   ├── login/page.tsx       # 登录
│   │   │   └── register/page.tsx    # 注册
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx           # 侧边栏 + 头部
│   │   │   ├── loading.tsx          # 骨架屏
│   │   │   ├── error.tsx            # 错误边界
│   │   │   ├── dashboard/page.tsx   # 仪表盘首页 + Onboarding
│   │   │   ├── resumes/             # 简历管理
│   │   │   │   ├── page.tsx         # 简历列表
│   │   │   │   ├── upload/page.tsx  # 上传
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx     # 详情/编辑
│   │   │   │       ├── export/      # PDF 导出
│   │   │   │       ├── optimize/    # AI 优化
│   │   │   │       ├── compare/     # 版本对比
│   │   │   │       └── versions/[versionId]/ # 版本编辑
│   │   │   ├── jobs/                # 岗位匹配
│   │   │   │   ├── page.tsx         # 列表 (搜索/筛选/匹配度)
│   │   │   │   ├── new/page.tsx     # 手动添加
│   │   │   │   └── [id]/page.tsx    # 详情 (匹配分析/优化/投递)
│   │   │   ├── applications/        # 投递管理
│   │   │   │   └── page.tsx         # 表格 + 看板 + 漏斗
│   │   │   ├── interviews/          # 模拟面试
│   │   │   │   ├── page.tsx         # 设置 + 历史
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx     # 聊天面试
│   │   │   │       └── evaluation/  # 评估报告
│   │   │   └── preferences/page.tsx # 求职意向
│   │   └── api/
│   │       ├── auth/                # NextAuth routes
│   │       ├── upload/              # 文件上传
│   │       ├── resumes/[id]/        # 简历 CRUD + parse + optimize
│   │       ├── jobs/                # 岗位 CRUD + match
│   │       ├── applications/        # 投递 CRUD
│   │       ├── interviews/          # 面试 CRUD + chat + evaluate
│   │       └── preferences/         # 意向 CRUD
│   ├── components/
│   │   ├── ui/                      # shadcn/ui 基础组件
│   │   ├── layout/                  # sidebar, header, mobile-nav
│   │   └── features/
│   │       ├── resume/              # 简历相关业务组件
│   │       ├── job/                 # 岗位相关
│   │       ├── application/         # 投递相关
│   │       └── interview/           # 面试相关
│   ├── lib/
│   │   ├── ai/                      # AI 服务
│   │   │   ├── resume-parser.ts     # 简历解析 (Claude)
│   │   │   ├── resume-optimizer.ts  # 简历优化 (Claude)
│   │   │   ├── interview-prompts.ts # 面试 Prompt 生成
│   │   │   └── interview-evaluator.ts # 面试评估 (Claude)
│   │   ├── services/
│   │   │   └── job-matcher.ts       # 岗位匹配算法
│   │   ├── constants/
│   │   │   └── application.ts       # 状态/优先级常量
│   │   ├── validations/             # Zod schemas
│   │   ├── auth.ts                  # NextAuth 配置
│   │   ├── prisma.ts                # Prisma 客户端单例
│   │   └── utils.ts                 # cn() 等工具
│   ├── proxy.ts                     # 路由保护 (Next.js 16)
│   └── generated/prisma/            # Prisma 生成代码 (gitignored)
├── docker-compose.yml               # PostgreSQL + Redis
├── .env.example                     # 环境变量模板
└── package.json
```

## 技术决策

| 决策 | 选择 | 原因 |
|------|------|------|
| 路由保护 | proxy.ts (非 middleware.ts) | Next.js 16 废弃了 middleware 约定 |
| Prisma 连接 | prisma.config.ts + @prisma/adapter-pg | Prisma 7 新模式 |
| 状态管理 | 无全局 store | 各页面独立状态，Server Components 直接查 DB |
| 文件上传 | public/uploads/ 本地存储 | V1.0 简化方案 |
| PDF 生成 | @react-pdf/renderer 客户端 | 避免服务端 puppeteer 依赖 |
| 岗位匹配 | 关键词加权算法 | V1.0 无 Embedding，后续升级 pgvector |
| 面试流式 | SSE (text/event-stream) | 不需要 WebSocket，Claude API 原生流式 |
| 组件库 | shadcn/ui v4 (base-ui) | 非 Radix UI，使用 render prop 而非 asChild |

## 数据库模型

- **User**: 用户基础信息 + 密码 (bcrypt)
- **Resume**: 上传的简历文件 + parsedData (Json)
- **ResumeVersion**: 简历版本 (content Json)
- **Job**: 岗位信息 (含 embedding 字段待用)
- **JobPreference**: 求职意向 (一对一 User)
- **Application**: 投递记录 (状态枚举 9 种)
- **MockInterview**: 模拟面试 (messages Json + evaluation Json)

## AI 调用点

1. 简历解析: Claude claude-sonnet-4-6 → 结构化 JSON
2. 简历优化: Claude claude-sonnet-4-6 → 5 部分优化方案
3. 模拟面试: Claude claude-sonnet-4-6 流式 → 面试官对话
4. 面试评估: Claude claude-sonnet-4-6 → 评分报告
