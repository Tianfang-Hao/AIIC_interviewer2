import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { jobSchema } from '@/lib/validations/job';

const VALID_JOB_TYPES = ['INTERN', 'CAMPUS', 'SOCIAL'];

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: '请先登录' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';
    const city = searchParams.get('city') || '';
    const jobType = searchParams.get('jobType') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '12', 10);

    const where: Record<string, unknown> = {};

    // Text search on company or positionName
    if (q) {
      where.OR = [
        { company: { contains: q, mode: 'insensitive' } },
        { positionName: { contains: q, mode: 'insensitive' } },
      ];
    }

    // Filter by city (check if the location array contains the city)
    if (city) {
      where.location = { has: city };
    }

    // Filter by jobType
    if (jobType && VALID_JOB_TYPES.includes(jobType)) {
      where.jobType = jobType;
    }

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          company: true,
          positionName: true,
          department: true,
          jobType: true,
          location: true,
          salaryRange: true,
          postDate: true,
          industry: true,
          companySize: true,
          createdAt: true,
        },
      }),
      prisma.job.count({ where }),
    ]);

    return Response.json({
      jobs,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error('List jobs error:', error);
    return Response.json({ error: '获取岗位列表失败' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: '请先登录' }, { status: 401 });
    }

    const body = await request.json();

    // Validate with Zod schema
    const parsed = jobSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        { error: '数据格式不正确', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const {
      company,
      positionName,
      department,
      jobType,
      location,
      jdContent,
      requirements,
      preferred,
      salaryRange,
      postDate,
      deadline,
      sourceUrl,
      companySize,
      industry,
    } = parsed.data;

    const job = await prisma.job.create({
      data: {
        createdBy: session.user.id,
        company,
        positionName,
        department: department || null,
        jobType: jobType || 'CAMPUS',
        location: Array.isArray(location) ? location : [],
        jdContent: jdContent || null,
        requirements: Array.isArray(requirements) ? requirements : [],
        preferred: Array.isArray(preferred) ? preferred : [],
        salaryRange: salaryRange || null,
        postDate: postDate ? new Date(postDate) : null,
        deadline: deadline ? new Date(deadline) : null,
        sourceUrl: sourceUrl || null,
        companySize: companySize || null,
        industry: industry || null,
      },
    });

    return Response.json(job, { status: 201 });
  } catch (error) {
    console.error('Create job error:', error);
    return Response.json({ error: '创建岗位失败' }, { status: 500 });
  }
}
