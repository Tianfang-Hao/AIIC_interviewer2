'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { ParsedResume } from '@/lib/ai/resume-parser';

// ---- Types ----

interface VersionDiffProps {
  leftName: string;
  rightName: string;
  leftContent: ParsedResume;
  rightContent: ParsedResume;
}

type DiffStatus = 'same' | 'changed' | 'added' | 'removed';

interface FieldDiff {
  label: string;
  left: string;
  right: string;
  status: DiffStatus;
}

// ---- Helpers ----

function stringify(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.filter(Boolean).join(', ');
  return JSON.stringify(value);
}

function getStatus(left: string, right: string): DiffStatus {
  if (left === right) return 'same';
  if (!left && right) return 'added';
  if (left && !right) return 'removed';
  return 'changed';
}

function diffColor(status: DiffStatus, side: 'left' | 'right'): string {
  if (status === 'same') return '';
  if (status === 'added') {
    return side === 'right'
      ? 'bg-green-100 dark:bg-green-950/40'
      : 'bg-red-50 dark:bg-red-950/20 text-muted-foreground';
  }
  if (status === 'removed') {
    return side === 'left'
      ? 'bg-red-100 dark:bg-red-950/40'
      : 'bg-green-50 dark:bg-green-950/20 text-muted-foreground';
  }
  // changed
  return side === 'left'
    ? 'bg-red-50 dark:bg-red-950/30'
    : 'bg-green-50 dark:bg-green-950/30';
}

function buildFieldDiffs(
  left: ParsedResume,
  right: ParsedResume
): { section: string; diffs: FieldDiff[] }[] {
  const sections: { section: string; diffs: FieldDiff[] }[] = [];

  // Basic info
  const basicDiffs: FieldDiff[] = [];
  const basicFields: { key: keyof ParsedResume['basic_info']; label: string }[] = [
    { key: 'name', label: '姓名' },
    { key: 'phone', label: '电话' },
    { key: 'email', label: '邮箱' },
  ];

  for (const { key, label } of basicFields) {
    const l = stringify(left.basic_info?.[key as 'name' | 'phone' | 'email'] ?? '');
    const r = stringify(right.basic_info?.[key as 'name' | 'phone' | 'email'] ?? '');
    basicDiffs.push({ label, left: l, right: r, status: getStatus(l, r) });
  }

  // Education
  const leftEdu = left.basic_info?.education ?? [];
  const rightEdu = right.basic_info?.education ?? [];
  const maxEdu = Math.max(leftEdu.length, rightEdu.length);
  for (let i = 0; i < maxEdu; i++) {
    const le = leftEdu[i];
    const re = rightEdu[i];
    const lStr = le
      ? `${le.school} | ${le.degree} | ${le.major} | GPA: ${le.gpa} | ${le.start_date}-${le.end_date}`
      : '';
    const rStr = re
      ? `${re.school} | ${re.degree} | ${re.major} | GPA: ${re.gpa} | ${re.start_date}-${re.end_date}`
      : '';
    basicDiffs.push({
      label: `教育经历 ${i + 1}`,
      left: lStr,
      right: rStr,
      status: getStatus(lStr, rStr),
    });
  }

  sections.push({ section: '基本信息', diffs: basicDiffs });

  // Experiences
  const expDiffs: FieldDiff[] = [];
  const leftExp = left.experiences ?? [];
  const rightExp = right.experiences ?? [];
  const maxExp = Math.max(leftExp.length, rightExp.length);
  for (let i = 0; i < maxExp; i++) {
    const le = leftExp[i];
    const re = rightExp[i];
    const lStr = le
      ? `[${le.type}] ${le.company_or_org} - ${le.role} (${le.duration})\n${le.descriptions?.join('; ')}\n技能: ${le.skills_involved?.join(', ')}\n成果: ${le.metrics?.join('; ')}`
      : '';
    const rStr = re
      ? `[${re.type}] ${re.company_or_org} - ${re.role} (${re.duration})\n${re.descriptions?.join('; ')}\n技能: ${re.skills_involved?.join(', ')}\n成果: ${re.metrics?.join('; ')}`
      : '';
    expDiffs.push({
      label: `经历 ${i + 1}`,
      left: lStr,
      right: rStr,
      status: getStatus(lStr, rStr),
    });
  }
  sections.push({ section: '经历', diffs: expDiffs });

  // Simple array fields
  const arrayFields: { key: keyof ParsedResume; label: string }[] = [
    { key: 'skills', label: '技能' },
    { key: 'awards', label: '获奖' },
    { key: 'certifications', label: '证书' },
  ];

  for (const { key, label } of arrayFields) {
    const l = stringify(
      (left[key] as string[])?.filter(Boolean) ?? []
    );
    const r = stringify(
      (right[key] as string[])?.filter(Boolean) ?? []
    );
    sections.push({
      section: label,
      diffs: [{ label, left: l, right: r, status: getStatus(l, r) }],
    });
  }

  return sections;
}

// ---- Component ----

export function VersionDiff({
  leftName,
  rightName,
  leftContent,
  rightContent,
}: VersionDiffProps) {
  const sections = buildFieldDiffs(leftContent, rightContent);
  const hasChanges = sections.some((s) =>
    s.diffs.some((d) => d.status !== 'same')
  );

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs">
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-green-100 dark:bg-green-950/40" />
          新增/右侧更改
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-red-100 dark:bg-red-950/40" />
          删除/左侧更改
        </span>
      </div>

      {!hasChanges && (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            两个版本完全相同，没有差异。
          </CardContent>
        </Card>
      )}

      {sections.map((section) => {
        const sectionHasChanges = section.diffs.some(
          (d) => d.status !== 'same'
        );

        return (
          <Card key={section.section}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                {section.section}
                {!sectionHasChanges && (
                  <span className="text-xs font-normal text-muted-foreground">
                    (无变化)
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Column headers */}
              <div className="mb-2 grid grid-cols-2 gap-2 text-xs font-medium text-muted-foreground">
                <div>{leftName}</div>
                <div>{rightName}</div>
              </div>

              <div className="space-y-2">
                {section.diffs.map((diff, idx) => (
                  <div key={idx}>
                    <p className="mb-1 text-xs font-medium text-muted-foreground">
                      {diff.label}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <div
                        className={`whitespace-pre-wrap rounded-md border p-2 text-xs ${diffColor(diff.status, 'left')}`}
                      >
                        {diff.left || (
                          <span className="italic text-muted-foreground">
                            (空)
                          </span>
                        )}
                      </div>
                      <div
                        className={`whitespace-pre-wrap rounded-md border p-2 text-xs ${diffColor(diff.status, 'right')}`}
                      >
                        {diff.right || (
                          <span className="italic text-muted-foreground">
                            (空)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
