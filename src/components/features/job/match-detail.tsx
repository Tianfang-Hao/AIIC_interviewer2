'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle2, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface MatchBreakdown {
  skills: number;
  experience: number;
  hardRequirements: number;
  industry: number;
  preferred: number;
}

export interface MatchInfo {
  jobId: string;
  totalScore: number;
  breakdown: MatchBreakdown;
  matchedItems: string[];
  missingItems: string[];
}

// ---------------------------------------------------------------------------
// Score badge shown on job cards
// ---------------------------------------------------------------------------

export function MatchScoreBadge({
  score,
  className,
}: {
  score: number;
  className?: string;
}) {
  const color =
    score >= 80
      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      : score >= 50
        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold',
        color,
        className
      )}
    >
      {score}% 匹配
    </span>
  );
}

// ---------------------------------------------------------------------------
// Breakdown bar for individual dimensions
// ---------------------------------------------------------------------------

const DIMENSION_LABELS: Record<keyof MatchBreakdown, string> = {
  skills: '技能匹配',
  experience: '经历相关性',
  hardRequirements: '硬性条件',
  industry: '行业/方向',
  preferred: '优先条件',
};

const DIMENSION_WEIGHTS: Record<keyof MatchBreakdown, number> = {
  skills: 30,
  experience: 25,
  hardRequirements: 20,
  industry: 15,
  preferred: 10,
};

function DimensionBar({
  label,
  score,
  weight,
}: {
  label: string;
  score: number;
  weight: number;
}) {
  const barColor =
    score >= 80
      ? 'bg-green-500'
      : score >= 50
        ? 'bg-yellow-500'
        : 'bg-red-400';

  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">
          {label}
          <span className="ml-1 text-[10px] opacity-60">({weight}%)</span>
        </span>
        <span className="font-medium">{score}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn('h-full rounded-full transition-all', barColor)}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Expandable match detail panel
// ---------------------------------------------------------------------------

export function MatchDetail({ match }: { match: MatchInfo }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="space-y-3">
      {/* Toggle button */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setExpanded(!expanded);
        }}
        className="flex w-full items-center justify-between rounded-md bg-muted/50 px-3 py-2 text-xs hover:bg-muted"
      >
        <MatchScoreBadge score={match.totalScore} />
        <span className="flex items-center gap-1 text-muted-foreground">
          {expanded ? '收起' : '查看详情'}
          {expanded ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
        </span>
      </button>

      {expanded && (
        <div className="space-y-4 rounded-md border p-3">
          {/* Dimension breakdown */}
          <div className="space-y-2">
            <p className="text-xs font-medium">各维度得分</p>
            {(
              Object.keys(DIMENSION_LABELS) as Array<keyof MatchBreakdown>
            ).map((key) => (
              <DimensionBar
                key={key}
                label={DIMENSION_LABELS[key]}
                score={match.breakdown[key]}
                weight={DIMENSION_WEIGHTS[key]}
              />
            ))}
          </div>

          {/* Matched items */}
          {match.matchedItems.length > 0 && (
            <div className="space-y-1.5">
              <p className="flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                匹配项
              </p>
              <div className="flex flex-wrap gap-1">
                {match.matchedItems.map((item, i) => (
                  <Badge key={i} variant="secondary" className="text-[11px]">
                    {item}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Missing items */}
          {match.missingItems.length > 0 && (
            <div className="space-y-1.5">
              <p className="flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400">
                <XCircle className="h-3.5 w-3.5" />
                不匹配项
              </p>
              <div className="flex flex-wrap gap-1">
                {match.missingItems.map((item, i) => (
                  <Badge key={i} variant="outline" className="text-[11px]">
                    {item}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inline match detail for job detail page (always expanded)
// ---------------------------------------------------------------------------

export function MatchDetailInline({ match }: { match: MatchInfo }) {
  return (
    <div className="space-y-4">
      {/* Dimension breakdown */}
      <div className="space-y-2">
        {(Object.keys(DIMENSION_LABELS) as Array<keyof MatchBreakdown>).map(
          (key) => (
            <DimensionBar
              key={key}
              label={DIMENSION_LABELS[key]}
              score={match.breakdown[key]}
              weight={DIMENSION_WEIGHTS[key]}
            />
          )
        )}
      </div>

      {/* Matched items */}
      {match.matchedItems.length > 0 && (
        <div className="space-y-1.5">
          <p className="flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            匹配项
          </p>
          <div className="flex flex-wrap gap-1">
            {match.matchedItems.map((item, i) => (
              <Badge key={i} variant="secondary" className="text-[11px]">
                {item}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Missing items */}
      {match.missingItems.length > 0 && (
        <div className="space-y-1.5">
          <p className="flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400">
            <XCircle className="h-3.5 w-3.5" />
            不匹配项
          </p>
          <div className="flex flex-wrap gap-1">
            {match.missingItems.map((item, i) => (
              <Badge key={i} variant="outline" className="text-[11px]">
                {item}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
