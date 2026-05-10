'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { OptimizationPlanView } from '@/components/features/resume/optimization-plan';
import type { OptimizationPlan } from '@/lib/ai/resume-optimizer';
import { use } from 'react';

export default function OptimizePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: resumeId } = use(params);
  const searchParams = useSearchParams();
  const jobId = searchParams.get('jobId');

  const [plan, setPlan] = useState<OptimizationPlan | null>(null);
  const [jobTitle, setJobTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId) {
      setError('缺少目标岗位参数');
      setLoading(false);
      return;
    }

    async function fetchPlan() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`/api/resumes/${resumeId}/optimize`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobId }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || '生成优化方案失败');
        }

        const data = await res.json();
        setPlan(data.plan);
        setJobTitle(data.plan?.strategy?.adjustmentDirection ? '' : '');
      } catch (err) {
        setError(err instanceof Error ? err.message : '生成优化方案失败');
      } finally {
        setLoading(false);
      }
    }

    fetchPlan();
  }, [resumeId, jobId]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Back navigation */}
      <div className="flex items-center gap-4">
        <Link
          href={jobId ? `/jobs/${jobId}` : `/resumes/${resumeId}`}
          className={buttonVariants({ variant: 'ghost', size: 'sm' })}
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          返回
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight">
            AI 简历优化
          </h1>
          <p className="text-sm text-muted-foreground">
            根据目标岗位 JD 智能优化简历内容
          </p>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Loader2 className="mb-4 h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-medium">正在分析岗位要求并生成优化方案...</p>
            <p className="mt-1 text-xs text-muted-foreground">
              这通常需要 10-30 秒，请耐心等待
            </p>
          </CardContent>
        </Card>
      )}

      {/* Error state */}
      {error && !loading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <AlertCircle className="mb-4 h-8 w-8 text-destructive" />
            <p className="text-sm font-medium text-destructive">{error}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              重试
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Plan display */}
      {plan && !loading && (
        <OptimizationPlanView
          plan={plan}
          resumeId={resumeId}
          jobId={jobId!}
          jobTitle={jobTitle}
        />
      )}
    </div>
  );
}
