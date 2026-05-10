import Link from 'next/link';
import { FileText, Plus, File } from 'lucide-react';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { buttonVariants } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { DeleteResumeButton } from '@/components/features/resume/delete-resume-button';

export default async function ResumesPage() {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }

  const resumes = await prisma.resume.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">简历管理</h1>
          <p className="text-muted-foreground">
            管理你的简历文件，上传新简历或查看已有简历
          </p>
        </div>
        <Link href="/resumes/upload" className={buttonVariants()}>
          <Plus className="mr-1 h-4 w-4" />
          上传简历
        </Link>
      </div>

      {resumes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="mb-1 text-lg font-medium">还没有简历</p>
            <p className="mb-4 text-sm text-muted-foreground">
              上传你的第一份简历开始使用
            </p>
            <Link href="/resumes/upload" className={buttonVariants()}>
              <Plus className="mr-1 h-4 w-4" />
              上传简历
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {resumes.map((resume) => {
            const isPdf = resume.fileName.toLowerCase().endsWith('.pdf');
            const uploadDate = new Date(resume.createdAt).toLocaleDateString(
              'zh-CN',
              {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              }
            );

            return (
              <Card key={resume.id}>
                <CardHeader className="flex flex-row items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                        isPdf
                          ? 'bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400'
                          : 'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400'
                      }`}
                    >
                      {isPdf ? (
                        <FileText className="h-5 w-5" />
                      ) : (
                        <File className="h-5 w-5" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="truncate" title={resume.fileName}>
                        {resume.fileName}
                      </CardTitle>
                      <CardDescription>{uploadDate}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        isPdf
                          ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                      }`}
                    >
                      {isPdf ? 'PDF' : 'DOCX'}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    {resume.fileUrl && (
                      <a
                        href={resume.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={buttonVariants({
                          variant: 'outline',
                          size: 'sm',
                        })}
                      >
                        查看文件
                      </a>
                    )}
                    <DeleteResumeButton
                      resumeId={resume.id}
                      fileName={resume.fileName}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
