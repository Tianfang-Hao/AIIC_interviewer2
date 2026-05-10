import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateOptimizationPlan } from '@/lib/ai/resume-optimizer';
import type { ParsedResume } from '@/lib/ai/resume-parser';

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
    const body = await request.json();
    const { jobId } = body;

    if (!jobId || typeof jobId !== 'string') {
      return Response.json({ error: '缺少目标岗位ID' }, { status: 400 });
    }

    // Fetch resume with parsed data
    const resume = await prisma.resume.findUnique({
      where: { id },
    });

    if (!resume) {
      return Response.json({ error: '简历不存在' }, { status: 404 });
    }

    if (resume.userId !== session.user.id) {
      return Response.json({ error: '无权操作此简历' }, { status: 403 });
    }

    if (!resume.parsedData) {
      return Response.json(
        { error: '简历尚未解析，请先上传并解析简历' },
        { status: 400 }
      );
    }

    // Fetch job
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: {
        company: true,
        positionName: true,
        jdContent: true,
        requirements: true,
        preferred: true,
      },
    });

    if (!job) {
      return Response.json({ error: '目标岗位不存在' }, { status: 404 });
    }

    const parsedResume = resume.parsedData as unknown as ParsedResume;

    const plan = await generateOptimizationPlan(parsedResume, job);

    return Response.json({ plan });
  } catch (error) {
    console.error('Optimization error:', error);
    return Response.json(
      { error: '生成优化方案失败，请稍后重试' },
      { status: 500 }
    );
  }
}
