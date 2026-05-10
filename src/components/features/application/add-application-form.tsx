'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PRIORITY_LABELS } from '@/lib/constants/application';
import type { Priority } from '@/generated/prisma/client';

interface AddApplicationFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  defaultValues?: {
    company?: string;
    position?: string;
    department?: string;
    location?: string;
    jobId?: string;
  };
}

export function AddApplicationForm({
  onSuccess,
  onCancel,
  defaultValues,
}: AddApplicationFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [company, setCompany] = useState(defaultValues?.company || '');
  const [position, setPosition] = useState(defaultValues?.position || '');
  const [department, setDepartment] = useState(
    defaultValues?.department || ''
  );
  const [location, setLocation] = useState(defaultValues?.location || '');
  const [priority, setPriority] = useState<Priority>('P2');
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.trim() || !position.trim()) {
      setError('公司名称和岗位名称为必填项');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: company.trim(),
          position: position.trim(),
          department: department.trim() || null,
          location: location.trim() || null,
          priority,
          notes: notes.trim() || null,
          jobId: defaultValues?.jobId || null,
        }),
      });

      if (!res.ok) {
        const result = await res.json();
        setError(result.error || '创建失败');
        return;
      }

      onSuccess();
    } catch {
      setError('网络错误，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>添加投递记录</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="app-company">公司名称 *</Label>
              <Input
                id="app-company"
                placeholder="如：字节跳动"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="app-position">岗位名称 *</Label>
              <Input
                id="app-position"
                placeholder="如：前端开发工程师"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="app-department">部门</Label>
              <Input
                id="app-department"
                placeholder="如：基础架构部"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="app-location">城市</Label>
              <Input
                id="app-location"
                placeholder="如：北京"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="app-priority">优先级</Label>
              <select
                id="app-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="app-notes">备注</Label>
            <textarea
              id="app-notes"
              rows={2}
              placeholder="添加备注信息..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onCancel}>
              取消
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? '添加中...' : '添加记录'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
