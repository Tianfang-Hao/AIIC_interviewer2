'use client';

import { useState } from 'react';
import { VersionDiff } from '@/components/features/resume/version-diff';
import type { ParsedResume } from '@/lib/ai/resume-parser';

interface VersionData {
  id: string;
  name: string;
  content: Record<string, unknown>;
}

interface CompareSelectorProps {
  versions: VersionData[];
}

export function CompareSelector({ versions }: CompareSelectorProps) {
  const [leftId, setLeftId] = useState(versions[0]?.id ?? '');
  const [rightId, setRightId] = useState(versions[1]?.id ?? '');

  const leftVersion = versions.find((v) => v.id === leftId);
  const rightVersion = versions.find((v) => v.id === rightId);

  return (
    <div className="space-y-6">
      {/* Selectors */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-sm font-medium">左侧版本</label>
          <select
            value={leftId}
            onChange={(e) => setLeftId(e.target.value)}
            className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {versions.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">右侧版本</label>
          <select
            value={rightId}
            onChange={(e) => setRightId(e.target.value)}
            className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {versions.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Same version warning */}
      {leftId === rightId && (
        <p className="text-sm text-muted-foreground">
          请选择两个不同的版本进行对比。
        </p>
      )}

      {/* Diff view */}
      {leftVersion && rightVersion && leftId !== rightId && (
        <VersionDiff
          leftName={leftVersion.name}
          rightName={rightVersion.name}
          leftContent={leftVersion.content as unknown as ParsedResume}
          rightContent={rightVersion.content as unknown as ParsedResume}
        />
      )}
    </div>
  );
}
