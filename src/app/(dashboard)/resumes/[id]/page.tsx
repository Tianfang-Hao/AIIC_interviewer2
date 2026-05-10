import Link from 'next/link';
import { ArrowLeft, FileDown } from 'lucide-react';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import { buttonVariants } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ResumeDetail } from '@/components/features/resume/resume-detail';
import { VersionList } from '@/components/features/resume/version-list';
import type { ParsedResume } from '@/lib/ai/resume-parser';

export default async function ResumeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  const { id } = await params;

  const resume = await prisma.resume.findUnique({
    where: { id },
  });

  if (!resume) {
    notFound();
  }

  if (resume.userId !== session.user.id) {
    notFound();
  }

  const hasParsedData = resume.parsedData !== null;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/resumes"
          className={buttonVariants({ variant: 'ghost', size: 'icon' })}
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">
            {resume.fileName}
          </h1>
          <p className="text-muted-foreground">
            上传于{' '}
            {new Date(resume.createdAt).toLocaleDateString('zh-CN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
        {hasParsedData && (
          <Link
            href={`/resumes/${resume.id}/export`}
            className={buttonVariants({ variant: 'outline', size: 'default' })}
          >
            <FileDown className="mr-1.5 h-4 w-4" />
            导出 PDF
          </Link>
        )}
      </div>

      <ResumeDetail
        resumeId={resume.id}
        fileName={resume.fileName}
        fileUrl={resume.fileUrl}
        parsedData={resume.parsedData as ParsedResume | null}
      />

      {/* Version management section - only show when resume is parsed */}
      {hasParsedData && (
        <>
          <Separator />
          <VersionList resumeId={resume.id} />
        </>
      )}
    </div>
  );
}
