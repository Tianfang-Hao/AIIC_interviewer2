'use client';

import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  STATUS_LABELS,
  STATUS_COLORS,
} from '@/lib/constants/application';
import type { ApplicationStatus } from '@/generated/prisma/client';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface Application {
  id: string;
  status: ApplicationStatus;
  applyDate: string;
  createdAt?: string;
}

interface StatsDashboardProps {
  applications: Application[];
}

const STAGE_ORDER: Record<string, number> = {
  APPLIED: 0,
  SCREENING: 1,
  WRITTEN_TEST: 2,
  FIRST_INTERVIEW: 3,
  SECOND_INTERVIEW: 4,
  THIRD_INTERVIEW: 5,
  HR_INTERVIEW: 6,
  OFFER: 7,
};

const FUNNEL_STAGES: { key: ApplicationStatus; label: string; color: string }[] = [
  { key: 'APPLIED', label: '投递', color: 'bg-blue-500' },
  { key: 'WRITTEN_TEST', label: '笔试', color: 'bg-orange-500' },
  { key: 'FIRST_INTERVIEW', label: '一面', color: 'bg-purple-500' },
  { key: 'SECOND_INTERVIEW', label: '二面', color: 'bg-indigo-500' },
  { key: 'THIRD_INTERVIEW', label: '三面', color: 'bg-violet-500' },
  { key: 'HR_INTERVIEW', label: 'HR面', color: 'bg-cyan-500' },
  { key: 'OFFER', label: 'Offer', color: 'bg-green-500' },
];

function getThisWeekStart(): Date {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? 6 : day - 1; // Monday as start of week
  const start = new Date(now);
  start.setDate(now.getDate() - diff);
  start.setHours(0, 0, 0, 0);
  return start;
}

export function StatsDashboard({ applications }: StatsDashboardProps) {
  const stats = useMemo(() => {
    const total = applications.length;
    const weekStart = getThisWeekStart();

    const thisWeekNew = applications.filter((app) => {
      const date = new Date(app.createdAt || app.applyDate);
      return date >= weekStart;
    }).length;

    // Count by status
    const statusCounts: Partial<Record<ApplicationStatus, number>> = {};
    for (const app of applications) {
      statusCounts[app.status] = (statusCounts[app.status] || 0) + 1;
    }

    // Funnel: count apps that reached at least each stage (excluding rejected)
    const nonRejected = applications.filter((a) => a.status !== 'REJECTED');
    const funnelCounts = FUNNEL_STAGES.map((stage) => {
      const stageIdx = STAGE_ORDER[stage.key];
      const count = nonRejected.filter(
        (app) => STAGE_ORDER[app.status] >= stageIdx
      ).length;
      return { ...stage, count };
    });

    return { total, thisWeekNew, statusCounts, funnelCounts };
  }, [applications]);

  const rejectedCount = stats.statusCounts['REJECTED'] || 0;
  const offerCount = stats.statusCounts['OFFER'] || 0;
  const interviewingCount =
    (stats.statusCounts['FIRST_INTERVIEW'] || 0) +
    (stats.statusCounts['SECOND_INTERVIEW'] || 0) +
    (stats.statusCounts['THIRD_INTERVIEW'] || 0) +
    (stats.statusCounts['HR_INTERVIEW'] || 0);

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card size="sm">
          <CardContent className="pt-0">
            <div className="text-xs text-muted-foreground">投递总数</div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="pt-0">
            <div className="text-xs text-muted-foreground">本周新增</div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {stats.thisWeekNew}
            </div>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="pt-0">
            <div className="text-xs text-muted-foreground">面试中</div>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {interviewingCount}
            </div>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="pt-0">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-muted-foreground">Offer</div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {offerCount}
                </div>
              </div>
              {rejectedCount > 0 && (
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">已拒</div>
                  <div className="text-lg font-semibold text-red-500">
                    {rejectedCount}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Distribution */}
      <Card size="sm">
        <CardContent className="pt-0">
          <div className="mb-2 text-xs font-medium text-muted-foreground">
            各阶段分布
          </div>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(STATUS_LABELS) as ApplicationStatus[]).map(
              (status) => {
                const count = stats.statusCounts[status] || 0;
                if (count === 0) return null;
                return (
                  <Badge
                    key={status}
                    className={cn('border-none text-xs', STATUS_COLORS[status])}
                  >
                    {STATUS_LABELS[status]} {count}
                  </Badge>
                );
              }
            )}
          </div>
        </CardContent>
      </Card>

      {/* Conversion Funnel */}
      <Card size="sm">
        <CardContent className="pt-0">
          <div className="mb-3 text-xs font-medium text-muted-foreground">
            转化漏斗
          </div>
          <div className="space-y-2">
            {stats.funnelCounts.map((stage) => {
              const total = stats.funnelCounts[0]?.count || 1;
              const pct = total > 0 ? (stage.count / total) * 100 : 0;
              return (
                <div key={stage.key} className="flex items-center gap-3">
                  <div className="w-12 shrink-0 text-right text-xs text-muted-foreground">
                    {stage.label}
                  </div>
                  <div className="relative h-6 flex-1 overflow-hidden rounded bg-muted">
                    <div
                      className={cn(
                        'absolute inset-y-0 left-0 rounded transition-all duration-500',
                        stage.color
                      )}
                      style={{ width: `${Math.max(pct, stage.count > 0 ? 2 : 0)}%` }}
                    />
                    <div className="relative flex h-full items-center px-2">
                      <span className="text-xs font-medium text-foreground">
                        {stage.count}
                      </span>
                      {stage.count > 0 && (
                        <span className="ml-1 text-xs text-muted-foreground">
                          ({pct.toFixed(0)}%)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
