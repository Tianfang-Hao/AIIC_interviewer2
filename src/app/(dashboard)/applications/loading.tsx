import { Skeleton } from '@/components/ui/skeleton';

export default function ApplicationsLoading() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-32" />
          <Skeleton className="mt-2 h-4 w-48" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-24 rounded-md" />
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Skeleton className="h-9 w-48 rounded-md" />
        <Skeleton className="h-9 w-28 rounded-md" />
        <Skeleton className="h-9 w-28 rounded-md" />
      </div>

      {/* Table skeleton */}
      <div className="rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                {Array.from({ length: 8 }).map((_, i) => (
                  <th key={i} className="h-10 px-3">
                    <Skeleton className="h-4 w-16" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 8 }).map((_, rowIdx) => (
                <tr key={rowIdx} className="border-b">
                  {Array.from({ length: 8 }).map((_, colIdx) => (
                    <td key={colIdx} className="px-3 py-3">
                      <Skeleton
                        className={`h-4 ${colIdx === 0 ? 'w-4' : colIdx === 7 ? 'w-4' : 'w-16'}`}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
