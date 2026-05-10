import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: '请先登录' }, { status: 401 });
    }

    const preference = await prisma.jobPreference.findUnique({
      where: { userId: session.user.id },
    });

    return Response.json(preference);
  } catch (error) {
    console.error('Get preferences error:', error);
    return Response.json({ error: '获取求职意向失败' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: '请先登录' }, { status: 401 });
    }

    const body = await request.json();
    const { positions, jobType, cities, companySize, industries, salaryMin, salaryMax } = body;

    const preference = await prisma.jobPreference.upsert({
      where: { userId: session.user.id },
      update: {
        positions: positions ?? [],
        jobType: jobType || null,
        cities: cities ?? [],
        companySize: companySize || null,
        industries: industries ?? [],
        salaryMin: salaryMin ?? null,
        salaryMax: salaryMax ?? null,
      },
      create: {
        userId: session.user.id,
        positions: positions ?? [],
        jobType: jobType || null,
        cities: cities ?? [],
        companySize: companySize || null,
        industries: industries ?? [],
        salaryMin: salaryMin ?? null,
        salaryMax: salaryMax ?? null,
      },
    });

    return Response.json(preference);
  } catch (error) {
    console.error('Save preferences error:', error);
    return Response.json({ error: '保存求职意向失败' }, { status: 500 });
  }
}
