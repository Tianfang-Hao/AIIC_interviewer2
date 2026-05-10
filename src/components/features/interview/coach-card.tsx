'use client';

import { useState } from 'react';
import {
  Bookmark,
  ChevronDown,
  ChevronUp,
  MessageSquareQuote,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { CoachCard as CoachCardType } from '@/lib/ai/interview-coach';

// ---- Score helpers ----

function scoreColor(score: number): string {
  if (score >= 7) return '#22c55e';
  if (score >= 5) return '#eab308';
  return '#ef4444';
}

function scoreBadgeClasses(score: number): string {
  if (score >= 7) return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
  if (score >= 5) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
  return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
}

// ---- Dimension labels ----

const DIMENSION_LABELS: Record<string, string> = {
  relevance: '内容相关性',
  structure: '结构清晰度',
  quantification: '量化数据',
  technicalDepth: '技术深度',
  fluency: '表达流畅度',
};

// ---- Props ----

interface CoachCardProps {
  card: CoachCardType;
  isLatest: boolean;
  onRewind: (questionIndex: number) => void;
  onBookmark: (questionIndex: number) => void;
}

export function CoachCardComponent({
  card,
  isLatest,
  onRewind,
  onBookmark,
}: CoachCardProps) {
  const [expanded, setExpanded] = useState(isLatest);
  const [showReference, setShowReference] = useState(false);

  // Summary (collapsed) view
  if (!expanded) {
    return (
      <Card
        size="sm"
        className="cursor-pointer transition-colors hover:bg-muted/50"
        onClick={() => setExpanded(true)}
      >
        <CardContent className="flex items-center justify-between gap-2 py-0">
          <span className="truncate text-sm text-muted-foreground">
            Q{card.questionIndex + 1}. {card.question}
          </span>
          <span
            className={cn(
              'inline-flex h-6 w-8 shrink-0 items-center justify-center rounded-md text-xs font-bold',
              scoreBadgeClasses(card.overallScore)
            )}
          >
            {card.overallScore}
          </span>
        </CardContent>
      </Card>
    );
  }

  // Expanded view
  const dimensions = Object.entries(card.scores) as [string, number][];

  return (
    <Card size="sm">
      {/* Header */}
      <CardHeader className="flex-row items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            Q{card.questionIndex + 1}
          </span>
          <span
            className={cn(
              'inline-flex h-7 min-w-[2.5rem] items-center justify-center rounded-md px-1.5 text-base font-bold',
              scoreBadgeClasses(card.overallScore)
            )}
          >
            {card.overallScore}
          </span>
          {card.isWeakPoint && (
            <Badge variant="destructive" className="text-[10px]">
              已加入错题本
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => onBookmark(card.questionIndex)}
            title={card.isBookmarked ? '取消收藏' : '收藏'}
          >
            <Bookmark
              className={cn(
                'h-3.5 w-3.5',
                card.isBookmarked
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-muted-foreground'
              )}
            />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setExpanded(false)}
            title="折叠"
          >
            <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 面试官 OS */}
        <div className="rounded-lg bg-amber-50 px-3 py-2.5 dark:bg-slate-800">
          <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400">
            <MessageSquareQuote className="h-3.5 w-3.5" />
            面试官 OS
          </div>
          <p className="text-sm italic leading-relaxed text-amber-900 dark:text-amber-200">
            {card.os}
          </p>
        </div>

        {/* 维度评分 */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground">维度评分</div>
          {dimensions.map(([key, score]) => (
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
        {card.suggestions.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-xs font-medium text-muted-foreground">改进建议</div>
            <ol className="list-inside list-decimal space-y-1 text-sm leading-relaxed">
              {card.suggestions.map((suggestion, i) => (
                <li key={i}>{suggestion}</li>
              ))}
            </ol>
          </div>
        )}

        {/* 推荐话术 */}
        <div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-between text-xs"
            onClick={() => setShowReference(!showReference)}
          >
            <span>{showReference ? '收起推荐回答' : '查看推荐回答'}</span>
            {showReference ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </Button>
          {showReference && (
            <div className="mt-1.5 rounded-lg border bg-muted/30 px-3 py-2.5 text-sm leading-relaxed whitespace-pre-wrap">
              {card.referenceAnswer}
            </div>
          )}
        </div>

        {/* 一键重练 */}
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => onRewind(card.questionIndex)}
        >
          <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
          重练此题
        </Button>
      </CardContent>
    </Card>
  );
}
