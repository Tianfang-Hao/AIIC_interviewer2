import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { unlink } from 'fs/promises';
import path from 'path';

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

    const resume = await prisma.resume.findUnique({
      where: { id },
    });

    if (!resume) {
      return Response.json({ error: '简历不存在' }, { status: 404 });
    }

    if (resume.userId !== session.user.id) {
      return Response.json({ error: '无权查看此简历' }, { status: 403 });
    }

    return Response.json(resume);
  } catch (error) {
    console.error('Get resume error:', error);
    return Response.json({ error: '获取简历失败' }, { status: 500 });
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

    // Find resume and verify ownership
    const resume = await prisma.resume.findUnique({
      where: { id },
    });

    if (!resume) {
      return Response.json({ error: '简历不存在' }, { status: 404 });
    }

    if (resume.userId !== session.user.id) {
      return Response.json({ error: '无权修改此简历' }, { status: 403 });
    }

    const body = await request.json();
    const { parsedData } = body;

    if (!parsedData) {
      return Response.json(
        { error: '缺少 parsedData 字段' },
        { status: 400 }
      );
    }

    const updatedResume = await prisma.resume.update({
      where: { id },
      data: { parsedData },
    });

    return Response.json(updatedResume);
  } catch (error) {
    console.error('Update resume error:', error);
    return Response.json({ error: '保存失败，请重试' }, { status: 500 });
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

    // Find resume and verify ownership
    const resume = await prisma.resume.findUnique({
      where: { id },
    });

    if (!resume) {
      return Response.json({ error: '简历不存在' }, { status: 404 });
    }

    if (resume.userId !== session.user.id) {
      return Response.json({ error: '无权删除此简历' }, { status: 403 });
    }

    // Delete file from disk
    if (resume.fileUrl) {
      const filePath = path.join(process.cwd(), 'public', resume.fileUrl);
      try {
        await unlink(filePath);
      } catch {
        // File might not exist on disk, continue with DB deletion
        console.warn(`File not found on disk: ${filePath}`);
      }
    }

    // Delete resume record (cascades to versions)
    await prisma.resume.delete({
      where: { id },
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    return Response.json({ error: '删除失败，请重试' }, { status: 500 });
  }
}
