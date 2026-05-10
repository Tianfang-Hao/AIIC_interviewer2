import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@/generated/prisma/client';
import {
  generateCoachFeedback,
  type CoachCard,
} from '@/lib/ai/interview-coach';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: '请先登录' }, { status: 401 });
    }

    const body = await request.json();
    const { interviewId, question, answer, round, questionIndex } = body as {
      interviewId: string;
      question: string;
      answer: string;
      round: string;
      questionIndex: number;
    };

    if (!interviewId || !question || !answer || round == null || questionIndex == null) {
      return Response.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }

    // Verify interview exists and belongs to user
    const interview = await prisma.mockInterview.findUnique({
      where: { id: interviewId },
      include: {
        job: {
          select: {
            company: true,
            positionName: true,
            department: true,
            jdContent: true,
            requirements: true,
          },
        },
      },
    });

    if (!interview) {
      return Response.json({ error: '面试不存在' }, { status: 404 });
    }

    if (interview.userId !== session.user.id) {
      return Response.json({ error: '无权访问此面试' }, { status: 403 });
    }

    // Fetch user's latest resume parsedData
    let resumeData: Record<string, unknown> | null = null;
    const resume = await prisma.resume.findFirst({
      where: { userId: session.user.id, parsedData: { not: Prisma.DbNull } },
      orderBy: { updatedAt: 'desc' },
      select: { parsedData: true },
    });
    if (resume?.parsedData) {
      resumeData = resume.parsedData as Record<string, unknown>;
    }

    // Build JD string
    let jobJd: string | null = null;
    if (interview.job) {
      const parts: string[] = [];
      parts.push(`公司：${interview.job.company}`);
      parts.push(`岗位：${interview.job.positionName}`);
      if (interview.job.department) parts.push(`部门：${interview.job.department}`);
      if (interview.job.jdContent) parts.push(`职位描述：${interview.job.jdContent}`);
      if (interview.job.requirements && interview.job.requirements.length > 0) {
        parts.push(`要求：${interview.job.requirements.join('、')}`);
      }
      jobJd = parts.join('\n');
    }

    // Generate coach feedback
    const feedback = await generateCoachFeedback({
      question,
      answer,
      round,
      resumeData,
      jobJd,
    });

    // Build the full CoachCard
    const coachCard: CoachCard = {
      questionIndex,
      question,
      userAnswer: answer,
      isBookmarked: false,
      ...feedback,
    };

    // Append to MockInterview.coachCards array in DB
    const existingCards = (interview.coachCards as unknown as CoachCard[]) || [];
    const updatedCards = [...existingCards, coachCard];

    await prisma.mockInterview.update({
      where: { id: interviewId },
      data: {
        coachCards: JSON.parse(JSON.stringify(updatedCards)),
      },
    });

    return Response.json({ coachCard });
  } catch (error) {
    console.error('Coach feedback error:', error);
    return Response.json(
      { error: '生成教练反馈失败，请稍后重试' },
      { status: 500 }
    );
  }
}
