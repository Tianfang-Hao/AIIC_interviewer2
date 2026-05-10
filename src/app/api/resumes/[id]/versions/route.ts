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

    const versions = await prisma.resumeVersion.findMany({
      where: { resumeId: id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        createdAt: true,
        resumeId: true,
      },
    });

    return Response.json(versions);
  } catch (error) {
    console.error('List versions error:', error);
    return Response.json({ error: '获取版本列表失败' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: '请先登录' }, { status: 401 });
    }

    const { id } = await params;

    // Verify resume ownership
    const resume = await prisma.resume.findUnique({
      where: { id },
      select: { userId: true, parsedData: true },
    });

    if (!resume) {
      return Response.json({ error: '简历不存在' }, { status: 404 });
    }

    if (resume.userId !== session.user.id) {
      return Response.json({ error: '无权操作此简历' }, { status: 403 });
    }

    const body = await request.json();
    const { name, content, baseVersionId } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return Response.json({ error: '版本名称不能为空' }, { status: 400 });
    }

    let versionContent = content;

    // If baseVersionId provided, copy content from that version
    if (baseVersionId) {
      const baseVersion = await prisma.resumeVersion.findUnique({
        where: { id: baseVersionId },
        select: { content: true, resumeId: true },
      });

      if (!baseVersion || baseVersion.resumeId !== id) {
        return Response.json(
          { error: '基础版本不存在' },
          { status: 404 }
        );
      }

      versionContent = baseVersion.content;
    }

    // If still no content, use resume's parsedData
    if (!versionContent && resume.parsedData) {
      versionContent = resume.parsedData;
    }

    // If still no content, use empty structure
    if (!versionContent) {
      versionContent = {
        basic_info: {
          name: '',
          phone: '',
          email: '',
          education: [],
        },
        experiences: [],
        skills: [],
        awards: [],
        certifications: [],
      };
    }

    const version = await prisma.resumeVersion.create({
      data: {
        resumeId: id,
        name: name.trim(),
        content: versionContent,
      },
    });

    return Response.json(version, { status: 201 });
  } catch (error) {
    console.error('Create version error:', error);
    return Response.json({ error: '创建版本失败' }, { status: 500 });
  }
}
