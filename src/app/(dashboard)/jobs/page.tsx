'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Search,
  Plus,
  MapPin,
  Building2,
  Calendar,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Target,
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { JOB_TYPE_LABELS, CITY_OPTIONS } from '@/lib/validations/job';

interface Job {
  id: string;
  company: string;
  positionName: string;
  department: string | null;
  jobType: string;
  location: string[];
  salaryRange: string | null;
  postDate: string | null;
  industry: string | null;
  companySize: string | null;
  createdAt: string;
}

interface JobsResponse {
  jobs: Job[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export default function JobsPage() {
  const [data, setData] = useState<JobsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [cityFilter, typeFilter]);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedQuery) params.set('q', debouncedQuery);
      if (cityFilter) params.set('city', cityFilter);
      if (typeFilter) params.set('jobType', typeFilter);
      params.set('page', String(page));
      params.set('pageSize', '12');

      const res = await fetch(`/api/jobs?${params.toString()}`);
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch (error) {
      console.error('Fetch jobs error:', error);
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, cityFilter, typeFilter, page]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">岗位匹配</h1>
          <p className="text-muted-foreground">
            浏览和管理岗位信息，添加新的岗位
          </p>
        </div>
        <Link href="/jobs/new" className={buttonVariants()}>
          <Plus className="mr-1 h-4 w-4" />
          添加岗位
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索公司名或岗位名..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <select
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="">全部城市</option>
          {CITY_OPTIONS.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="">全部类型</option>
          {Object.entries(JOB_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Results summary */}
      {data && !loading && (
        <p className="text-sm text-muted-foreground">
          共 {data.total} 个岗位
          {debouncedQuery && `，搜索「${debouncedQuery}」`}
          {cityFilter && `，城市：${cityFilter}`}
          {typeFilter && `，类型：${JOB_TYPE_LABELS[typeFilter]}`}
        </p>
      )}

      {/* Job cards */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-5 w-32 animate-pulse rounded bg-muted" />
                <div className="h-4 w-24 animate-pulse rounded bg-muted" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 w-40 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-28 animate-pulse rounded bg-muted" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : data && data.jobs.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.jobs.map((job) => (
            <Link key={job.id} href={`/jobs/${job.id}`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <CardTitle className="truncate">
                        {job.positionName}
                      </CardTitle>
                      <CardDescription className="mt-1 flex items-center gap-1">
                        <Building2 className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{job.company}</span>
                        {job.department && (
                          <span className="truncate text-xs">
                            · {job.department}
                          </span>
                        )}
                      </CardDescription>
                    </div>
                    <Badge
                      variant={
                        job.jobType === 'INTERN' ? 'secondary' : 'outline'
                      }
                    >
                      {JOB_TYPE_LABELS[job.jobType] || job.jobType}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {/* Location badges */}
                    {job.location.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <div className="flex flex-wrap gap-1">
                          {job.location.map((loc) => (
                            <Badge
                              key={loc}
                              variant="secondary"
                              className="text-xs"
                            >
                              {loc}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Salary */}
                    {job.salaryRange && (
                      <div className="flex items-center gap-1.5 text-sm">
                        <Briefcase className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span className="font-medium text-green-600 dark:text-green-400">
                          {job.salaryRange}
                        </span>
                      </div>
                    )}

                    {/* Post date */}
                    {job.postDate && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5 shrink-0" />
                        <span>{formatDate(job.postDate)}</span>
                      </div>
                    )}

                    {/* Industry */}
                    {job.industry && (
                      <p className="text-xs text-muted-foreground">
                        {job.industry}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Target className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="mb-1 text-lg font-medium">暂无岗位</p>
            <p className="mb-4 text-sm text-muted-foreground">
              {debouncedQuery || cityFilter || typeFilter
                ? '没有找到匹配的岗位，试试调整搜索条件'
                : '添加你的第一个岗位开始使用'}
            </p>
            {!debouncedQuery && !cityFilter && !typeFilter && (
              <Link href="/jobs/new" className={buttonVariants()}>
                <Plus className="mr-1 h-4 w-4" />
                添加岗位
              </Link>
            )}
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft className="h-4 w-4" />
            上一页
          </Button>
          <span className="text-sm text-muted-foreground">
            第 {page} / {data.totalPages} 页
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= data.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            下一页
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
