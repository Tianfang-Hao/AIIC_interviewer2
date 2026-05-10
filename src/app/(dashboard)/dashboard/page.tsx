import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  FileText,
  Target,
  Send,
  MessageSquare,
  Settings,
  Upload,
  Briefcase,
  Mic,
  CheckCircle,
} from 'lucide-react';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { redirect } from 'next/navigation';

const quickActions = [
  {
    title: '简历数量',
    description: '已上传的简历',
    icon: FileText,
    href: '/resumes',
  },
  {
    title: '匹配岗位',
    description: '智能匹配的岗位',
    icon: Target,
    href: '/jobs',
  },
  {
    title: '投递中',
    description: '正在进行的申请',
    icon: Send,
    href: '/applications',
  },
  {
    title: '模拟面试',
    description: '已完成的面试练习',
    icon: MessageSquare,
    href: '/interviews',
  },
];

interface OnboardingStep {
  key: string;
  label: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  done: boolean;
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  const userName = session?.user?.name || '用户';

  let hasPreference = false;
  let hasResume = false;
  let hasJob = false;
  let hasInterview = false;
  let resumeCount = 0;
  let jobCount = 0;
  let applicationCount = 0;
  let interviewCount = 0;

  if (session?.user?.id) {
    const [preference, resumes, jobs, applications, interviews] =
      await Promise.all([
        prisma.jobPreference.findUnique({
          where: { userId: session.user.id },
          select: { id: true },
        }),
        prisma.resume.count({
          where: { userId: session.user.id },
        }),
        prisma.job.count(),
        prisma.application.count({
          where: { userId: session.user.id },
        }),
        prisma.mockInterview.count({
          where: { userId: session.user.id },
        }),
      ]);

    hasPreference = !!preference;
    hasResume = resumes > 0;
    hasJob = jobs > 0;
    hasInterview = interviews > 0;
    resumeCount = resumes;
    jobCount = jobs;
    applicationCount = applications;
    interviewCount = interviews;
  }

  const stats = [
    { ...quickActions[0], value: String(resumeCount) },
    { ...quickActions[1], value: String(jobCount) },
    { ...quickActions[2], value: String(applicationCount) },
    { ...quickActions[3], value: String(interviewCount) },
  ];

  const onboardingSteps: OnboardingStep[] = [
    {
      key: 'resume',
      label: '上传简历',
      description: '上传你的第一份简历，系统将自动解析关键信息',
      href: '/resumes/upload',
      icon: Upload,
      done: hasResume,
    },
    {
      key: 'preference',
      label: '设置求职意向',
      description: '设定目标城市、岗位类型、薪资期望等偏好',
      href: '/preferences',
      icon: Settings,
      done: hasPreference,
    },
    {
      key: 'job',
      label: '浏览匹配岗位',
      description: '添加目标岗位，查看智能匹配分数',
      href: '/jobs',
      icon: Briefcase,
      done: hasJob,
    },
    {
      key: 'interview',
      label: '开始模拟面试',
      description: '选择岗位和面试轮次，进行AI模拟面试',
      href: '/interviews',
      icon: Mic,
      done: hasInterview,
    },
  ];

  const allDone = onboardingSteps.every((s) => s.done);
  const completedCount = onboardingSteps.filter((s) => s.done).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          你好，{userName}
        </h1>
        <p className="text-muted-foreground">
          智能管理你的求职流程，从简历优化到面试准备，一站式搞定。
        </p>
      </div>

      {/* Onboarding guide - show when not all steps done */}
      {!allDone && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">快速入门指南</CardTitle>
                <CardDescription>
                  完成以下步骤，充分利用 AI 求职助手的全部功能
                </CardDescription>
              </div>
              <span className="text-sm font-medium text-muted-foreground">
                {completedCount}/{onboardingSteps.length}
              </span>
            </div>
            {/* Progress bar */}
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{
                  width: `${(completedCount / onboardingSteps.length) * 100}%`,
                }}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {onboardingSteps.map((step, index) => (
                <Link
                  key={step.key}
                  href={step.href}
                  className={`flex items-start gap-3 rounded-lg border p-3 transition-colors ${
                    step.done
                      ? 'border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20'
                      : 'border-input hover:border-primary/50 hover:bg-accent/50'
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium ${
                      step.done
                        ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                        : 'bg-primary/10 text-primary'
                    }`}
                  >
                    {step.done ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <div className="min-w-0">
                    <p
                      className={`text-sm font-medium ${step.done ? 'text-green-700 line-through dark:text-green-300' : ''}`}
                    >
                      {step.label}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preference prompt (legacy, only show if onboarding all done but no preference) */}
      {allDone && !hasPreference && (
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader className="flex flex-row items-center gap-3 pb-2">
            <Settings className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-base">设置求职意向</CardTitle>
              <CardDescription>
                完善你的求职偏好，获取更精准的岗位匹配推荐
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Link
              href="/preferences"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
            >
              <Settings className="h-4 w-4" />
              立即设置
            </Link>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <Card className="transition-shadow hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <CardDescription>{stat.description}</CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
