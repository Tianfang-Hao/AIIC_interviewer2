import Link from 'next/link';
import {
  FileText,
  Target,
  Sparkles,
  MessageSquare,
  ClipboardList,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';

const features = [
  {
    icon: FileText,
    title: '智能简历解析',
    description: '上传 PDF/DOCX 简历，AI 自动提取教育经历、工作经验、技能等关键信息',
  },
  {
    icon: Target,
    title: '岗位精准匹配',
    description: '基于简历内容和求职意向，智能计算每个岗位的匹配度并给出优化建议',
  },
  {
    icon: Sparkles,
    title: 'AI 简历优化',
    description: '针对目标岗位 JD，AI 给出具体的简历修改方案，一键应用到简历版本',
  },
  {
    icon: MessageSquare,
    title: '模拟面试训练',
    description: '三轮面试 + 五种面试官风格，AI 实时对话模拟并生成详细评估报告',
  },
  {
    icon: ClipboardList,
    title: '投递进度管理',
    description: '追踪所有投递记录、状态更新、优先级管理，支持批量操作和 CSV 导出',
  },
];

const highlights = [
  '基于 Claude AI 大模型驱动',
  '简历多版本管理与对比',
  '支持 PDF 简历导出',
  '数据安全本地化部署',
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2 font-semibold">
            <Target className="h-5 w-5 text-primary" />
            <span>AI 求职助手</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              登录
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              免费注册
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden border-b">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />
        <div className="relative mx-auto max-w-6xl px-4 py-20 text-center sm:py-28 lg:py-36">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            AI 求职助手
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            让求职更高效 — 从简历解析到面试准备，AI 全流程助力你的求职之路
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-base font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              免费开始使用
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-lg border px-6 py-3 text-base font-medium transition-colors hover:bg-accent"
            >
              已有账户？登录
            </Link>
          </div>
          {/* Highlights */}
          <div className="mx-auto mt-10 flex max-w-2xl flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {highlights.map((item) => (
              <span
                key={item}
                className="flex items-center gap-1.5 text-sm text-muted-foreground"
              >
                <CheckCircle className="h-4 w-4 text-green-600" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            核心功能
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
            五大核心模块，覆盖求职全流程
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-xl border bg-card p-6 transition-shadow hover:shadow-md"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <feature.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="mt-4 text-base font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:py-20">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            开始你的高效求职之旅
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
            注册账户，上传简历，几分钟内即可获得 AI 驱动的个性化求职建议
          </p>
          <Link
            href="/register"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-3 text-base font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            免费开始使用
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="mx-auto max-w-6xl px-4 text-center text-sm text-muted-foreground">
          <p>AI 求职助手 - 智能求职管理平台</p>
        </div>
      </footer>
    </div>
  );
}
