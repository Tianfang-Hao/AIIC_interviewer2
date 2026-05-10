import Link from 'next/link';
import { FileQuestion, Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center text-center px-4">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
        <FileQuestion className="h-10 w-10 text-muted-foreground" />
      </div>
      <h1 className="mt-6 text-4xl font-bold">404</h1>
      <h2 className="mt-2 text-xl font-semibold">页面未找到</h2>
      <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
        你访问的页面不存在或已被移除。请检查 URL 是否正确，或返回首页。
      </p>
      <div className="mt-8 flex items-center gap-3">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Home className="h-4 w-4" />
          返回首页
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
        >
          <ArrowLeft className="h-4 w-4" />
          返回主页
        </Link>
      </div>
    </div>
  );
}
