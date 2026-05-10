'use client';

import { useCallback } from 'react';
import { ResumeEditForm } from '@/components/features/resume/resume-edit-form';
import type { ParsedResume } from '@/lib/ai/resume-parser';

interface VersionEditorProps {
  resumeId: string;
  versionId: string;
  initialData: ParsedResume;
}

export function VersionEditor({
  resumeId,
  versionId,
  initialData,
}: VersionEditorProps) {
  const handleSave = useCallback(
    async (cleaned: ParsedResume) => {
      const res = await fetch(
        `/api/resumes/${resumeId}/versions/${versionId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: cleaned }),
        }
      );

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || '保存失败');
      }
    },
    [resumeId, versionId]
  );

  return <ResumeEditForm initialData={initialData} onSave={handleSave} />;
}
