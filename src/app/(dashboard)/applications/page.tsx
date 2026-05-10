'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { Plus, ArrowUpDown, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { AddApplicationForm } from '@/components/features/application/add-application-form';
import {
  STATUS_LABELS,
  PRIORITY_LABELS,
  STATUS_COLORS,
  PRIORITY_COLORS,
  STATUS_OPTIONS,
  PRIORITY_OPTIONS,
} from '@/lib/constants/application';
import type {
  ApplicationStatus,
  Priority,
} from '@/generated/prisma/client';
import { cn } from '@/lib/utils';

interface Application {
  id: string;
  company: string;
  position: string;
  department: string | null;
  applyDate: string;
  status: ApplicationStatus;
  location: string | null;
  priority: Priority;
  notes: string | null;
  jobId: string | null;
}

// Inline select for status/priority editing
function InlineSelect<T extends string>({
  value,
  options,
  colorMap,
  labelMap,
  onSave,
}: {
  value: T;
  options: [T, string][];
  colorMap: Record<T, string>;
  labelMap: Record<T, string>;
  onSave: (val: T) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="cursor-pointer"
        title="点击修改"
      >
        <Badge
          className={cn(
            'border-none text-xs',
            colorMap[value]
          )}
        >
          {labelMap[value]}
        </Badge>
      </button>
    );
  }

  return (
    <div ref={ref} className="absolute z-50 mt-1 min-w-[140px] rounded-lg border bg-popover p-1 shadow-md">
      {options.map(([optVal, label]) => (
        <button
          key={optVal}
          className={cn(
            'flex w-full items-center rounded-md px-2 py-1 text-left text-xs hover:bg-accent',
            optVal === value && 'bg-accent'
          )}
          onClick={() => {
            onSave(optVal);
            setOpen(false);
          }}
        >
          <Badge
            className={cn(
              'mr-2 border-none text-xs',
              colorMap[optVal]
            )}
          >
            {label}
          </Badge>
        </button>
      ))}
    </div>
  );
}

// Inline text editor for notes
function InlineTextEdit({
  value,
  onSave,
}: {
  value: string;
  onSave: (val: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setText(value);
  }, [value]);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
    }
  }, [editing]);

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="w-full cursor-pointer truncate text-left text-xs text-muted-foreground hover:text-foreground"
        title={value || '点击添加备注'}
      >
        {value || '-'}
      </button>
    );
  }

  return (
    <Input
      ref={inputRef}
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={() => {
        setEditing(false);
        if (text !== value) {
          onSave(text);
        }
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          setEditing(false);
          if (text !== value) {
            onSave(text);
          }
        }
        if (e.key === 'Escape') {
          setText(value);
          setEditing(false);
        }
      }}
      className="h-7 text-xs"
    />
  );
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const fetchApplications = useCallback(async () => {
    try {
      const res = await fetch('/api/applications');
      if (res.ok) {
        const data = await res.json();
        setApplications(data.applications);
      }
    } catch (error) {
      console.error('Failed to fetch applications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const updateApplication = useCallback(
    async (id: string, field: string, value: unknown) => {
      // Optimistic update
      setApplications((prev) =>
        prev.map((app) =>
          app.id === id ? { ...app, [field]: value } : app
        )
      );

      try {
        const res = await fetch(`/api/applications/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ [field]: value }),
        });

        if (!res.ok) {
          // Revert on failure
          fetchApplications();
        }
      } catch {
        fetchApplications();
      }
    },
    [fetchApplications]
  );

  const deleteApplication = useCallback(
    async (id: string) => {
      if (!confirm('确定删除这条投递记录吗？')) return;

      setApplications((prev) => prev.filter((app) => app.id !== id));

      try {
        const res = await fetch(`/api/applications/${id}`, {
          method: 'DELETE',
        });
        if (!res.ok) {
          fetchApplications();
        }
      } catch {
        fetchApplications();
      }
    },
    [fetchApplications]
  );

  const columns: ColumnDef<Application>[] = [
    {
      accessorKey: 'company',
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          公司
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="font-medium">{row.getValue('company')}</span>
      ),
    },
    {
      accessorKey: 'position',
      header: '岗位',
      cell: ({ row }) => (
        <span className="text-sm">{row.getValue('position')}</span>
      ),
    },
    {
      accessorKey: 'department',
      header: '部门',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.getValue('department') || '-'}
        </span>
      ),
    },
    {
      accessorKey: 'applyDate',
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          投递时间
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => {
        const date = new Date(row.getValue('applyDate'));
        return (
          <span className="text-sm text-muted-foreground">
            {date.toLocaleDateString('zh-CN', {
              month: '2-digit',
              day: '2-digit',
            })}
          </span>
        );
      },
    },
    {
      accessorKey: 'status',
      header: '进度',
      cell: ({ row }) => (
        <div className="relative">
          <InlineSelect
            value={row.original.status}
            options={STATUS_OPTIONS}
            colorMap={STATUS_COLORS}
            labelMap={STATUS_LABELS}
            onSave={(val) =>
              updateApplication(row.original.id, 'status', val)
            }
          />
        </div>
      ),
    },
    {
      accessorKey: 'location',
      header: '城市',
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.getValue('location') || '-'}
        </span>
      ),
    },
    {
      accessorKey: 'priority',
      header: ({ column }) => (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          优先级
          <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="relative">
          <InlineSelect
            value={row.original.priority}
            options={PRIORITY_OPTIONS}
            colorMap={PRIORITY_COLORS}
            labelMap={PRIORITY_LABELS}
            onSave={(val) =>
              updateApplication(row.original.id, 'priority', val)
            }
          />
        </div>
      ),
    },
    {
      accessorKey: 'notes',
      header: '备注',
      cell: ({ row }) => (
        <InlineTextEdit
          value={row.original.notes || ''}
          onSave={(val) =>
            updateApplication(row.original.id, 'notes', val)
          }
        />
      ),
      size: 200,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
          onClick={() => deleteApplication(row.original.id)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      ),
      size: 40,
    },
  ];

  const table = useReactTable({
    data: applications,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      globalFilter,
    },
  });

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">投递管理</h1>
          <p className="text-muted-foreground">
            跟踪所有投递记录和进度
          </p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          <Plus className="mr-1 h-4 w-4" />
          添加投递
        </Button>
      </div>

      {showAddForm && (
        <AddApplicationForm
          onSuccess={() => {
            setShowAddForm(false);
            fetchApplications();
          }}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {/* Search */}
      <div className="flex items-center gap-4">
        <Input
          placeholder="搜索公司、岗位..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />
        <span className="text-sm text-muted-foreground">
          共 {table.getFilteredRowModel().rows.length} 条记录
        </span>
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b bg-muted/50">
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="h-10 px-3 text-left text-xs font-medium text-muted-foreground"
                      style={{
                        width:
                          header.getSize() !== 150
                            ? header.getSize()
                            : undefined,
                      }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="h-24 text-center text-sm text-muted-foreground"
                  >
                    加载中...
                  </td>
                </tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="h-24 text-center text-sm text-muted-foreground"
                  >
                    暂无投递记录，点击「添加投递」开始记录
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b transition-colors hover:bg-muted/30"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-3 py-2">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
