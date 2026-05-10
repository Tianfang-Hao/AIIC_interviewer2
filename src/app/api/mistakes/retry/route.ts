import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { InterviewRound, InterviewStyle } from '@/generated/prisma/enums';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: '请先登录' }, { status: 401 });
    }

    const body = await request.json();
    const { question, jobId, round, style } = body as {
      question: string;
      jobId?: string | null;
      round: InterviewRound;
      style: InterviewStyle;
    };

    if (!question || !round || !style) {
      return Response.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }

    // Validate jobId exists if provided
    if (jobId) {
      const job = await prisma.job.findUnique({ where: { id: jobId } });
      if (!job) {
        return Response.json({ error: '关联岗位不存在' }, { status: 404 });
      }
    }

    // Create a new MockInterview with just the question as the first message
    const interview = await prisma.mockInterview.create({
      data: {
        userId: session.user.id,
        jobId: jobId || null,
        round,
        style,
        messages: [{ role: 'assistant', content: question }],
        coachCards: [],
      },
    });

    return Response.json({ id: interview.id }, { status: 201 });
  } catch (error) {
    console.error('Retry mistake error:', error);
    return Response.json({ error: '创建重练面试失败' }, { status: 500 });
  }
}
