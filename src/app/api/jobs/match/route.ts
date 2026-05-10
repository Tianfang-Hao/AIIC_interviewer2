import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@/generated/prisma/client';
import type { ParsedResume } from '@/lib/ai/resume-parser';
import {
  calculateMatchScores,
  type JobForMatching,
  type PreferenceForMatching,
  type MatchResult,
} from '@/lib/services/job-matcher';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: '请先登录' }, { status: 401 });
    }

    const userId = session.user.id;

    // Fetch user's latest resume with parsedData
    const resume = await prisma.resume.findFirst({
      where: { userId, parsedData: { not: Prisma.DbNull } },
      orderBy: { updatedAt: 'desc' },
      select: { parsedData: true },
    });

    // Fetch user's job preferences
    const preference = await prisma.jobPreference.findUnique({
      where: { userId },
    });

    // Fetch all jobs (no pagination for match calculation)
    const jobs = await prisma.job.findMany({
      select: {
        id: true,
        company: true,
        positionName: true,
        department: true,
        jobType: true,
        location: true,
        jdContent: true,
        requirements: true,
        preferred: true,
        salaryRange: true,
        industry: true,
        companySize: true,
      },
    });

    // If no resume or no preferences, return jobs without match scores
    if (!resume?.parsedData || !preference) {
      return Response.json({
        matches: [] as MatchResult[],
        hasResume: !!resume?.parsedData,
        hasPreference: !!preference,
        jobCount: jobs.length,
      });
    }

    const parsedResume = resume.parsedData as unknown as ParsedResume;
    const pref: PreferenceForMatching = {
      positions: preference.positions,
      jobType: preference.jobType,
      cities: preference.cities,
      companySize: preference.companySize,
      industries: preference.industries,
      salaryMin: preference.salaryMin,
      salaryMax: preference.salaryMax,
    };

    const jobsForMatching: JobForMatching[] = jobs.map((j) => ({
      id: j.id,
      company: j.company,
      positionName: j.positionName,
      department: j.department,
      jobType: j.jobType,
      location: j.location,
      jdContent: j.jdContent,
      requirements: j.requirements,
      preferred: j.preferred,
      salaryRange: j.salaryRange,
      industry: j.industry,
      companySize: j.companySize,
    }));

    const matches = calculateMatchScores(parsedResume, pref, jobsForMatching);

    return Response.json({
      matches,
      hasResume: true,
      hasPreference: true,
      jobCount: jobs.length,
    });
  } catch (error) {
    console.error('Job match error:', error);
    return Response.json({ error: '计算匹配度失败' }, { status: 500 });
  }
}
