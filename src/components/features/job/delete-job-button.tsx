'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function DeleteJobButton({
  jobId,
  jobName,
}: {
  jobId: string;
  jobName: string;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`确定要删除岗位「${jobName}」吗？此操作不可撤销。`)) {
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/jobs');
        router.refresh();
      }
    } catch (error) {
      console.error('Delete job error:', error);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Button
      variant="destructive"
      size="sm"
      onClick={handleDelete}
      disabled={deleting}
    >
      <Trash2 className="mr-1 h-4 w-4" />
      {deleting ? '删除中...' : '删除'}
    </Button>
  );
}
