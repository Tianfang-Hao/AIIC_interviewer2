'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Save, Loader2 } from 'lucide-react';

// ============================================================
// Option definitions
// ============================================================

const POSITION_OPTIONS = [
  '前端开发',
  '后端开发',
  '算法工程师',
  '数据分析',
  '产品经理',
  '运营',
  '测试',
  '设计',
];

const JOB_TYPE_OPTIONS = [
  { label: '暑期实习', value: 'INTERN' },
  { label: '日常实习', value: 'INTERN' },
  { label: '秋招', value: 'CAMPUS' },
  { label: '春招', value: 'CAMPUS' },
  { label: '社招', value: 'SOCIAL' },
] as const;

// We store the display label in a separate field and map to JobType enum
// But since the enum only has 3 values and PRD wants 5 options, we'll use
// a string approach: store the label in companySize-like fashion.
// Actually, looking at the schema, jobType is JobType? enum. Let's provide
// the 3 enum values with clear Chinese labels.
const JOB_TYPE_ENUM_OPTIONS = [
  { label: '实习（暑期/日常）', value: 'INTERN' },
  { label: '校招（秋招/春招）', value: 'CAMPUS' },
  { label: '社招', value: 'SOCIAL' },
] as const;

const CITY_OPTIONS = [
  '北京',
  '上海',
  '深圳',
  '杭州',
  '广州',
  '成都',
  '南京',
];

const COMPANY_SIZE_OPTIONS = [
  '大厂（BAT/TMD等）',
  '中厂（独角兽/上市公司）',
  '初创公司',
  '不限',
];

const INDUSTRY_OPTIONS = [
  '电商',
  '社交',
  '金融科技',
  '教育',
  '游戏',
  '企业服务',
  'AI',
];

// ============================================================
// Multi-select toggle component
// ============================================================

function MultiSelect({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
}) {
  const toggle = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter((s) => s !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = selected.includes(option);
          return (
            <button
              key={option}
              type="button"
              onClick={() => toggle(option)}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                isSelected
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-1">
          {selected.map((s) => (
            <Badge key={s} variant="secondary">
              {s}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Single select component
// ============================================================

function SingleSelect({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: { label: string; value: string }[] | string[];
  selected: string | null;
  onChange: (value: string | null) => void;
}) {
  const normalizedOptions =
    typeof options[0] === 'string'
      ? (options as string[]).map((o) => ({ label: o, value: o }))
      : (options as { label: string; value: string }[]);

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-2">
        {normalizedOptions.map((option) => {
          const isSelected = selected === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(isSelected ? null : option.value)}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                isSelected
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// Salary range input
// ============================================================

function SalaryRangeInput({
  jobType,
  salaryMin,
  salaryMax,
  onMinChange,
  onMaxChange,
}: {
  jobType: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  onMinChange: (v: number | null) => void;
  onMaxChange: (v: number | null) => void;
}) {
  const isIntern = jobType === 'INTERN';
  const unit = isIntern ? '元/天' : '元/月';
  const minBound = isIntern ? 100 : 5000;
  const maxBound = isIntern ? 1000 : 50000;

  return (
    <div className="space-y-2">
      <Label>期望薪资（{unit}）</Label>
      <div className="flex items-center gap-3">
        <Input
          type="number"
          placeholder={`最低 ${minBound}`}
          min={minBound}
          max={maxBound}
          value={salaryMin ?? ''}
          onChange={(e) => {
            const v = e.target.value ? parseInt(e.target.value) : null;
            onMinChange(v);
          }}
          className="w-32"
        />
        <span className="text-muted-foreground">—</span>
        <Input
          type="number"
          placeholder={`最高 ${maxBound}`}
          min={minBound}
          max={maxBound}
          value={salaryMax ?? ''}
          onChange={(e) => {
            const v = e.target.value ? parseInt(e.target.value) : null;
            onMaxChange(v);
          }}
          className="w-32"
        />
        <span className="text-sm text-muted-foreground">{unit}</span>
      </div>
    </div>
  );
}

// ============================================================
// Main form
// ============================================================

interface PreferenceData {
  positions: string[];
  jobType: string | null;
  cities: string[];
  companySize: string | null;
  industries: string[];
  salaryMin: number | null;
  salaryMax: number | null;
}

const defaultPreference: PreferenceData = {
  positions: [],
  jobType: null,
  cities: [],
  companySize: null,
  industries: [],
  salaryMin: null,
  salaryMax: null,
};

export default function PreferencesPage() {
  const [data, setData] = useState<PreferenceData>(defaultPreference);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const fetchPreferences = useCallback(async () => {
    try {
      const res = await fetch('/api/preferences');
      if (res.ok) {
        const pref = await res.json();
        if (pref) {
          setData({
            positions: pref.positions ?? [],
            jobType: pref.jobType ?? null,
            cities: pref.cities ?? [],
            companySize: pref.companySize ?? null,
            industries: pref.industries ?? [],
            salaryMin: pref.salaryMin ?? null,
            salaryMax: pref.salaryMax ?? null,
          });
        }
      }
    } catch {
      console.error('Failed to fetch preferences');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setMessage({ type: 'success', text: '求职意向已保存' });
      } else {
        const err = await res.json();
        setMessage({ type: 'error', text: err.error || '保存失败' });
      }
    } catch {
      setMessage({ type: 'error', text: '网络错误，请重试' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">求职意向设置</h1>
        <p className="text-muted-foreground">
          设置你的求职偏好，帮助我们更精准地为你匹配岗位。
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>岗位偏好</CardTitle>
          <CardDescription>选择你感兴趣的岗位方向和行业</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <MultiSelect
            label="岗位方向（可多选）"
            options={POSITION_OPTIONS}
            selected={data.positions}
            onChange={(positions) => setData((d) => ({ ...d, positions }))}
          />

          <SingleSelect
            label="求职类型"
            options={JOB_TYPE_ENUM_OPTIONS as unknown as { label: string; value: string }[]}
            selected={data.jobType}
            onChange={(jobType) =>
              setData((d) => ({ ...d, jobType, salaryMin: null, salaryMax: null }))
            }
          />

          <MultiSelect
            label="行业偏好（可多选）"
            options={INDUSTRY_OPTIONS}
            selected={data.industries}
            onChange={(industries) => setData((d) => ({ ...d, industries }))}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>工作条件</CardTitle>
          <CardDescription>选择期望的工作城市、公司规模和薪资</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <MultiSelect
            label="意向城市（可多选）"
            options={CITY_OPTIONS}
            selected={data.cities}
            onChange={(cities) => setData((d) => ({ ...d, cities }))}
          />

          <SingleSelect
            label="公司规模"
            options={COMPANY_SIZE_OPTIONS}
            selected={data.companySize}
            onChange={(companySize) => setData((d) => ({ ...d, companySize }))}
          />

          <SalaryRangeInput
            jobType={data.jobType}
            salaryMin={data.salaryMin}
            salaryMax={data.salaryMax}
            onMinChange={(salaryMin) => setData((d) => ({ ...d, salaryMin }))}
            onMaxChange={(salaryMax) => setData((d) => ({ ...d, salaryMax }))}
          />
        </CardContent>
      </Card>

      {message && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            message.type === 'success'
              ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300'
              : 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving ? '保存中...' : '保存设置'}
        </Button>
      </div>
    </div>
  );
}
