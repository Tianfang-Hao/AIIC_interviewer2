'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  MessageSquare,
  Play,
  Clock,
  Building2,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Labels
const ROUND_OPTIONS = [
  {
    value: 'FIRST',
    label: '第一轮 · 技术/业务基础面',
    desc: '60% 简历深挖 + 40% 基础知识',
  },
  {
    value: 'SECOND',
    label: '第二轮 · 深度思维面',
    desc: '50% 决策逻辑 + 30% 开放问题 + 20% 行业认知',
  },
  {
    value: 'THIRD',
    label: '第三轮 · HR综合面',
    desc: '稳定性 + 价值观 + 综合素质 + 压力测试',
  },
] as const;

const STYLE_OPTIONS = [
  { value: 'WARM', label: '温和引导型', desc: '亲切友好，善于引导候选人发挥' },
  { value: 'DETAIL', label: '注重细节型', desc: '关注细节和数据，会深入追问' },
  {
    value: 'STRICT',
    label: '严格压力型',
    desc: '语气严肃，考察抗压和应变能力',
  },
  {
    value: 'DIVERGENT',
    label: '发散思维型',
    desc: '思维跳跃，开放式和假设性问题',
  },
  {
    value: 'SILENT',
    label: '沉默寡言型',
    desc: '话少，考察主动表达能力',
  },
] as const;

const ROUND_LABELS: Record<string, string> = {
  FIRST: '第一轮',
  SECOND: '第二轮',
  THIRD: '第三轮',
};

const STYLE_LABELS: Record<string, string> = {
  WARM: '温和引导型',
  DETAIL: '注重细节型',
  STRICT: '严格压力型',
  DIVERGENT: '发散思维型',
  SILENT: '沉默寡言型',
};

interface Job {
  id: string;
  company: string;
  positionName: string;
}

interface PastInterview {
  id: string;
  round: string;
  style: string;
  createdAt: string;
  evaluation: unknown;
  job: Job | null;
}

export default function InterviewsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [pastInterviews, setPastInterviews] = useState<PastInterview[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  // Form state
  const [selectedJobId, setSelectedJobId] = useState('');
  const [selectedRound, setSelectedRound] = useState('FIRST');
  const [selectedStyle, setSelectedStyle] = useState('WARM');

  // Fetch jobs and past interviews on mount
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [jobsRes, interviewsRes] = await Promise.all([
          fetch('/api/jobs?pageSize=100'),
          fetch('/api/interviews'),
        ]);

        if (jobsRes.ok) {
          const jobsData = await jobsRes.json();
          setJobs(
            jobsData.jobs.map((j: Record<string, unknown>) => ({
              id: j.id,
              company: j.company,
              positionName: j.positionName,
            }))
          );
        }

        if (interviewsRes.ok) {
          const interviewsData = await interviewsRes.json();
          setPastInterviews(interviewsData.interviews);
        }
      } catch (error) {
        console.error('Fetch data error:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleStartInterview = async () => {
    setStarting(true);
    try {
      const res = await fetch('/api/interviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: selectedJobId || undefined,
          round: selectedRound,
          style: selectedStyle,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error || '创建面试失败');
      }

      const data = await res.json();
      router.push(`/interviews/${data.id}`);
    } catch (error) {
      console.error('Start interview error:', error);
      alert((error as Error).message || '创建面试失败');
    } finally {
      setStarting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">模拟面试</h1>
        <p className="text-muted-foreground">
          选择岗位、面试轮次和面试官风格，开始一场模拟面试
        </p>
      </div>

      {/* Setup form */}
      <Card>
        <CardHeader>
          <CardTitle>开始新面试</CardTitle>
          <CardDescription>配置面试参数，点击开始按钮启动面试</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Job selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">选择岗位（可选）</label>
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="w-full h-9 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">不绑定岗位（通用面试）</option>
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.company} - {job.positionName}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              选择岗位后，面试官会根据 JD 内容出题
            </p>
          </div>

          {/* Round selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium">面试轮次</label>
            <div className="grid gap-3 sm:grid-cols-3">
              {ROUND_OPTIONS.map((round) => (
                <button
                  key={round.value}
                  type="button"
                  onClick={() => setSelectedRound(round.value)}
                  className={`rounded-lg border p-3 text-left transition-colors ${
                    selectedRound === round.value
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'border-input hover:border-primary/50'
                  }`}
                >
                  <div className="text-sm font-medium">{round.label}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {round.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Style selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium">面试官风格</label>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {STYLE_OPTIONS.map((style) => (
                <button
                  key={style.value}
                  type="button"
                  onClick={() => setSelectedStyle(style.value)}
                  className={`rounded-lg border p-3 text-left transition-colors ${
                    selectedStyle === style.value
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'border-input hover:border-primary/50'
                  }`}
                >
                  <div className="text-sm font-medium">{style.label}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {style.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Start button */}
          <Button
            size="lg"
            onClick={handleStartInterview}
            disabled={starting}
            className="w-full sm:w-auto"
          >
            {starting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                正在创建面试...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                开始面试
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Past interviews */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">面试历史</h2>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : pastInterviews.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <MessageSquare className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                暂无面试记录，开始你的第一场模拟面试吧
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {pastInterviews.map((interview) => (
              <button
                key={interview.id}
                type="button"
                onClick={() => router.push(`/interviews/${interview.id}`)}
                className="text-left"
              >
                <Card className="h-full transition-shadow hover:shadow-md">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-sm">
                        {interview.job
                          ? `${interview.job.company} - ${interview.job.positionName}`
                          : '通用面试'}
                      </CardTitle>
                      {interview.evaluation != null && (
                        <Badge variant="secondary" className="shrink-0">
                          已评估
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline">
                          {ROUND_LABELS[interview.round] || interview.round}
                        </Badge>
                        <Badge variant="outline">
                          {STYLE_LABELS[interview.style] || interview.style}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatDate(interview.createdAt)}
                      </div>
                      {interview.job && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Building2 className="h-3 w-3" />
                          {interview.job.company}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
