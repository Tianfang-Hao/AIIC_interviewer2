'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronDown,
  ChevronUp,
  Bookmark,
  AlertTriangle,
  MessageSquareQuote,
  RotateCcw,
  Loader2,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { CoachCard, CoachScores } from '@/lib/ai/interview-coach';

// ---- Types ----

export interface MistakeItem {
  interviewId: string;
  card: CoachCard;
  company: string;
  positionName: string;
  interviewDate: string;
  round: string;
  style: string;
  jobId: string | null;
}

// ---- Helpers ----

const ROUND_LABELS: Record<string, string> = {
  FIRST: '第一轮',
  SECOND: '第二轮',
  THIRD: '第三轮',
};

const DIMENSION_LABELS: Record<string, string> = {
  relevance: '内容相关性',
  structure: '结构清晰度',
  quantification: '量化数据',
  technicalDepth: '技术深度',
  fluency: '表达流畅度',
};

function scoreColor(score: number): string {
  if (score >= 7) return '#22c55e';
  if (score >= 5) return '#eab308';
  return '#ef4444';
}

function scoreBadgeClasses(score: number): string {
  if (score >= 7) return 'border-green-300 bg-green-50 text-green-700';
  if (score >= 4) return 'border-yellow-300 bg-yellow-50 text-yellow-700';
  return 'border-red-300 bg-red-50 text-red-700';
}

type FilterDimension = 'all' | keyof CoachScores;

const FILTER_OPTIONS: { value: FilterDimension; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'relevance', label: '内容相关性不足' },
  { value: 'structure', label: '结构清晰度不足' },
  { value: 'quantification', label: '量化数据不足' },
  { value: 'technicalDepth', label: '技术深度不足' },
  { value: 'fluency', label: '表达流畅度不足' },
];

// ---- Component ----

interface MistakesListProps {
  items: MistakeItem[];
}

export function MistakesList({ items }: MistakesListProps) {
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterDimension>('all');
  const [retrying, setRetrying] = useState<string | null>(null);

  // Filter logic
  const filteredItems = items.filter((item) => {
    if (filter === 'all') return true;
    return item.card.scores[filter] <= 4;
  });

  const handleRetry = async (item: MistakeItem) => {
    const key = `${item.interviewId}-${item.card.questionIndex}`;
    setRetrying(key);
    try {
      const res = await fetch('/api/mistakes/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: item.card.question,
          jobId: item.jobId,
          round: item.round,
          style: item.style,
        }),
      });
      if (!res.ok) {
        throw new Error('创建重练失败');
      }
      const data = await res.json();
      router.push(`/interviews/${data.id}`);
    } catch {
      setRetrying(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as FilterDimension)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          {FILTER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <span className="text-sm text-muted-foreground">
          共 {filteredItems.length} 题
        </span>
      </div>

      {/* Card list */}
      {filteredItems.map((item) => {
        const key = `${item.interviewId}-${item.card.questionIndex}`;
        const isExpanded = expandedId === key;
        const isRetryLoading = retrying === key;

        return (
          <Card key={key}>
            {/* Collapsed summary */}
            <button
              type="button"
              className="w-full text-left"
              onClick={() => setExpandedId(isExpanded ? null : key)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="line-clamp-2 text-sm font-medium leading-snug">
                      {item.card.question}
                    </p>
                    <p className="line-clamp-1 text-xs text-muted-foreground">
                      {item.card.userAnswer}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge
                      variant="outline"
                      className={cn(
                        'font-mono text-xs',
                        scoreBadgeClasses(item.card.overallScore)
                      )}
                    >
                      {item.card.overallScore}/10
                    </Badge>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
                {/* Source info + tags */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-xs text-muted-foreground">
                    {item.company} &middot; {item.positionName} &middot;{' '}
                    {ROUND_LABELS[item.round] ?? item.round} &middot;{' '}
                    {new Date(item.interviewDate).toLocaleDateString('zh-CN')}
                  </span>
                  {item.card.isWeakPoint && (
                    <Badge variant="destructive" className="text-[10px] py-0 h-5">
                      <AlertTriangle className="mr-0.5 h-3 w-3" />
                      薄弱项
                    </Badge>
                  )}
                  {item.card.isBookmarked && (
                    <Bookmark className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                  )}
                </div>
              </CardHeader>
            </button>

            {/* Expanded detail */}
            {isExpanded && (
              <CardContent className="space-y-4 border-t pt-4">
                {/* Full question */}
                <div>
                  <div className="mb-1 text-xs font-medium text-muted-foreground">
                    面试题目
                  </div>
                  <p className="text-sm leading-relaxed">{item.card.question}</p>
                </div>

                {/* Full user answer */}
                <div>
                  <div className="mb-1 text-xs font-medium text-muted-foreground">
                    你的回答
                  </div>
                  <p className="rounded-md bg-muted p-3 text-sm leading-relaxed whitespace-pre-wrap">
                    {item.card.userAnswer}
                  </p>
                </div>

                {/* 面试官 OS */}
                <div className="rounded-lg bg-amber-50 px-3 py-2.5 dark:bg-slate-800">
                  <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                    <MessageSquareQuote className="h-3.5 w-3.5" />
                    面试官 OS
                  </div>
                  <p className="text-sm italic leading-relaxed text-amber-900 dark:text-amber-200">
                    {item.card.os}
                  </p>
                </div>

                {/* 维度评分 */}
                <div className="space-y-2">
                  <div className="text-xs font-medium text-muted-foreground">
                    维度评分
                  </div>
                  {(
                    Object.entries(item.card.scores) as [string, number][]
                  ).map(([key, score]) => (
                    <div key={key} className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-xs text-muted-foreground">
                        {DIMENSION_LABELS[key] || key}
                      </span>
                      <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className="absolute inset-y-0 left-0 rounded-full transition-all"
                          style={{
                            width: `${(score / 10) * 100}%`,
                            backgroundColor: scoreColor(score),
                          }}
                        />
                      </div>
                      <span
                        className="w-5 shrink-0 text-right text-xs font-medium"
                        style={{ color: scoreColor(score) }}
                      >
                        {score}
                      </span>
                    </div>
                  ))}
                </div>

                {/* 改进建议 */}
                {item.card.suggestions.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="text-xs font-medium text-muted-foreground">
                      改进建议
                    </div>
                    <ol className="list-inside list-decimal space-y-1 text-sm leading-relaxed">
                      {item.card.suggestions.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* 推荐回答 */}
                {item.card.referenceAnswer && (
                  <div>
                    <div className="mb-1 text-xs font-medium text-blue-600">
                      参考回答
                    </div>
                    <p className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm leading-relaxed whitespace-pre-wrap">
                      {item.card.referenceAnswer}
                    </p>
                  </div>
                )}

                {/* 重练此题 */}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  disabled={isRetryLoading}
                  onClick={() => handleRetry(item)}
                >
                  {isRetryLoading ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  重练此题
                </Button>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}
