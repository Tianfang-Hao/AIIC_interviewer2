'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { OptimizationPlan } from '@/lib/ai/resume-optimizer';
import {
  Target,
  CheckCircle2,
  Lightbulb,
  ArrowUpDown,
  LayoutList,
  Check,
  X,
  Loader2,
} from 'lucide-react';

interface OptimizationPlanViewProps {
  plan: OptimizationPlan;
  resumeId: string;
  jobId: string;
  jobTitle: string;
}

export function OptimizationPlanView({
  plan,
  resumeId,
  jobId,
  jobTitle,
}: OptimizationPlanViewProps) {
  const router = useRouter();
  const [acceptedIds, setAcceptedIds] = useState<Set<string>>(() => {
    // Default: accept all modifications
    const ids = new Set<string>();
    plan.modifications.forEach((m) => ids.add(m.id));
    return ids;
  });
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleSuggestion(id: string) {
    setAcceptedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function acceptAll() {
    const ids = new Set<string>();
    plan.modifications.forEach((m) => ids.add(m.id));
    setAcceptedIds(ids);
  }

  function rejectAll() {
    setAcceptedIds(new Set());
  }

  async function handleApply() {
    if (acceptedIds.size === 0) {
      setError('请至少选择一条修改建议');
      return;
    }

    setApplying(true);
    setError(null);

    try {
      const res = await fetch(`/api/resumes/${resumeId}/optimize/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          acceptedSuggestions: Array.from(acceptedIds),
          plan,
          jobId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '应用失败');
      }

      const { versionId } = await res.json();
      router.push(`/resumes/${resumeId}/versions/${versionId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '应用优化方案失败');
    } finally {
      setApplying(false);
    }
  }

  const actionLabels: Record<string, string> = {
    keep: '保留',
    delete: '删除',
    rewrite: '重写',
    reorder: '调整顺序',
  };

  const actionColors: Record<string, string> = {
    keep: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    delete: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
    rewrite:
      'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
    reorder:
      'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  };

  return (
    <div className="space-y-6">
      {/* Section 1: Strategy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            一、整体策略
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="mb-2 text-sm font-medium text-muted-foreground">
              该岗位核心考察能力
            </h4>
            <div className="flex flex-wrap gap-2">
              {plan.strategy.coreCompetencies.map((c, i) => (
                <Badge key={i} variant="outline">
                  {c}
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <h4 className="mb-2 text-sm font-medium text-muted-foreground">
              你的简历当前突出能力
            </h4>
            <div className="flex flex-wrap gap-2">
              {plan.strategy.currentStrengths.map((s, i) => (
                <Badge key={i} variant="secondary">
                  {s}
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <h4 className="mb-2 text-sm font-medium text-muted-foreground">
              调整方向
            </h4>
            <p className="text-sm leading-relaxed">
              {plan.strategy.adjustmentDirection}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Modification Suggestions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              二、逐条修改建议
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="xs" onClick={acceptAll}>
                全选
              </Button>
              <Button variant="ghost" size="xs" onClick={rejectAll}>
                全不选
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {plan.modifications.length === 0 ? (
            <p className="text-sm text-muted-foreground">暂无修改建议</p>
          ) : (
            plan.modifications.map((mod) => {
              const accepted = acceptedIds.has(mod.id);
              return (
                <div
                  key={mod.id}
                  className={`rounded-lg border p-4 transition-colors ${
                    accepted
                      ? 'border-primary/30 bg-primary/5'
                      : 'border-border bg-background'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Checkbox */}
                    <button
                      type="button"
                      onClick={() => toggleSuggestion(mod.id)}
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
                        accepted
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-muted-foreground/30 bg-background'
                      }`}
                    >
                      {accepted && <Check className="h-3 w-3" />}
                    </button>

                    <div className="min-w-0 flex-1 space-y-2">
                      {/* Header */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {mod.experienceTitle}
                        </span>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            actionColors[mod.action] ?? ''
                          }`}
                        >
                          {actionLabels[mod.action] ?? mod.action}
                        </span>
                      </div>

                      {/* Diff view */}
                      {mod.action !== 'keep' && (
                        <div className="grid gap-2 sm:grid-cols-2">
                          <div className="rounded-md border bg-red-50 p-2 text-xs dark:bg-red-950/20">
                            <p className="mb-1 text-[10px] font-medium uppercase text-muted-foreground">
                              原文
                            </p>
                            <p className="whitespace-pre-wrap leading-relaxed">
                              {mod.original || '(空)'}
                            </p>
                          </div>
                          <div className="rounded-md border bg-green-50 p-2 text-xs dark:bg-green-950/20">
                            <p className="mb-1 text-[10px] font-medium uppercase text-muted-foreground">
                              改为
                            </p>
                            <p className="whitespace-pre-wrap leading-relaxed">
                              {mod.modified || '(删除)'}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Reason */}
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium">理由：</span>
                        {mod.reason}
                      </p>

                      {/* Keywords */}
                      {mod.keywordsHit.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {mod.keywordsHit.map((kw, i) => (
                            <Badge key={i} variant="secondary" className="text-[10px]">
                              {kw}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Section 3: Keyword Suggestions */}
      {plan.keywordSuggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              三、关键词补充建议
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {plan.keywordSuggestions.map((kw, i) => (
                <div key={i} className="rounded-lg border p-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{kw.keyword}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {kw.whereToAdd}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {kw.reason}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section 4: Experience Order */}
      {plan.experienceOrder.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowUpDown className="h-5 w-5 text-primary" />
              四、经历取舍建议
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {plan.experienceOrder.map((eo, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-lg border p-3"
                >
                  <span
                    className={`mt-0.5 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      eo.action === 'remove'
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
                        : eo.action === 'move_up'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                          : eo.action === 'move_down'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                    }`}
                  >
                    {eo.action === 'remove'
                      ? '建议删除'
                      : eo.action === 'move_up'
                        ? '上移'
                        : eo.action === 'move_down'
                          ? '下移'
                          : '保持'}
                  </span>
                  <div>
                    <p className="text-sm font-medium">{eo.experienceTitle}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {eo.reason}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section 5: Layout Suggestions */}
      {plan.layoutSuggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LayoutList className="h-5 w-5 text-primary" />
              五、排版顺序建议
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {plan.layoutSuggestions.map((ls, i) => (
                <div key={i} className="rounded-lg border p-3">
                  <p className="text-sm font-medium">{ls.section}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {ls.suggestion}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Apply bar */}
      <Card>
        <CardContent className="flex items-center justify-between py-4">
          <div className="text-sm">
            已选择{' '}
            <span className="font-semibold text-primary">
              {acceptedIds.size}
            </span>{' '}
            / {plan.modifications.length} 条修改建议
          </div>
          <div className="flex items-center gap-3">
            {error && (
              <span className="text-sm text-destructive">{error}</span>
            )}
            <Button
              onClick={handleApply}
              disabled={applying || acceptedIds.size === 0}
            >
              {applying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  生成中...
                </>
              ) : (
                '一键应用选中建议'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
