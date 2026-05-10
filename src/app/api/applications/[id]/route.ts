import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: '请先登录' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.application.findUnique({ where: { id } });
    if (!existing || existing.userId !== session.user.id) {
      return Response.json({ error: '投递记录不存在' }, { status: 404 });
    }

    const data: Record<string, unknown> = {};

    if (body.company !== undefined) data.company = body.company;
    if (body.position !== undefined) data.position = body.position;
    if (body.department !== undefined) data.department = body.department || null;
    if (body.status !== undefined) data.status = body.status;
    if (body.priority !== undefined) data.priority = body.priority;
    if (body.location !== undefined) data.location = body.location || null;
    if (body.notes !== undefined) data.notes = body.notes || null;
    if (body.salaryInfo !== undefined)
      data.salaryInfo = body.salaryInfo || null;
    if (body.jdLink !== undefined) data.jdLink = body.jdLink || null;
    if (body.deadline !== undefined)
      data.deadline = body.deadline ? new Date(body.deadline) : null;

    const updated = await prisma.application.update({
      where: { id },
      data,
    });

    return Response.json(updated);
  } catch (error) {
    console.error('Update application error:', error);
    return Response.json({ error: '更新投递记录失败' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: '请先登录' }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.application.findUnique({ where: { id } });
    if (!existing || existing.userId !== session.user.id) {
      return Response.json({ error: '投递记录不存在' }, { status: 404 });
    }

    await prisma.application.delete({ where: { id } });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Delete application error:', error);
    return Response.json({ error: '删除投递记录失败' }, { status: 500 });
  }
}
