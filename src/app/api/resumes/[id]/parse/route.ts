import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { extractText, parseResumeWithAI } from '@/lib/ai/resume-parser';
import path from 'path';

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

    // Find resume and verify ownership
    const resume = await prisma.resume.findUnique({
      where: { id },
    });

    if (!resume) {
      return Response.json({ error: '简历不存在' }, { status: 404 });
    }

    if (resume.userId !== session.user.id) {
      return Response.json({ error: '无权操作此简历' }, { status: 403 });
    }

    if (!resume.fileUrl) {
      return Response.json({ error: '简历文件不存在' }, { status: 400 });
    }

    // Resolve file path on disk
    const filePath = path.join(process.cwd(), 'public', resume.fileUrl);

    // Extract text from the file
    const text = await extractText(filePath);

    if (!text || text.trim().length === 0) {
      return Response.json(
        { error: '无法从文件中提取文本，请确保文件内容有效' },
        { status: 400 }
      );
    }

    // Parse with AI
    const parsedData = await parseResumeWithAI(text);

    // Save to database
    const parsedJson = JSON.parse(JSON.stringify(parsedData));
    const updatedResume = await prisma.resume.update({
      where: { id },
      data: { parsedData: parsedJson },
    });

    // Auto-create initial "默认版本" if no versions exist yet
    const versionCount = await prisma.resumeVersion.count({
      where: { resumeId: id },
    });

    if (versionCount === 0) {
      await prisma.resumeVersion.create({
        data: {
          resumeId: id,
          name: '默认版本',
          content: parsedJson,
        },
      });
    }

    return Response.json(updatedResume);
  } catch (error) {
    console.error('Parse error:', error);
    const message =
      error instanceof Error ? error.message : '解析失败，请重试';
    return Response.json({ error: message }, { status: 500 });
  }
}
