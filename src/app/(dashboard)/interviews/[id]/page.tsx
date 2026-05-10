'use client';

import { useEffect, useState, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Clock,
  Loader2,
  StopCircle,
  Building2,
  FileText,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChatInterface } from '@/components/features/interview/chat-interface';

const ROUND_LABELS: Record<string, string> = {
  FIRST: '第一轮 · 技术基础面',
  SECOND: '第二轮 · 深度思维面',
  THIRD: '第三轮 · HR综合面',
};

const STYLE_LABELS: Record<string, string> = {
  WARM: '温和引导型',
  DETAIL: '注重细节型',
  STRICT: '严格压力型',
  DIVERGENT: '发散思维型',
  SILENT: '沉默寡言型',
};

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface InterviewData {
  id: string;
  round: string;
  style: string;
  messages: Message[];
  evaluation: unknown;
  createdAt: string;
  job: {
    id: string;
    company: string;
    positionName: string;
  } | null;
}

export default function InterviewDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [interview, setInterview] = useState<InterviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEnded, setIsEnded] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Fetch interview data
  useEffect(() => {
    async function fetchInterview() {
      try {
        const res = await fetch(`/api/interviews/${id}`);
        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          throw new Error(errData?.error || '获取面试数据失败');
        }
        const data = await res.json();
        setInterview(data);
        if (data.evaluation) {
          setIsEnded(true);
        }
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }
    fetchInterview();
  }, [id]);

  // Timer
  useEffect(() => {
    if (isEnded || loading) return;
    const timer = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isEnded, loading]);

  const formatTime = useCallback((seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }, []);

  const handleEndInterview = async () => {
    if (!confirm('确定要结束面试吗？结束后将生成评估报告。')) return;
    setIsEnded(true);
    // Navigate to the evaluation page, which triggers evaluation generation
    router.push(`/interviews/${id}/evaluation`);
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !interview) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4">
        <p className="text-destructive">{error || '面试数据不存在'}</p>
        <Link href="/interviews">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回面试列表
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-3">
          <Link href="/interviews">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            {interview.job && (
              <div className="flex items-center gap-1 text-sm">
                <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="font-medium">
                  {interview.job.company} - {interview.job.positionName}
                </span>
              </div>
            )}
            <Badge variant="outline" className="text-xs">
              {ROUND_LABELS[interview.round] || interview.round}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {STYLE_LABELS[interview.style] || interview.style}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Timer */}
          <div className="flex items-center gap-1.5 rounded-md bg-muted px-3 py-1.5 text-sm font-mono">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            {formatTime(elapsedSeconds)}
          </div>

          {/* End interview button */}
          {!isEnded && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleEndInterview}
            >
              <StopCircle className="mr-1.5 h-4 w-4" />
              结束面试
            </Button>
          )}

          {/* View evaluation button (show when interview ended) */}
          {isEnded && (
            <Link href={`/interviews/${id}/evaluation`}>
              <Button size="sm" variant="outline">
                <FileText className="mr-1.5 h-4 w-4" />
                查看评估报告
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-hidden">
        <ChatInterface
          interviewId={interview.id}
          initialMessages={interview.messages}
          disabled={isEnded}
        />
      </div>
    </div>
  );
}
