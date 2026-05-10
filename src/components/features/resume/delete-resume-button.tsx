'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DeleteResumeButtonProps {
  resumeId: string;
  fileName: string;
}

export function DeleteResumeButton({
  resumeId,
  fileName,
}: DeleteResumeButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = useCallback(async () => {
    const confirmed = window.confirm(
      `确定要删除简历"${fileName}"吗？此操作不可撤销。`
    );
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/resumes/${resumeId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.refresh();
      } else {
        const data = await response.json();
        alert(data.error || '删除失败');
      }
    } catch {
      alert('网络错误，请重试');
    } finally {
      setIsDeleting(false);
    }
  }, [resumeId, fileName, router]);

  return (
    <Button
      variant="destructive"
      size="sm"
      onClick={handleDelete}
      disabled={isDeleting}
    >
      {isDeleting ? (
        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
      ) : (
        <Trash2 className="mr-1 h-3 w-3" />
      )}
      删除
    </Button>
  );
}
