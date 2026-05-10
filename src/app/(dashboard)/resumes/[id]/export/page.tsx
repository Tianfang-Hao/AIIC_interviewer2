'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ArrowLeft, Download, Loader2, FileText } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { ParsedResume } from '@/lib/ai/resume-parser';

// Dynamically import the PDF preview to avoid SSR issues
const PDFPreview = dynamic(
  () => import('@/components/features/resume/resume-pdf-preview'),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[600px] items-center justify-center rounded-lg border bg-muted/30">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    ),
  }
);

// ---- Types ----

interface VersionSummary {
  id: string;
  name: string;
  createdAt: string;
}

// ---- Component ----

export default function ExportPage() {
  const params = useParams<{ id: string }>();
  const resumeId = params.id;

  const [versions, setVersions] = useState<VersionSummary[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(
    null
  );
  const [resumeData, setResumeData] = useState<ParsedResume | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [error, setError] = useState('');

  // Check if URL has a versionId query param
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const versionParam = searchParams.get('versionId');
    if (versionParam) {
      setSelectedVersionId(versionParam);
    }
  }, []);

  // Fetch versions list
  useEffect(() => {
    async function fetchVersions() {
      try {
        const res = await fetch(`/api/resumes/${resumeId}/versions`);
        if (!res.ok) throw new Error('获取版本列表失败');
        const data = await res.json();
        setVersions(data);

        // If no version selected via URL, check if we should use base resume
        if (!selectedVersionId && data.length > 0) {
          // Default to first version
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载失败');
      } finally {
        setIsLoading(false);
      }
    }
    fetchVersions();
  }, [resumeId, selectedVersionId]);

  // Fetch resume data based on selection
  const fetchResumeData = useCallback(async () => {
    setIsLoadingData(true);
    setError('');
    try {
      if (selectedVersionId) {
        // Fetch version data
        const res = await fetch(
          `/api/resumes/${resumeId}/versions/${selectedVersionId}`
        );
        if (!res.ok) throw new Error('获取版本数据失败');
        const data = await res.json();
        setResumeData(data.content as ParsedResume);
      } else {
        // Fetch base resume
        const res = await fetch(`/api/resumes/${resumeId}`);
        if (!res.ok) throw new Error('获取简历数据失败');
        const data = await res.json();
        setResumeData(data.parsedData as ParsedResume);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载数据失败');
      setResumeData(null);
    } finally {
      setIsLoadingData(false);
    }
  }, [resumeId, selectedVersionId]);

  useEffect(() => {
    if (!isLoading) {
      fetchResumeData();
    }
  }, [isLoading, fetchResumeData]);

  // ---- Download handler ----

  const handleDownload = useCallback(async () => {
    if (!resumeData) return;

    // Dynamic import to avoid SSR
    const { pdf } = await import('@react-pdf/renderer');
    const { ResumePDFTemplate } = await import(
      '@/components/features/resume/resume-pdf-template'
    );

    const blob = await pdf(
      <ResumePDFTemplate data={resumeData} />
    ).toBlob();

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const versionName =
      versions.find((v) => v.id === selectedVersionId)?.name || '简历';
    a.download = `${resumeData.basic_info.name || versionName}_简历.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [resumeData, selectedVersionId, versions]);

  // ---- Render ----

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href={`/resumes/${resumeId}`}
          className={buttonVariants({ variant: 'ghost', size: 'icon' })}
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">导出 PDF</h1>
          <p className="text-muted-foreground">
            选择版本并导出为 PDF 文件
          </p>
        </div>
        <Button
          onClick={handleDownload}
          disabled={!resumeData || isLoadingData}
        >
          <Download className="mr-1.5 h-4 w-4" />
          下载 PDF
        </Button>
      </div>

      {/* Version Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">选择导出版本</CardTitle>
          <CardDescription>
            选择要导出的简历版本，或使用原始解析数据
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedVersionId === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedVersionId(null)}
            >
              <FileText className="mr-1 h-3 w-3" />
              原始简历
            </Button>
            {versions.map((version) => (
              <Button
                key={version.id}
                variant={
                  selectedVersionId === version.id ? 'default' : 'outline'
                }
                size="sm"
                onClick={() => setSelectedVersionId(version.id)}
              >
                {version.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <Card>
          <CardContent className="py-6 text-center text-sm text-destructive">
            {error}
          </CardContent>
        </Card>
      )}

      {/* PDF Preview */}
      {isLoadingData ? (
        <div className="flex h-[600px] items-center justify-center rounded-lg border bg-muted/30">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : resumeData ? (
        <PDFPreview data={resumeData} />
      ) : (
        !error && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <FileText className="mb-3 h-10 w-10" />
              <p>暂无可导出的简历数据</p>
              <p className="text-sm">请先上传并解析简历</p>
            </CardContent>
          </Card>
        )
      )}
    </div>
  );
}
