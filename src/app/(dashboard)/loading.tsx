import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardGroupLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-40" />
        <Skeleton className="mt-2 h-4 w-72" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border bg-card p-6"
          >
            <Skeleton className="h-5 w-32" />
            <Skeleton className="mt-3 h-4 w-48" />
            <Skeleton className="mt-2 h-4 w-36" />
          </div>
        ))}
      </div>
    </div>
  );
}
