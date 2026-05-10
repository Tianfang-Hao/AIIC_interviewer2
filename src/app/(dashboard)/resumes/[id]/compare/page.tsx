import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notFound, redirect } from 'next/navigation';
import { buttonVariants } from '@/components/ui/button';
import { CompareSelector } from '@/components/features/resume/compare-selector';

export default async function ComparePage({
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
    select: { id: true, userId: true, fileName: true },
  });

  if (!resume || resume.userId !== session.user.id) {
    notFound();
  }

  const versions = await prisma.resumeVersion.findMany({
    where: { resumeId: id },
    orderBy: { createdAt: 'desc' },
  });

  if (versions.length < 2) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center gap-4">
          <Link
            href={`/resumes/${id}`}
            className={buttonVariants({ variant: 'ghost', size: 'icon' })}
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">版本对比</h1>
        </div>
        <p className="text-muted-foreground">
          需要至少两个版本才能进行对比。请先创建更多版本。
        </p>
      </div>
    );
  }

  const versionData = versions.map((v) => ({
    id: v.id,
    name: v.name,
    content: v.content as Record<string, unknown>,
  }));

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href={`/resumes/${id}`}
          className={buttonVariants({ variant: 'ghost', size: 'icon' })}
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">版本对比</h1>
          <p className="text-muted-foreground">{resume.fileName}</p>
        </div>
      </div>

      <CompareSelector versions={versionData} />
    </div>
  );
}
