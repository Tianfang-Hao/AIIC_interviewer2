import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@/generated/prisma/client';
import {
  buildInterviewSystemPrompt,
  buildFirstQuestion,
  type InterviewContext,
} from '@/lib/ai/interview-prompts';
import type { InterviewRound, InterviewStyle } from '@/generated/prisma/enums';

// GET: list user's past interviews
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: '请先登录' }, { status: 401 });
    }

    const interviews = await prisma.mockInterview.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        round: true,
        style: true,
        createdAt: true,
        evaluation: true,
        job: {
          select: {
            id: true,
            company: true,
            positionName: true,
          },
        },
      },
    });

    return Response.json({ interviews });
  } catch (error) {
    console.error('List interviews error:', error);
    return Response.json({ error: '获取面试列表失败' }, { status: 500 });
  }
}

// POST: create a new interview and return the first question
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: '请先登录' }, { status: 401 });
    }

    const body = await request.json();
    const { jobId, round, style } = body as {
      jobId?: string;
      round: InterviewRound;
      style: InterviewStyle;
    };

    const VALID_ROUNDS = ['FIRST', 'SECOND', 'THIRD'];
    const VALID_STYLES = ['WARM', 'DETAIL', 'STRICT', 'DIVERGENT', 'SILENT'];

    if (!round || !style || !VALID_ROUNDS.includes(round) || !VALID_STYLES.includes(style)) {
      return Response.json(
        { error: '请选择有效的面试轮次和面试官风格' },
        { status: 400 }
      );
    }

    // Fetch job info if jobId is provided
    let jobInfo: InterviewContext['jobInfo'] = null;
    if (jobId) {
      const job = await prisma.job.findUnique({
        where: { id: jobId },
        select: {
          company: true,
          positionName: true,
          department: true,
          jdContent: true,
          requirements: true,
        },
      });
      if (job) {
        jobInfo = job;
      }
    }

    // Fetch user's latest resume for context
    let resumeData: Record<string, unknown> | null = null;
    const resume = await prisma.resume.findFirst({
      where: { userId: session.user.id, parsedData: { not: Prisma.DbNull } },
      orderBy: { updatedAt: 'desc' },
      select: { parsedData: true },
    });
    if (resume?.parsedData) {
      resumeData = resume.parsedData as Record<string, unknown>;
    }

    const ctx: InterviewContext = { round, style, jobInfo, resumeData };
    const firstQuestion = buildFirstQuestion(ctx);

    const initialMessages = [
      { role: 'assistant', content: firstQuestion },
    ];

    // Create the interview record
    const interview = await prisma.mockInterview.create({
      data: {
        userId: session.user.id,
        jobId: jobId || null,
        round,
        style,
        messages: initialMessages,
      },
    });

    return Response.json(
      {
        id: interview.id,
        firstMessage: firstQuestion,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create interview error:', error);
    return Response.json({ error: '创建面试失败' }, { status: 500 });
  }
}
