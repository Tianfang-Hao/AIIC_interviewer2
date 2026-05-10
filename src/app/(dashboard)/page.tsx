import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { FileText, Target, Send, MessageSquare } from 'lucide-react';

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

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">欢迎使用 AI 求职助手</h1>
        <p className="text-muted-foreground">
          智能管理你的求职流程，从简历优化到面试准备，一站式搞定。
        </p>
      </div>

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
