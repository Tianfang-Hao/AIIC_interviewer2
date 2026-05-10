import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { FileText, Target, Send, MessageSquare, Settings } from 'lucide-react';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

const stats = [
  {
    title: '简历数量',
    value: '0',
    description: '已上传的简历',
    icon: FileText,
  },
  {
    title: '匹配岗位',
    value: '0',
    description: '智能匹配的岗位',
    icon: Target,
  },
  {
    title: '投递中',
    value: '0',
    description: '正在进行的申请',
    icon: Send,
  },
  {
    title: '模拟面试',
    value: '0',
    description: '已完成的面试练习',
    icon: MessageSquare,
  },
];

export default async function DashboardPage() {
  const session = await auth();
  const userName = session?.user?.name || '用户';

  // Check if user has set job preferences
  let hasPreference = false;
  if (session?.user?.id) {
    const preference = await prisma.jobPreference.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    hasPreference = !!preference;
  }

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

      {!hasPreference && (
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
          <Card key={stat.title}>
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
        ))}
      </div>
    </div>
  );
}
