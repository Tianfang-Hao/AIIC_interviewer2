import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: '请先登录' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || '';
    const priority = searchParams.get('priority') || '';

    const where: Record<string, unknown> = {
      userId: session.user.id,
    };

    if (
      status &&
      [
        'APPLIED',
        'SCREENING',
        'WRITTEN_TEST',
        'FIRST_INTERVIEW',
        'SECOND_INTERVIEW',
        'THIRD_INTERVIEW',
        'HR_INTERVIEW',
        'OFFER',
        'REJECTED',
      ].includes(status)
    ) {
      where.status = status;
    }

    if (priority && ['P0', 'P1', 'P2', 'P3'].includes(priority)) {
      where.priority = priority;
    }

    const applications = await prisma.application.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return Response.json({ applications });
  } catch (error) {
    console.error('List applications error:', error);
    return Response.json({ error: '获取投递列表失败' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: '请先登录' }, { status: 401 });
    }

    const body = await request.json();
    const { company, position, department, jobId, location, priority, notes } =
      body;

    if (!company || !position) {
      return Response.json(
        { error: '公司名称和岗位名称为必填项' },
        { status: 400 }
      );
    }

    const application = await prisma.application.create({
      data: {
        userId: session.user.id,
        company,
        position,
        department: department || null,
        jobId: jobId || null,
        location: location || null,
        priority: priority || 'P2',
        notes: notes || null,
      },
    });

    return Response.json(application, { status: 201 });
  } catch (error) {
    console.error('Create application error:', error);
    return Response.json({ error: '创建投递记录失败' }, { status: 500 });
  }
}
