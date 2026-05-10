import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import {
  ArrowLeft,
  Building2,
  MapPin,
  Calendar,
  Briefcase,
  ExternalLink,
  Users,
  Clock,
  Sparkles,
} from 'lucide-react';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@/generated/prisma/client';
import { buttonVariants } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { JOB_TYPE_LABELS } from '@/lib/validations/job';
import { DeleteJobButton } from '@/components/features/job/delete-job-button';
import { MarkAppliedButton } from '@/components/features/application/mark-applied-button';
import {
  MatchScoreBadge,
  MatchDetailInline,
} from '@/components/features/job/match-detail';
import { calculateMatchScore } from '@/lib/services/job-matcher';
import type { ParsedResume } from '@/lib/ai/resume-parser';
import type { MatchInfo } from '@/components/features/job/match-detail';

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const userId = session.user.id;
  const { id } = await params;
  const job = await prisma.job.findUnique({ where: { id } });

  if (!job) {
    notFound();
  }

  // Calculate match score if user has resume and preferences
  let matchInfo: MatchInfo | null = null;

  const [resume, preference, existingApplication] = await Promise.all([
    prisma.resume.findFirst({
      where: { userId, parsedData: { not: Prisma.DbNull } },
      orderBy: { updatedAt: 'desc' },
      select: { id: true, parsedData: true },
    }),
    prisma.jobPreference.findUnique({
      where: { userId },
    }),
    prisma.application.findFirst({
      where: { userId, jobId: id },
      select: { id: true },
    }),
  ]);

  if (resume?.parsedData && preference) {
    const parsedResume = resume.parsedData as unknown as ParsedResume;
    const result = calculateMatchScore(
      parsedResume,
      {
        positions: preference.positions,
        jobType: preference.jobType,
        cities: preference.cities,
        companySize: preference.companySize,
        industries: preference.industries,
        salaryMin: preference.salaryMin,
        salaryMax: preference.salaryMax,
      },
      {
        id: job.id,
        company: job.company,
        positionName: job.positionName,
        department: job.department,
        jobType: job.jobType,
        location: job.location,
        jdContent: job.jdContent,
        requirements: job.requirements,
        preferred: job.preferred,
        salaryRange: job.salaryRange,
        industry: job.industry,
        companySize: job.companySize,
      }
    );
    matchInfo = result;
  }

  const formatDate = (date: Date | null) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Back navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/jobs"
          className={buttonVariants({ variant: 'ghost', size: 'sm' })}
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          返回岗位列表
        </Link>
        <div className="flex items-center gap-2">
          <MarkAppliedButton
            jobId={job.id}
            company={job.company}
            position={job.positionName}
            department={job.department}
            location={job.location.length > 0 ? job.location[0] : null}
            alreadyApplied={!!existingApplication}
          />
          {resume?.id && (
            <Link
              href={`/resumes/${resume.id}/optimize?jobId=${job.id}`}
              className={buttonVariants({ variant: 'default', size: 'sm' })}
            >
              <Sparkles className="mr-1 h-4 w-4" />
              针对此岗位优化简历
            </Link>
          )}
          <DeleteJobButton jobId={job.id} jobName={job.positionName} />
        </div>
      </div>

      {/* Main info card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <CardTitle className="text-xl">{job.positionName}</CardTitle>
                {matchInfo && (
                  <MatchScoreBadge score={matchInfo.totalScore} />
                )}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Building2 className="h-4 w-4" />
                  {job.company}
                </span>
                {job.department && <span>· {job.department}</span>}
                {job.industry && <span>· {job.industry}</span>}
              </div>
            </div>
            <Badge
              variant={job.jobType === 'INTERN' ? 'secondary' : 'outline'}
            >
              {JOB_TYPE_LABELS[job.jobType] || job.jobType}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Location */}
            {job.location.length > 0 && (
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">工作地点</p>
                  <div className="mt-0.5 flex flex-wrap gap-1">
                    {job.location.map((loc) => (
                      <Badge key={loc} variant="secondary" className="text-xs">
                        {loc}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Salary */}
            {job.salaryRange && (
              <div className="flex items-start gap-2">
                <Briefcase className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">薪资范围</p>
                  <p className="mt-0.5 font-medium text-green-600 dark:text-green-400">
                    {job.salaryRange}
                  </p>
                </div>
              </div>
            )}

            {/* Post date */}
            {job.postDate && (
              <div className="flex items-start gap-2">
                <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">发布日期</p>
                  <p className="mt-0.5 text-sm">{formatDate(job.postDate)}</p>
                </div>
              </div>
            )}

            {/* Deadline */}
            {job.deadline && (
              <div className="flex items-start gap-2">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">截止日期</p>
                  <p className="mt-0.5 text-sm">{formatDate(job.deadline)}</p>
                </div>
              </div>
            )}

            {/* Company size */}
            {job.companySize && (
              <div className="flex items-start gap-2">
                <Users className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">公司规模</p>
                  <p className="mt-0.5 text-sm">{job.companySize}</p>
                </div>
              </div>
            )}
          </div>

          {/* Source URL */}
          {job.sourceUrl && (
            <div className="mt-4">
              <a
                href={job.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                查看原始链接
              </a>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Match score breakdown */}
      {matchInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              岗位匹配分析
              <MatchScoreBadge score={matchInfo.totalScore} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MatchDetailInline match={matchInfo} />
          </CardContent>
        </Card>
      )}

      {/* Optimize resume prompt */}
      {!resume?.id && (
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground">
              上传并解析简历后，即可使用「针对此岗位优化简历」功能。
              <Link href="/resumes" className="ml-1 text-primary hover:underline">
                去上传简历
              </Link>
            </p>
          </CardContent>
        </Card>
      )}

      {/* JD Content */}
      {job.jdContent && (
        <Card>
          <CardHeader>
            <CardTitle>职位描述</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="whitespace-pre-wrap text-sm leading-relaxed">
              {job.jdContent}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Requirements */}
      {job.requirements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>任职要求</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-inside list-disc space-y-1.5 text-sm">
              {job.requirements.map((req, i) => (
                <li key={i}>{req}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Preferred */}
      {job.preferred.length > 0 && (
        <>
          <Separator />
          <Card>
            <CardHeader>
              <CardTitle>优先条件</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-inside list-disc space-y-1.5 text-sm">
                {job.preferred.map((pref, i) => (
                  <li key={i}>{pref}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
