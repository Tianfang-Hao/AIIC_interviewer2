# 进度记录

> 记录每一步完成的工作。

---

## Step 1: 项目初始化与基础设施 ✅
- Next.js 16.2.6 + TypeScript + Tailwind CSS
- shadcn/ui (v4, base-nova style) 初始化，安装组件: button, input, card, separator, avatar, dropdown-menu, sheet, label, badge
- Docker Compose: PostgreSQL 16 + Redis 7
- Prisma 7 配置 (prisma.config.ts + @prisma/adapter-pg)
- Dashboard 布局: sidebar + header + mobile nav
- Prettier 配置

## Step 2: 数据库 Schema + 用户认证 ✅
- 完整 Prisma Schema: User, Resume, ResumeVersion, Job, JobPreference, Application, MockInterview
- NextAuth.js v5 (Credentials provider, JWT strategy)
- 登录/注册页面 (react-hook-form + zod)
- proxy.ts 路由保护 (Next.js 16 pattern)
- Dashboard 显示用户名

## Step 3: 简历上传与文件管理 ✅
- 拖拽上传组件 + 进度条
- PDF/DOCX 格式验证, 10MB 限制
- 文件存储 public/uploads/
- Resume 记录创建
- 简历列表页 + 删除功能

## Step 4: AI 简历解析 ✅
- pdf-parse + mammoth 文本提取
- Claude API 结构化解析 (claude-sonnet-4-6)
- 解析结果可编辑表单 (basic_info, education, experiences, skills, awards, certifications)
- 保存到 parsedData

## Step 5: 简历多版本管理 ✅
- 版本 CRUD API
- 版本列表: 创建/复制/重命名/删除
- 提取共享的 ResumeEditForm 组件
- 版本间 diff 对比 (逐字段比较, 颜色高亮)
- 解析后自动创建"默认版本"

## Step 6: 求职意向设置 ✅
- 多选 toggle 按钮: 岗位方向/城市/行业
- 单选: 求职类型/公司规模
- 薪资区间输入
- Prisma upsert
- 新用户 Dashboard 引导卡片

## Step 7: 岗位数据模型与手动录入 ✅
- Job CRUD API (搜索 + 城市/类型筛选 + 分页)
- 岗位列表页 (卡片布局)
- 岗位详情页
- 手动添加岗位表单
- 种子数据: 20家公司 × 2-3 岗位 ≈ 50条

## Step 8: 智能岗位匹配 ✅
- 关键词匹配算法 (5维度加权)
- 技能(30%) + 经历(25%) + 硬性条件(20%) + 行业(15%) + 优先(10%)
- 匹配度百分比 badge (绿/黄/红)
- 匹配详情: 命中/缺失技能
- 排序切换: 匹配度 / 时间

## Step 9: AI 简历优化 ✅
- Claude API 生成优化方案 (5 部分结构)
- 逐条接受/拒绝修改建议 (checkbox)
- 一键应用 → 创建新版本
- 岗位详情页"优化简历"按钮

## Step 10: 投递管理基础表格 ✅
- TanStack Table
- 内联编辑: 进度/优先级下拉, 备注文本
- 手动添加投递记录
- 从岗位详情"标记已投递"

## Step 11: 投递管理高级功能 ✅
- 状态/优先级筛选下拉
- 批量操作: 选中多行, 批量更新/删除
- 数据看板: 总数/各状态/本周新增
- 转化漏斗图 (纯 Tailwind CSS)
- CSV 导出 (BOM 兼容 Excel)

## Step 12: 模拟面试基础框架 ✅
- 面试设置页: 选岗位/轮次/风格
- Chat 界面: SSE 流式响应 + 打字机效果
- 面试计时器 (MM:SS)
- 面试官角色 Prompt (轮次×风格差异化)
- 面试历史列表

## Step 13: 三轮面试与评估 ✅
- Claude API 评估: 各题评分(1-10) + 亮点 + 改进 + 参考答案
- 综合评级: pass/needs_improvement/fail
- 评估报告页面 (可折叠逐题分析)
- 结束面试 → 自动生成评估

## Step 14: 简历 PDF 导出 ✅
- @react-pdf/renderer 客户端生成
- 中文字体: Noto Sans SC (Google Fonts CDN)
- 版本选择器
- PDFViewer 预览 + 下载按钮
- A4 专业简洁模板

## Step 15: 整体优化与上线准备 ✅
- 营销落地页 (hero + 5 功能卡片 + CTA)
- Skeleton 加载骨架屏 (4 个 loading.tsx)
- Error boundary + 404 页面
- SEO: metadata + OpenGraph + Twitter Card
- Onboarding 引导卡片 (4 步骤进度条)
- .env.example 环境变量文档
