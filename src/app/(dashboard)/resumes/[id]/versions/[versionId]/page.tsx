import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import { buttonVariants } from '@/components/ui/button';
import { VersionEditor } from '@/components/features/resume/version-editor';
import type { ParsedResume } from '@/lib/ai/resume-parser';

export default async function VersionEditorPage({
  params,
}: {
  params: Promise<{ id: string; versionId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  const { id, versionId } = await params;

  const resume = await prisma.resume.findUnique({
    where: { id },
    select: { id: true, userId: true, fileName: true },
  });

  if (!resume || resume.userId !== session.user.id) {
    notFound();
  }

  const version = await prisma.resumeVersion.findUnique({
    where: { id: versionId },
  });

  if (!version || version.resumeId !== id) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href={`/resumes/${id}`}
          className={buttonVariants({ variant: 'ghost', size: 'icon' })}
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {version.name}
          </h1>
          <p className="text-muted-foreground">
            {resume.fileName} - 版本编辑
          </p>
        </div>
      </div>

      <VersionEditor
        resumeId={id}
        versionId={versionId}
        initialData={version.content as unknown as ParsedResume}
      />
    </div>
  );
}
