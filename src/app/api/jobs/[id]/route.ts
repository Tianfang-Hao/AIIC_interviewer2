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

    const job = await prisma.job.findUnique({
      where: { id },
    });

    if (!job) {
      return Response.json({ error: '岗位不存在' }, { status: 404 });
    }

    return Response.json(job);
  } catch (error) {
    console.error('Get job error:', error);
    return Response.json({ error: '获取岗位详情失败' }, { status: 500 });
  }
}

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

    const existing = await prisma.job.findUnique({ where: { id } });
    if (!existing) {
      return Response.json({ error: '岗位不存在' }, { status: 404 });
    }

    const data: Record<string, unknown> = {};

    if (body.company !== undefined) data.company = body.company;
    if (body.positionName !== undefined) data.positionName = body.positionName;
    if (body.department !== undefined) data.department = body.department || null;
    if (body.jobType !== undefined) data.jobType = body.jobType;
    if (body.location !== undefined) data.location = body.location;
    if (body.jdContent !== undefined) data.jdContent = body.jdContent || null;
    if (body.requirements !== undefined) data.requirements = body.requirements;
    if (body.preferred !== undefined) data.preferred = body.preferred;
    if (body.salaryRange !== undefined)
      data.salaryRange = body.salaryRange || null;
    if (body.postDate !== undefined)
      data.postDate = body.postDate ? new Date(body.postDate) : null;
    if (body.deadline !== undefined)
      data.deadline = body.deadline ? new Date(body.deadline) : null;
    if (body.sourceUrl !== undefined) data.sourceUrl = body.sourceUrl || null;
    if (body.companySize !== undefined)
      data.companySize = body.companySize || null;
    if (body.industry !== undefined) data.industry = body.industry || null;

    const updated = await prisma.job.update({
      where: { id },
      data,
    });

    return Response.json(updated);
  } catch (error) {
    console.error('Update job error:', error);
    return Response.json({ error: '更新岗位失败' }, { status: 500 });
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

    const existing = await prisma.job.findUnique({ where: { id } });
    if (!existing) {
      return Response.json({ error: '岗位不存在' }, { status: 404 });
    }

    await prisma.job.delete({ where: { id } });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Delete job error:', error);
    return Response.json({ error: '删除岗位失败' }, { status: 500 });
  }
}
