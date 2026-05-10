'use client';

import { useRef, useEffect } from 'react';
import { Loader2, MessageCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { CoachCardComponent } from './coach-card';
import type { CoachCard } from '@/lib/ai/interview-coach';

interface CoachPanelProps {
  cards: CoachCard[];
  loadingIndex: number | null;
  onRewind: (questionIndex: number) => void;
  onBookmark: (questionIndex: number) => void;
}

export function CoachPanel({
  cards,
  loadingIndex,
  onRewind,
  onBookmark,
}: CoachPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new card appears or loading state changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [cards.length, loadingIndex]);

  // Empty state
  if (cards.length === 0 && loadingIndex === null) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-4 text-center">
        <MessageCircle className="h-10 w-10 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">
          开始面试后，AI 教练会在这里实时点评你的每一轮回答
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto p-3 space-y-3">
      {cards.map((card, idx) => (
        <CoachCardComponent
          key={`${card.questionIndex}-${idx}`}
          card={card}
          isLatest={idx === cards.length - 1 && loadingIndex === null}
          onRewind={onRewind}
          onBookmark={onBookmark}
        />
      ))}

      {/* Loading skeleton card */}
      {loadingIndex !== null && (
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">
              AI 教练分析中...
            </span>
          </div>
          <Skeleton className="h-3 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <div className="space-y-2 pt-1">
            <Skeleton className="h-2 w-full" />
            <Skeleton className="h-2 w-full" />
            <Skeleton className="h-2 w-4/5" />
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
