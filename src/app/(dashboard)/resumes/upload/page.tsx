import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { UploadDropzone } from '@/components/features/resume/upload-dropzone';

export default function ResumeUploadPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/resumes"
          className={buttonVariants({ variant: 'ghost', size: 'icon' })}
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">上传简历</h1>
          <p className="text-muted-foreground">
            上传你的简历文件，支持 PDF 和 DOCX 格式
          </p>
        </div>
      </div>

      <UploadDropzone />
    </div>
  );
}
