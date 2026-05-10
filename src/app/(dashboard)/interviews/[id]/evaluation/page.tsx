'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Star,
  Lightbulb,
  Target,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { RadarChart } from '@/components/features/interview/radar-chart';
import type { CoachCard, CoachScores } from '@/lib/ai/interview-coach';

interface QuestionEvaluation {
  question: string;
  answer: string;
  score: number;
  highlights: string[];
  improvements: string[];
  referenceAnswer: string;
}

interface Evaluation {
  questions: QuestionEvaluation[];
  overallScore: number;
  overallRating: 'pass' | 'needs_improvement' | 'fail';
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
}

const RATING_CONFIG = {
  pass: {
    label: '通过',
    color: 'text-green-600',
    bgColor: 'bg-green-50 border-green-200',
    icon: CheckCircle2,
  },
  needs_improvement: {
    label: '待提升',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50 border-yellow-200',
    icon: AlertCircle,
  },
  fail: {
    label: '不通过',
    color: 'text-red-600',
    bgColor: 'bg-red-50 border-red-200',
    icon: XCircle,
  },
};

export default function EvaluationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [averageScores, setAverageScores] = useState<CoachScores | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(
    new Set()
  );

  useEffect(() => {
    async function fetchEvaluation() {
      try {
        // First try to get existing evaluation via interview data
        const interviewRes = await fetch(`/api/interviews/${id}`);
        if (!interviewRes.ok) {
          throw new Error('获取面试数据失败');
        }
        const interviewData = await interviewRes.json();

        if (interviewData.evaluation) {
          setEvaluation(interviewData.evaluation as Evaluation);

          // Compute average scores from coachCards if present
          if (interviewData.coachCards && Array.isArray(interviewData.coachCards) && interviewData.coachCards.length > 0) {
            const cards = interviewData.coachCards as CoachCard[];
            const avg: CoachScores = {
              relevance: 0,
              structure: 0,
              quantification: 0,
              technicalDepth: 0,
              fluency: 0,
            };
            for (const card of cards) {
              avg.relevance += card.scores.relevance;
              avg.structure += card.scores.structure;
              avg.quantification += card.scores.quantification;
              avg.technicalDepth += card.scores.technicalDepth;
              avg.fluency += card.scores.fluency;
            }
            const n = cards.length;
            avg.relevance = Math.round((avg.relevance / n) * 10) / 10;
            avg.structure = Math.round((avg.structure / n) * 10) / 10;
            avg.quantification = Math.round((avg.quantification / n) * 10) / 10;
            avg.technicalDepth = Math.round((avg.technicalDepth / n) * 10) / 10;
            avg.fluency = Math.round((avg.fluency / n) * 10) / 10;
            setAverageScores(avg);
          }

          setLoading(false);
          return;
        }

        // Generate evaluation if not exists
        const evalRes = await fetch(`/api/interviews/${id}/evaluate`, {
          method: 'POST',
        });

        if (!evalRes.ok) {
          const errData = await evalRes.json().catch(() => null);
          throw new Error(errData?.error || '生成评估失败');
        }

        const evalData = await evalRes.json();
        setEvaluation(evalData.evaluation as Evaluation);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }
    fetchEvaluation();
  }, [id]);

  const toggleQuestion = (idx: number) => {
    setExpandedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          正在生成面试评估报告...
        </p>
        <p className="text-xs text-muted-foreground">
          AI 正在分析你的面试表现，请稍候
        </p>
      </div>
    );
  }

  if (error || !evaluation) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 py-20">
        <XCircle className="h-12 w-12 text-destructive" />
        <p className="text-destructive">{error || '评估数据不存在'}</p>
        <Link href={`/interviews/${id}`}>
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回面试详情
          </Button>
        </Link>
      </div>
    );
  }

  const ratingConfig = RATING_CONFIG[evaluation.overallRating];
  const RatingIcon = ratingConfig.icon;

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/interviews/${id}`}>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">面试评估报告</h1>
          <p className="text-sm text-muted-foreground">
            AI 基于你的面试表现生成的评估和改进建议
          </p>
        </div>
      </div>

      {/* Radar Chart - computed from coach cards */}
      {averageScores && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">能力雷达图</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <RadarChart scores={averageScores} />
          </CardContent>
        </Card>
      )}

      {/* Overall score card */}
      <Card className={cn('border-2', ratingConfig.bgColor)}>
        <CardContent className="flex items-center justify-between py-6">
          <div className="flex items-center gap-4">
            <RatingIcon className={cn('h-12 w-12', ratingConfig.color)} />
            <div>
              <div className={cn('text-2xl font-bold', ratingConfig.color)}>
                {ratingConfig.label}
              </div>
              <div className="text-sm text-muted-foreground">综合评级</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold">{evaluation.overallScore}</div>
            <div className="text-sm text-muted-foreground">/ 10 综合得分</div>
          </div>
        </CardContent>
      </Card>

      {/* Strengths and Weaknesses */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base text-green-600">
              <Star className="h-4 w-4" />
              表现亮点
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {evaluation.strengths.map((s, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-500" />
                  <span>{s}</span>
                </li>
              ))}
              {evaluation.strengths.length === 0 && (
                <li className="text-sm text-muted-foreground">暂无</li>
              )}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base text-red-600">
              <Target className="h-4 w-4" />
              待改进项
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {evaluation.weaknesses.map((w, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" />
                  <span>{w}</span>
                </li>
              ))}
              {evaluation.weaknesses.length === 0 && (
                <li className="text-sm text-muted-foreground">暂无</li>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Improvement Suggestions */}
      {evaluation.suggestions.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base text-blue-600">
              <Lightbulb className="h-4 w-4" />
              改进建议
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {evaluation.suggestions.map((s, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <TrendingUp className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-500" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Per-question breakdown */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">逐题评估</h2>
        {evaluation.questions.map((q, idx) => (
          <Card key={idx}>
            <button
              type="button"
              className="w-full text-left"
              onClick={() => toggleQuestion(idx)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <ScoreBadge score={q.score} />
                    <CardTitle className="text-sm font-medium truncate">
                      {q.question}
                    </CardTitle>
                  </div>
                  {expandedQuestions.has(idx) ? (
                    <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                </div>
                {/* Score bar */}
                <div className="mt-2">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        q.score >= 7
                          ? 'bg-green-500'
                          : q.score >= 4
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                      )}
                      style={{ width: `${(q.score / 10) * 100}%` }}
                    />
                  </div>
                </div>
              </CardHeader>
            </button>

            {expandedQuestions.has(idx) && (
              <CardContent className="space-y-4 pt-0">
                {/* User's answer */}
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-1">
                    你的回答
                  </div>
                  <p className="text-sm rounded-md bg-muted p-3 whitespace-pre-wrap">
                    {q.answer}
                  </p>
                </div>

                {/* Highlights */}
                {q.highlights.length > 0 && (
                  <div>
                    <div className="text-xs font-medium text-green-600 mb-1">
                      回答亮点
                    </div>
                    <ul className="space-y-1">
                      {q.highlights.map((h, hidx) => (
                        <li
                          key={hidx}
                          className="flex items-start gap-2 text-sm text-green-700"
                        >
                          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Improvements */}
                {q.improvements.length > 0 && (
                  <div>
                    <div className="text-xs font-medium text-red-600 mb-1">
                      改进建议
                    </div>
                    <ul className="space-y-1">
                      {q.improvements.map((imp, iidx) => (
                        <li
                          key={iidx}
                          className="flex items-start gap-2 text-sm text-red-700"
                        >
                          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                          <span>{imp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Reference answer */}
                {q.referenceAnswer && (
                  <div>
                    <div className="text-xs font-medium text-blue-600 mb-1">
                      参考答案 / 答题框架
                    </div>
                    <p className="text-sm rounded-md border border-blue-200 bg-blue-50 p-3 whitespace-pre-wrap">
                      {q.referenceAnswer}
                    </p>
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* Back button */}
      <div className="flex justify-center pb-8">
        <Link href="/interviews">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回面试列表
          </Button>
        </Link>
      </div>
    </div>
  );
}

function ScoreBadge({ score }: { score: number }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'shrink-0 font-mono text-xs',
        score >= 7
          ? 'border-green-300 bg-green-50 text-green-700'
          : score >= 4
            ? 'border-yellow-300 bg-yellow-50 text-yellow-700'
            : 'border-red-300 bg-red-50 text-red-700'
      )}
    >
      {score}/10
    </Badge>
  );
}
