'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ResumeEditForm } from '@/components/features/resume/resume-edit-form';
import type { ParsedResume } from '@/lib/ai/resume-parser';

// ---- Props ----

interface ResumeDetailProps {
  resumeId: string;
  fileName: string;
  fileUrl: string | null;
  parsedData: ParsedResume | null;
}

// ---- Component ----

export function ResumeDetail({
  resumeId,
  fileName: _fileName,
  fileUrl,
  parsedData: initialParsedData,
}: ResumeDetailProps) {
  const router = useRouter();
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState('');
  const [parsedData, setParsedData] = useState<ParsedResume | null>(
    initialParsedData
  );

  // ---- Parse handler ----

  const handleParse = useCallback(async () => {
    setIsParsing(true);
    setParseError('');
    try {
      const res = await fetch(`/api/resumes/${resumeId}/parse`, {
        method: 'POST',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '解析失败');
      }
      const data = await res.json();
      setParsedData(data.parsedData as ParsedResume);
      router.refresh();
    } catch (err) {
      setParseError(err instanceof Error ? err.message : '解析失败，请重试');
    } finally {
      setIsParsing(false);
    }
  }, [resumeId, router]);

  // ---- Save handler ----

  const handleSave = useCallback(
    async (cleaned: ParsedResume) => {
      const res = await fetch(`/api/resumes/${resumeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parsedData: cleaned }),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || '保存失败');
      }
    },
    [resumeId]
  );

  // ---- Unparsed state ----

  if (!parsedData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI 简历解析</CardTitle>
          <CardDescription>
            使用 AI 自动提取简历中的结构化信息
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4 py-8">
          {fileUrl && (
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mb-2 text-sm text-primary underline underline-offset-4"
            >
              查看原始文件
            </a>
          )}
          <Button onClick={handleParse} disabled={isParsing} size="lg">
            {isParsing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                正在解析...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                开始 AI 解析
              </>
            )}
          </Button>
          {isParsing && (
            <p className="text-sm text-muted-foreground">
              AI 正在分析您的简历，这可能需要 10-30 秒...
            </p>
          )}
          {parseError && (
            <p className="text-sm text-destructive">{parseError}</p>
          )}
        </CardContent>
      </Card>
    );
  }

  // ---- Parsed state: show editable form ----

  return (
    <ResumeEditForm
      initialData={parsedData}
      onSave={handleSave}
      topBarLeft={
        <>
          {fileUrl && (
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary underline underline-offset-4"
            >
              查看原始文件
            </a>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleParse}
            disabled={isParsing}
          >
            {isParsing ? (
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            ) : (
              <Sparkles className="mr-1 h-3 w-3" />
            )}
            重新解析
          </Button>
        </>
      }
    />
  );
}
