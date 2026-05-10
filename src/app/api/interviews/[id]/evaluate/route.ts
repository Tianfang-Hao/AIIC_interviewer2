import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateEvaluation } from '@/lib/ai/interview-evaluator';
import type { InterviewRound } from '@/generated/prisma/enums';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: '请先登录' }, { status: 401 });
    }

    const { id } = await params;

    const interview = await prisma.mockInterview.findUnique({
      where: { id },
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

    // If evaluation already exists, return it
    if (interview.evaluation) {
      return Response.json({ evaluation: interview.evaluation });
    }

    const messages = (interview.messages as unknown as ChatMessage[]) || [];

    // Build JD string for context
    let jobJd = '';
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

    // Generate evaluation
    const evaluation = await generateEvaluation(
      messages,
      interview.round as InterviewRound,
      jobJd
    );

    // Save evaluation to database
    await prisma.mockInterview.update({
      where: { id },
      data: { evaluation: JSON.parse(JSON.stringify(evaluation)) },
    });

    return Response.json({ evaluation });
  } catch (error) {
    console.error('Evaluate interview error:', error);
    return Response.json(
      { error: '生成面试评估失败，请稍后重试' },
      { status: 500 }
    );
  }
}
