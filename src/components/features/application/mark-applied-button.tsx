'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Send, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface MarkAppliedButtonProps {
  jobId: string;
  company: string;
  position: string;
  department: string | null;
  location: string | null;
  alreadyApplied: boolean;
}

export function MarkAppliedButton({
  jobId,
  company,
  position,
  department,
  location,
  alreadyApplied: initialApplied,
}: MarkAppliedButtonProps) {
  const router = useRouter();
  const [applied, setApplied] = useState(initialApplied);
  const [submitting, setSubmitting] = useState(false);

  if (applied) {
    return (
      <Badge className="border-none bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
        <Check className="mr-1 h-3 w-3" />
        已投递
      </Badge>
    );
  }

  const handleApply = async () => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId,
          company,
          position,
          department,
          location,
        }),
      });

      if (res.ok) {
        setApplied(true);
        router.refresh();
      }
    } catch {
      // silently fail
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleApply}
      disabled={submitting}
    >
      <Send className="mr-1 h-4 w-4" />
      {submitting ? '标记中...' : '标记已投递'}
    </Button>
  );
}
