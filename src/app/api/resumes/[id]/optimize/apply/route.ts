import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { applyOptimizationPlan } from '@/lib/ai/resume-optimizer';
import type { OptimizationPlan } from '@/lib/ai/resume-optimizer';
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
    const { acceptedSuggestions, plan, jobId } = body as {
      acceptedSuggestions: string[];
      plan: OptimizationPlan;
      jobId: string;
    };

    if (!acceptedSuggestions || !Array.isArray(acceptedSuggestions)) {
      return Response.json({ error: '缺少已接受的建议列表' }, { status: 400 });
    }

    if (!plan) {
      return Response.json({ error: '缺少优化方案' }, { status: 400 });
    }

    if (!jobId || typeof jobId !== 'string') {
      return Response.json({ error: '缺少目标岗位ID' }, { status: 400 });
    }

    // Fetch resume
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
        { error: '简历尚未解析' },
        { status: 400 }
      );
    }

    // Fetch job for version name
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: { company: true, positionName: true },
    });

    if (!job) {
      return Response.json({ error: '目标岗位不存在' }, { status: 404 });
    }

    const parsedResume = resume.parsedData as unknown as ParsedResume;

    // Apply accepted suggestions
    const optimizedResume = applyOptimizationPlan(
      parsedResume,
      plan,
      acceptedSuggestions
    );

    // Create new version
    const versionName = `针对${job.company}-${job.positionName}优化版`;

    const version = await prisma.resumeVersion.create({
      data: {
        resumeId: id,
        name: versionName,
        content: JSON.parse(JSON.stringify(optimizedResume)),
      },
    });

    return Response.json({
      versionId: version.id,
      versionName: version.name,
    });
  } catch (error) {
    console.error('Apply optimization error:', error);
    return Response.json(
      { error: '应用优化方案失败' },
      { status: 500 }
    );
  }
}
