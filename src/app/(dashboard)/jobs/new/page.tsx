'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { jobSchema, type JobInput, type JobOutput, JOB_TYPE_LABELS } from '@/lib/validations/job';

export default function NewJobPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<JobInput, unknown, JobOutput>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      jobType: 'CAMPUS',
    },
  });

  const onSubmit = async (data: JobOutput) => {
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          postDate: data.postDate || null,
          deadline: data.deadline || null,
          sourceUrl: data.sourceUrl || null,
        }),
      });

      if (!res.ok) {
        const result = await res.json();
        setError(result.error || '创建失败');
        return;
      }

      router.push('/jobs');
      router.refresh();
    } catch {
      setError('网络错误，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/jobs"
          className={buttonVariants({ variant: 'ghost', size: 'sm' })}
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          返回
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">添加岗位</h1>
          <p className="text-muted-foreground">手动录入一个新的岗位信息</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic info */}
        <Card>
          <CardHeader>
            <CardTitle>基本信息</CardTitle>
            <CardDescription>岗位的核心信息</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="company">公司名称 *</Label>
                <Input
                  id="company"
                  placeholder="如：字节跳动"
                  {...register('company')}
                />
                {errors.company && (
                  <p className="text-xs text-destructive">
                    {errors.company.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="positionName">岗位名称 *</Label>
                <Input
                  id="positionName"
                  placeholder="如：前端开发工程师"
                  {...register('positionName')}
                />
                {errors.positionName && (
                  <p className="text-xs text-destructive">
                    {errors.positionName.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="department">部门</Label>
                <Input
                  id="department"
                  placeholder="如：基础架构部"
                  {...register('department')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="jobType">岗位类型 *</Label>
                <select
                  id="jobType"
                  {...register('jobType')}
                  className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {Object.entries(JOB_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="location">工作地点 *</Label>
                <Input
                  id="location"
                  placeholder="多个城市用逗号分隔，如：北京, 上海"
                  {...register('location')}
                />
                {errors.location && (
                  <p className="text-xs text-destructive">
                    {errors.location.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="salaryRange">薪资范围</Label>
                <Input
                  id="salaryRange"
                  placeholder="如：25k-40k·16薪"
                  {...register('salaryRange')}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="industry">行业</Label>
                <Input
                  id="industry"
                  placeholder="如：互联网/科技"
                  {...register('industry')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companySize">公司规模</Label>
                <Input
                  id="companySize"
                  placeholder="如：10000人以上"
                  {...register('companySize')}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* JD Content */}
        <Card>
          <CardHeader>
            <CardTitle>职位描述</CardTitle>
            <CardDescription>完整的 JD 内容</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="jdContent">JD 内容</Label>
              <textarea
                id="jdContent"
                rows={6}
                placeholder="粘贴完整的职位描述..."
                {...register('jdContent')}
                className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="requirements">任职要求</Label>
              <textarea
                id="requirements"
                rows={4}
                placeholder="每行一条要求，如：&#10;本科及以上学历&#10;熟悉 React/Vue 等前端框架&#10;有良好的编码习惯"
                {...register('requirements')}
                className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="preferred">优先条件</Label>
              <textarea
                id="preferred"
                rows={3}
                placeholder="每行一条优先条件，如：&#10;有开源项目贡献经验&#10;熟悉 TypeScript"
                {...register('preferred')}
                className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>
          </CardContent>
        </Card>

        {/* Dates and links */}
        <Card>
          <CardHeader>
            <CardTitle>其他信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="postDate">发布日期</Label>
                <Input id="postDate" type="date" {...register('postDate')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deadline">截止日期</Label>
                <Input id="deadline" type="date" {...register('deadline')} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sourceUrl">原始链接</Label>
              <Input
                id="sourceUrl"
                type="url"
                placeholder="https://..."
                {...register('sourceUrl')}
              />
              {errors.sourceUrl && (
                <p className="text-xs text-destructive">
                  {errors.sourceUrl.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
        <div className="flex justify-end gap-3">
          <Link href="/jobs" className={buttonVariants({ variant: 'outline' })}>
            取消
          </Link>
          <Button type="submit" disabled={submitting}>
            {submitting ? '提交中...' : '添加岗位'}
          </Button>
        </div>
      </form>
    </div>
  );
}
