'use client';

import { useEffect } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import Link from 'next/link';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="h-8 w-8 text-destructive" />
      </div>
      <h2 className="mt-6 text-xl font-semibold">出了点问题</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        页面加载时遇到了错误。这可能是暂时的问题，请尝试刷新页面。
      </p>
      {error.digest && (
        <p className="mt-2 text-xs text-muted-foreground">
          错误代码：{error.digest}
        </p>
      )}
      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <RotateCcw className="h-4 w-4" />
          重试
        </button>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
        >
          <Home className="h-4 w-4" />
          返回首页
        </Link>
      </div>
    </div>
  );
}
