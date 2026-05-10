import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@/generated/prisma/client';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: '请先登录' }, { status: 401 });
    }

    const { id, versionId } = await params;

    // Verify resume ownership
    const resume = await prisma.resume.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!resume) {
      return Response.json({ error: '简历不存在' }, { status: 404 });
    }

    if (resume.userId !== session.user.id) {
      return Response.json({ error: '无权查看此简历' }, { status: 403 });
    }

    const version = await prisma.resumeVersion.findUnique({
      where: { id: versionId },
    });

    if (!version || version.resumeId !== id) {
      return Response.json({ error: '版本不存在' }, { status: 404 });
    }

    return Response.json(version);
  } catch (error) {
    console.error('Get version error:', error);
    return Response.json({ error: '获取版本失败' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: '请先登录' }, { status: 401 });
    }

    const { id, versionId } = await params;

    // Verify resume ownership
    const resume = await prisma.resume.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!resume) {
      return Response.json({ error: '简历不存在' }, { status: 404 });
    }

    if (resume.userId !== session.user.id) {
      return Response.json({ error: '无权修改此简历' }, { status: 403 });
    }

    const version = await prisma.resumeVersion.findUnique({
      where: { id: versionId },
    });

    if (!version || version.resumeId !== id) {
      return Response.json({ error: '版本不存在' }, { status: 404 });
    }

    const body = await request.json();
    const updateData: Prisma.ResumeVersionUpdateInput = {};

    if (body.name !== undefined) {
      if (typeof body.name !== 'string' || body.name.trim().length === 0) {
        return Response.json(
          { error: '版本名称不能为空' },
          { status: 400 }
        );
      }
      updateData.name = body.name.trim();
    }

    if (body.content !== undefined) {
      updateData.content = body.content;
    }

    if (Object.keys(updateData).length === 0) {
      return Response.json(
        { error: '没有需要更新的字段' },
        { status: 400 }
      );
    }

    const updated = await prisma.resumeVersion.update({
      where: { id: versionId },
      data: updateData,
    });

    return Response.json(updated);
  } catch (error) {
    console.error('Update version error:', error);
    return Response.json({ error: '更新版本失败' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: '请先登录' }, { status: 401 });
    }

    const { id, versionId } = await params;

    // Verify resume ownership
    const resume = await prisma.resume.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!resume) {
      return Response.json({ error: '简历不存在' }, { status: 404 });
    }

    if (resume.userId !== session.user.id) {
      return Response.json({ error: '无权删除此版本' }, { status: 403 });
    }

    const version = await prisma.resumeVersion.findUnique({
      where: { id: versionId },
    });

    if (!version || version.resumeId !== id) {
      return Response.json({ error: '版本不存在' }, { status: 404 });
    }

    // Check if this is the last version - refuse to delete
    const versionCount = await prisma.resumeVersion.count({
      where: { resumeId: id },
    });

    if (versionCount <= 1) {
      return Response.json(
        { error: '至少需要保留一个版本，无法删除' },
        { status: 400 }
      );
    }

    await prisma.resumeVersion.delete({
      where: { id: versionId },
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Delete version error:', error);
    return Response.json({ error: '删除版本失败' }, { status: 500 });
  }
}
