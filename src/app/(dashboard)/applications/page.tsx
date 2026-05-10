'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type RowSelectionState,
} from '@tanstack/react-table';
import { Plus, ArrowUpDown, Trash2, Download, CheckSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { AddApplicationForm } from '@/components/features/application/add-application-form';
import { StatsDashboard } from '@/components/features/application/stats-dashboard';
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
  createdAt?: string;
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

// Filter dropdown component
function FilterDropdown<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T | '';
  options: [T, string][];
  onChange: (val: T | '') => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T | '')}
      className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
    >
      <option value="">{label}</option>
      {options.map(([optVal, optLabel]) => (
        <option key={optVal} value={optVal}>
          {optLabel}
        </option>
      ))}
    </select>
  );
}

// Batch action bar
function BatchActionBar({
  selectedCount,
  onBatchStatus,
  onBatchPriority,
  onBatchDelete,
  onClearSelection,
}: {
  selectedCount: number;
  onBatchStatus: (status: ApplicationStatus) => void;
  onBatchPriority: (priority: Priority) => void;
  onBatchDelete: () => void;
  onClearSelection: () => void;
}) {
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showPriorityMenu, setShowPriorityMenu] = useState(false);
  const statusRef = useRef<HTMLDivElement>(null);
  const priorityRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) {
        setShowStatusMenu(false);
      }
      if (priorityRef.current && !priorityRef.current.contains(e.target as Node)) {
        setShowPriorityMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 dark:border-blue-900 dark:bg-blue-950/30">
      <CheckSquare className="h-4 w-4 text-blue-600" />
      <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
        已选 {selectedCount} 条
      </span>
      <div className="flex items-center gap-2">
        {/* Batch update status */}
        <div className="relative" ref={statusRef}>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => {
              setShowStatusMenu(!showStatusMenu);
              setShowPriorityMenu(false);
            }}
          >
            批量更新进度
          </Button>
          {showStatusMenu && (
            <div className="absolute top-8 left-0 z-50 min-w-[140px] rounded-lg border bg-popover p-1 shadow-md">
              {STATUS_OPTIONS.map(([val, label]) => (
                <button
                  key={val}
                  className="flex w-full items-center rounded-md px-2 py-1 text-left text-xs hover:bg-accent"
                  onClick={() => {
                    onBatchStatus(val);
                    setShowStatusMenu(false);
                  }}
                >
                  <Badge className={cn('mr-2 border-none text-xs', STATUS_COLORS[val])}>
                    {label}
                  </Badge>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Batch update priority */}
        <div className="relative" ref={priorityRef}>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => {
              setShowPriorityMenu(!showPriorityMenu);
              setShowStatusMenu(false);
            }}
          >
            批量更新优先级
          </Button>
          {showPriorityMenu && (
            <div className="absolute top-8 left-0 z-50 min-w-[140px] rounded-lg border bg-popover p-1 shadow-md">
              {PRIORITY_OPTIONS.map(([val, label]) => (
                <button
                  key={val}
                  className="flex w-full items-center rounded-md px-2 py-1 text-left text-xs hover:bg-accent"
                  onClick={() => {
                    onBatchPriority(val);
                    setShowPriorityMenu(false);
                  }}
                >
                  <Badge className={cn('mr-2 border-none text-xs', PRIORITY_COLORS[val])}>
                    {label}
                  </Badge>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Batch delete */}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-destructive hover:text-destructive"
          onClick={onBatchDelete}
        >
          <Trash2 className="mr-1 h-3 w-3" />
          批量删除
        </Button>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="ml-auto h-7 text-xs"
        onClick={onClearSelection}
      >
        取消选择
      </Button>
    </div>
  );
}

// CSV Export utility
function exportToCSV(applications: Application[]) {
  const headers = ['公司', '岗位', '部门', '投递时间', '进度', '城市', '优先级', '备注'];
  const rows = applications.map((app) => [
    app.company,
    app.position,
    app.department || '',
    new Date(app.applyDate).toLocaleDateString('zh-CN'),
    STATUS_LABELS[app.status],
    app.location || '',
    PRIORITY_LABELS[app.priority],
    app.notes || '',
  ]);

  const csvContent = [headers, ...rows]
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    )
    .join('\n');

  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `投递记录_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [showDashboard, setShowDashboard] = useState(true);

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

  // Batch operations
  const handleBatchStatus = useCallback(
    async (status: ApplicationStatus) => {
      const selectedIds = Object.keys(rowSelection).map(
        (idx) => applications[parseInt(idx)]?.id
      ).filter(Boolean);

      if (selectedIds.length === 0) return;

      // Optimistic update
      setApplications((prev) =>
        prev.map((app) =>
          selectedIds.includes(app.id) ? { ...app, status } : app
        )
      );
      setRowSelection({});

      // API calls
      await Promise.allSettled(
        selectedIds.map((id) =>
          fetch(`/api/applications/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }),
          })
        )
      );
    },
    [rowSelection, applications]
  );

  const handleBatchPriority = useCallback(
    async (priority: Priority) => {
      const selectedIds = Object.keys(rowSelection).map(
        (idx) => applications[parseInt(idx)]?.id
      ).filter(Boolean);

      if (selectedIds.length === 0) return;

      setApplications((prev) =>
        prev.map((app) =>
          selectedIds.includes(app.id) ? { ...app, priority } : app
        )
      );
      setRowSelection({});

      await Promise.allSettled(
        selectedIds.map((id) =>
          fetch(`/api/applications/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ priority }),
          })
        )
      );
    },
    [rowSelection, applications]
  );

  const handleBatchDelete = useCallback(async () => {
    const selectedIds = Object.keys(rowSelection).map(
      (idx) => applications[parseInt(idx)]?.id
    ).filter(Boolean);

    if (selectedIds.length === 0) return;
    if (!confirm(`确定删除选中的 ${selectedIds.length} 条记录吗？`)) return;

    setApplications((prev) =>
      prev.filter((app) => !selectedIds.includes(app.id))
    );
    setRowSelection({});

    await Promise.allSettled(
      selectedIds.map((id) =>
        fetch(`/api/applications/${id}`, {
          method: 'DELETE',
        })
      )
    );
  }, [rowSelection, applications]);

  // Filter values
  const statusFilter = useMemo(
    () =>
      (columnFilters.find((f) => f.id === 'status')?.value as string) || '',
    [columnFilters]
  );

  const priorityFilter = useMemo(
    () =>
      (columnFilters.find((f) => f.id === 'priority')?.value as string) || '',
    [columnFilters]
  );

  const columns: ColumnDef<Application>[] = useMemo(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300"
            checked={table.getIsAllPageRowsSelected()}
            onChange={table.getToggleAllPageRowsSelectedHandler()}
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
          />
        ),
        size: 40,
        enableSorting: false,
      },
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
        filterFn: (row, _columnId, filterValue) => {
          if (!filterValue) return true;
          return row.original.status === filterValue;
        },
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
        filterFn: (row, _columnId, filterValue) => {
          if (!filterValue) return true;
          return row.original.priority === filterValue;
        },
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
    ],
    [updateApplication, deleteApplication]
  );

  const table = useReactTable({
    data: applications,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    enableRowSelection: true,
    state: {
      sorting,
      globalFilter,
      columnFilters,
      rowSelection,
    },
  });

  const selectedCount = Object.keys(rowSelection).length;

  // Get filtered rows for CSV export
  const filteredRows = table.getFilteredRowModel().rows.map((r) => r.original);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">投递管理</h1>
          <p className="text-muted-foreground">
            跟踪所有投递记录和进度
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDashboard(!showDashboard)}
          >
            {showDashboard ? '收起看板' : '展开看板'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => exportToCSV(filteredRows)}
            disabled={filteredRows.length === 0}
          >
            <Download className="mr-1 h-4 w-4" />
            导出 CSV
          </Button>
          <Button onClick={() => setShowAddForm(!showAddForm)}>
            <Plus className="mr-1 h-4 w-4" />
            添加投递
          </Button>
        </div>
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

      {/* Stats Dashboard */}
      {showDashboard && applications.length > 0 && (
        <StatsDashboard applications={applications} />
      )}

      {/* Filters + Search */}
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="搜索公司、岗位..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />
        <FilterDropdown
          label="全部进度"
          value={statusFilter as ApplicationStatus | ''}
          options={STATUS_OPTIONS}
          onChange={(val) => {
            setColumnFilters((prev) => {
              const others = prev.filter((f) => f.id !== 'status');
              if (!val) return others;
              return [...others, { id: 'status', value: val }];
            });
          }}
        />
        <FilterDropdown
          label="全部优先级"
          value={priorityFilter as Priority | ''}
          options={PRIORITY_OPTIONS}
          onChange={(val) => {
            setColumnFilters((prev) => {
              const others = prev.filter((f) => f.id !== 'priority');
              if (!val) return others;
              return [...others, { id: 'priority', value: val }];
            });
          }}
        />
        <span className="text-sm text-muted-foreground">
          共 {table.getFilteredRowModel().rows.length} 条记录
        </span>
      </div>

      {/* Batch Action Bar */}
      {selectedCount > 0 && (
        <BatchActionBar
          selectedCount={selectedCount}
          onBatchStatus={handleBatchStatus}
          onBatchPriority={handleBatchPriority}
          onBatchDelete={handleBatchDelete}
          onClearSelection={() => setRowSelection({})}
        />
      )}

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
                    className={cn(
                      'border-b transition-colors hover:bg-muted/30',
                      row.getIsSelected() && 'bg-blue-50 dark:bg-blue-950/20'
                    )}
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
