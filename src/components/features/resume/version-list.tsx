'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Loader2,
  Plus,
  Pencil,
  Copy,
  Trash2,
  GitCompareArrows,
  Check,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

// ---- Types ----

interface ResumeVersionSummary {
  id: string;
  name: string;
  createdAt: string;
  resumeId: string;
}

interface VersionListProps {
  resumeId: string;
}

// ---- Component ----

export function VersionList({ resumeId }: VersionListProps) {
  const router = useRouter();
  const [versions, setVersions] = useState<ResumeVersionSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Create new version state
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [showCreateInput, setShowCreateInput] = useState(false);

  // Rename state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  // ---- Fetch versions ----

  const fetchVersions = useCallback(async () => {
    try {
      const res = await fetch(`/api/resumes/${resumeId}/versions`);
      if (!res.ok) throw new Error('获取版本列表失败');
      const data = await res.json();
      setVersions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setIsLoading(false);
    }
  }, [resumeId]);

  useEffect(() => {
    fetchVersions();
  }, [fetchVersions]);

  // ---- Create version ----

  const handleCreate = useCallback(
    async (baseVersionId?: string) => {
      if (!newName.trim()) return;
      setIsCreating(true);
      try {
        const res = await fetch(`/api/resumes/${resumeId}/versions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: newName.trim(),
            baseVersionId,
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || '创建失败');
        }
        setNewName('');
        setShowCreateInput(false);
        await fetchVersions();
        router.refresh();
      } catch (err) {
        alert(err instanceof Error ? err.message : '创建版本失败');
      } finally {
        setIsCreating(false);
      }
    },
    [resumeId, newName, fetchVersions, router]
  );

  // ---- Duplicate version ----

  const handleDuplicate = useCallback(
    async (baseVersionId: string, baseName: string) => {
      const name = `${baseName} (副本)`;
      setIsCreating(true);
      try {
        const res = await fetch(`/api/resumes/${resumeId}/versions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, baseVersionId }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || '复制失败');
        }
        await fetchVersions();
        router.refresh();
      } catch (err) {
        alert(err instanceof Error ? err.message : '复制版本失败');
      } finally {
        setIsCreating(false);
      }
    },
    [resumeId, fetchVersions, router]
  );

  // ---- Rename version ----

  const handleRename = useCallback(
    async (versionId: string) => {
      if (!editingName.trim()) return;
      try {
        const res = await fetch(
          `/api/resumes/${resumeId}/versions/${versionId}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: editingName.trim() }),
          }
        );
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || '重命名失败');
        }
        setEditingId(null);
        setEditingName('');
        await fetchVersions();
      } catch (err) {
        alert(err instanceof Error ? err.message : '重命名失败');
      }
    },
    [resumeId, editingName, fetchVersions]
  );

  // ---- Delete version ----

  const handleDelete = useCallback(
    async (versionId: string, versionName: string) => {
      const confirmed = window.confirm(
        `确定要删除版本"${versionName}"吗？此操作不可撤销。`
      );
      if (!confirmed) return;

      try {
        const res = await fetch(
          `/api/resumes/${resumeId}/versions/${versionId}`,
          { method: 'DELETE' }
        );
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || '删除失败');
        }
        await fetchVersions();
        router.refresh();
      } catch (err) {
        alert(err instanceof Error ? err.message : '删除版本失败');
      }
    },
    [resumeId, fetchVersions, router]
  );

  // ---- Render ----

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-destructive">
          {error}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>版本管理</CardTitle>
          <CardDescription>
            管理不同岗位方向的简历版本
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          {versions.length >= 2 && (
            <Link href={`/resumes/${resumeId}/compare`}>
              <Button variant="outline" size="sm">
                <GitCompareArrows className="mr-1 h-3 w-3" />
                对比版本
              </Button>
            </Link>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCreateInput(true)}
            disabled={showCreateInput}
          >
            <Plus className="mr-1 h-3 w-3" />
            新建版本
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Create new version input */}
        {showCreateInput && (
          <div className="flex items-center gap-2 rounded-lg border border-dashed p-3">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={'输入版本名称（如"产品岗版本"）'}
              className="flex-1"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreate();
                if (e.key === 'Escape') {
                  setShowCreateInput(false);
                  setNewName('');
                }
              }}
            />
            <Button
              size="sm"
              onClick={() => handleCreate()}
              disabled={isCreating || !newName.trim()}
            >
              {isCreating ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Check className="h-3 w-3" />
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setShowCreateInput(false);
                setNewName('');
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}

        {/* Version list */}
        {versions.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            暂无版本，点击上方按钮创建第一个版本
          </p>
        ) : (
          versions.map((version) => (
            <div
              key={version.id}
              className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
            >
              <div className="min-w-0 flex-1">
                {editingId === version.id ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="h-7 text-sm"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRename(version.id);
                        if (e.key === 'Escape') {
                          setEditingId(null);
                          setEditingName('');
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                      onClick={() => handleRename(version.id)}
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                      onClick={() => {
                        setEditingId(null);
                        setEditingName('');
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <p className="truncate text-sm font-medium">
                      {version.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      创建于{' '}
                      {new Date(version.createdAt).toLocaleDateString(
                        'zh-CN',
                        {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        }
                      )}
                    </p>
                  </>
                )}
              </div>

              {editingId !== version.id && (
                <div className="flex shrink-0 items-center gap-1">
                  <Link
                    href={`/resumes/${resumeId}/versions/${version.id}`}
                  >
                    <Button variant="ghost" size="sm" title="编辑版本">
                      <Pencil className="h-3 w-3" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    title="重命名"
                    onClick={() => {
                      setEditingId(version.id);
                      setEditingName(version.name);
                    }}
                  >
                    <span className="text-xs">重命名</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    title="基于此版本创建副本"
                    onClick={() =>
                      handleDuplicate(version.id, version.name)
                    }
                    disabled={isCreating}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    title="删除版本"
                    onClick={() =>
                      handleDelete(version.id, version.name)
                    }
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
