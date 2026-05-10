import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
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
            id: true,
            company: true,
            positionName: true,
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

    return Response.json(interview);
  } catch (error) {
    console.error('Get interview error:', error);
    return Response.json({ error: '获取面试数据失败' }, { status: 500 });
  }
}
