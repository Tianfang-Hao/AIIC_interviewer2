import Link from 'next/link';
import { redirect } from 'next/navigation';
import { BookOpen, MessageSquare } from 'lucide-react';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@/generated/prisma/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MistakesList } from '@/components/features/mistakes/mistakes-list';
import type { MistakeItem } from '@/components/features/mistakes/mistakes-list';
import type { CoachCard } from '@/lib/ai/interview-coach';

export default async function MistakesPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  // Fetch all interviews with coach cards
  const interviews = await prisma.mockInterview.findMany({
    where: {
      userId: session.user.id,
      coachCards: { not: Prisma.DbNull },
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      round: true,
      style: true,
      jobId: true,
      coachCards: true,
      createdAt: true,
      job: {
        select: {
          company: true,
          positionName: true,
        },
      },
    },
  });

  // Aggregate weak/bookmarked cards
  const mistakeItems: MistakeItem[] = [];

  for (const interview of interviews) {
    if (!interview.coachCards || !Array.isArray(interview.coachCards)) continue;

    const cards = interview.coachCards as unknown as CoachCard[];
    for (const card of cards) {
      if (card.isWeakPoint || card.isBookmarked) {
        mistakeItems.push({
          interviewId: interview.id,
          card,
          company: interview.job?.company ?? '未知公司',
          positionName: interview.job?.positionName ?? '未知岗位',
          interviewDate: interview.createdAt.toISOString(),
          round: interview.round,
          style: interview.style,
          jobId: interview.jobId,
        });
      }
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">错题本</h1>
          <Badge variant="secondary" className="text-sm">
            {mistakeItems.length}
          </Badge>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        自动收集面试中的薄弱项和手动收藏的题目，帮助你针对性地查漏补缺
      </p>

      {/* Content */}
      {mistakeItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-20">
          <BookOpen className="h-12 w-12 text-muted-foreground/40" />
          <p className="text-lg font-medium text-muted-foreground">
            暂无错题，继续加油！
          </p>
          <p className="text-sm text-muted-foreground">
            面试中得分 4 分及以下的题目会自动加入错题本
          </p>
          <Link href="/interviews">
            <Button>
              <MessageSquare className="mr-2 h-4 w-4" />
              开始新面试
            </Button>
          </Link>
        </div>
      ) : (
        <MistakesList items={mistakeItems} />
      )}
    </div>
  );
}
