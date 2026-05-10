'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import {
  Loader2,
  Sparkles,
  Save,
  Plus,
  X,
  Briefcase,
  GraduationCap,
  User,
  Award,
  Wrench,
  ShieldCheck,
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
import type { ParsedResume, Experience, Education } from '@/lib/ai/resume-parser';

// ---- Form Types ----

interface ResumeFormData {
  basic_info: {
    name: string;
    phone: string;
    email: string;
    education: Education[];
  };
  experiences: Experience[];
  skills: string[];
  awards: string[];
  certifications: string[];
}

interface ResumeDetailProps {
  resumeId: string;
  fileName: string;
  fileUrl: string | null;
  parsedData: ParsedResume | null;
}

// ---- Helpers ----

const EXPERIENCE_TYPES = [
  { value: 'internship', label: '实习' },
  { value: 'project', label: '项目' },
  { value: 'research', label: '科研' },
  { value: 'competition', label: '竞赛' },
] as const;

function emptyEducation(): Education {
  return { school: '', degree: '', major: '', gpa: '', start_date: '', end_date: '' };
}

function emptyExperience(): Experience {
  return {
    id: `exp-${Date.now()}`,
    type: 'project',
    company_or_org: '',
    role: '',
    duration: '',
    descriptions: [''],
    skills_involved: [''],
    metrics: [''],
  };
}

function defaultFormData(): ResumeFormData {
  return {
    basic_info: { name: '', phone: '', email: '', education: [emptyEducation()] },
    experiences: [emptyExperience()],
    skills: [''],
    awards: [''],
    certifications: [''],
  };
}

// ---- Component ----

export function ResumeDetail({
  resumeId,
  fileName: _fileName,
  fileUrl,
  parsedData: initialParsedData,
}: ResumeDetailProps) {
  const router = useRouter();
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [parseError, setParseError] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const [parsedData, setParsedData] = useState<ParsedResume | null>(
    initialParsedData
  );

  // ---- Parse handler ----

  const handleParse = useCallback(async () => {
    setIsParsing(true);
    setParseError('');
    try {
      const res = await fetch(`/api/resumes/${resumeId}/parse`, {
        method: 'POST',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '解析失败');
      }
      const data = await res.json();
      setParsedData(data.parsedData as ParsedResume);
      router.refresh();
    } catch (err) {
      setParseError(err instanceof Error ? err.message : '解析失败，请重试');
    } finally {
      setIsParsing(false);
    }
  }, [resumeId, router]);

  // ---- Unparsed state ----

  if (!parsedData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI 简历解析</CardTitle>
          <CardDescription>
            使用 AI 自动提取简历中的结构化信息
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4 py-8">
          {fileUrl && (
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mb-2 text-sm text-primary underline underline-offset-4"
            >
              查看原始文件
            </a>
          )}
          <Button onClick={handleParse} disabled={isParsing} size="lg">
            {isParsing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                正在解析...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                开始 AI 解析
              </>
            )}
          </Button>
          {isParsing && (
            <p className="text-sm text-muted-foreground">
              AI 正在分析您的简历，这可能需要 10-30 秒...
            </p>
          )}
          {parseError && (
            <p className="text-sm text-destructive">{parseError}</p>
          )}
        </CardContent>
      </Card>
    );
  }

  // ---- Parsed state: show editable form ----

  return (
    <ResumeEditForm
      resumeId={resumeId}
      fileUrl={fileUrl}
      initialData={parsedData}
      isSaving={isSaving}
      setIsSaving={setIsSaving}
      saveMessage={saveMessage}
      setSaveMessage={setSaveMessage}
      onReparse={handleParse}
      isParsing={isParsing}
    />
  );
}

// ---- Edit Form (separated for hook rules) ----

function ResumeEditForm({
  resumeId,
  fileUrl,
  initialData,
  isSaving,
  setIsSaving,
  saveMessage,
  setSaveMessage,
  onReparse,
  isParsing,
}: {
  resumeId: string;
  fileUrl: string | null;
  initialData: ParsedResume;
  isSaving: boolean;
  setIsSaving: (v: boolean) => void;
  saveMessage: string;
  setSaveMessage: (v: string) => void;
  onReparse: () => void;
  isParsing: boolean;
}) {
  const { register, control, handleSubmit } = useForm<ResumeFormData>({
    defaultValues: {
      basic_info: {
        name: initialData.basic_info?.name ?? '',
        phone: initialData.basic_info?.phone ?? '',
        email: initialData.basic_info?.email ?? '',
        education:
          initialData.basic_info?.education?.length > 0
            ? initialData.basic_info.education
            : [emptyEducation()],
      },
      experiences:
        initialData.experiences?.length > 0
          ? initialData.experiences
          : [emptyExperience()],
      skills:
        initialData.skills?.length > 0 ? initialData.skills : [''],
      awards:
        initialData.awards?.length > 0 ? initialData.awards : [''],
      certifications:
        initialData.certifications?.length > 0
          ? initialData.certifications
          : [''],
    },
  });

  // Field arrays
  const {
    fields: eduFields,
    append: appendEdu,
    remove: removeEdu,
  } = useFieldArray({ control, name: 'basic_info.education' as const });

  const {
    fields: expFields,
    append: appendExp,
    remove: removeExp,
  } = useFieldArray({ control, name: 'experiences' });

  const {
    fields: skillFields,
    append: appendSkill,
    remove: removeSkill,
  } = useFieldArray({
    control,
    // skills is string[], react-hook-form needs object form
    name: 'skills' as never,
  });

  const {
    fields: awardFields,
    append: appendAward,
    remove: removeAward,
  } = useFieldArray({ control, name: 'awards' as never });

  const {
    fields: certFields,
    append: appendCert,
    remove: removeCert,
  } = useFieldArray({ control, name: 'certifications' as never });

  const onSubmit = async (data: ResumeFormData) => {
    setIsSaving(true);
    setSaveMessage('');
    try {
      // Filter out empty strings from arrays
      const cleaned: ParsedResume = {
        ...data,
        skills: data.skills.filter((s) => typeof s === 'string' ? s.trim() !== '' : true),
        awards: data.awards.filter((s) => typeof s === 'string' ? s.trim() !== '' : true),
        certifications: data.certifications.filter((s) => typeof s === 'string' ? s.trim() !== '' : true),
      };

      const res = await fetch(`/api/resumes/${resumeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parsedData: cleaned }),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || '保存失败');
      }
      setSaveMessage('保存成功');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (err) {
      setSaveMessage(
        err instanceof Error ? err.message : '保存失败，请重试'
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {fileUrl && (
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary underline underline-offset-4"
            >
              查看原始文件
            </a>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onReparse}
            disabled={isParsing}
          >
            {isParsing ? (
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            ) : (
              <Sparkles className="mr-1 h-3 w-3" />
            )}
            重新解析
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {saveMessage && (
            <span
              className={`text-sm ${saveMessage === '保存成功' ? 'text-green-600' : 'text-destructive'}`}
            >
              {saveMessage}
            </span>
          )}
          <Button type="submit" disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-1 h-4 w-4" />
            )}
            保存
          </Button>
        </div>
      </div>

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-4 w-4" />
            基本信息
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">姓名</label>
              <Input {...register('basic_info.name')} placeholder="姓名" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">手机</label>
              <Input {...register('basic_info.phone')} placeholder="手机号" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">邮箱</label>
              <Input {...register('basic_info.email')} placeholder="邮箱" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Education */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            教育背景
          </CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => appendEdu(emptyEducation())}
          >
            <Plus className="mr-1 h-3 w-3" />
            添加
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {eduFields.map((field, idx) => (
            <div
              key={field.id}
              className="relative rounded-lg border p-4 space-y-3"
            >
              {eduFields.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeEdu(idx)}
                  className="absolute top-2 right-2 rounded-full p-1 hover:bg-muted"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">学校</label>
                  <Input
                    {...register(`basic_info.education.${idx}.school`)}
                    placeholder="学校名称"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">学位</label>
                  <Input
                    {...register(`basic_info.education.${idx}.degree`)}
                    placeholder="学士/硕士/博士"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">专业</label>
                  <Input
                    {...register(`basic_info.education.${idx}.major`)}
                    placeholder="专业名称"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">GPA</label>
                  <Input
                    {...register(`basic_info.education.${idx}.gpa`)}
                    placeholder="GPA"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">
                    开始时间
                  </label>
                  <Input
                    {...register(`basic_info.education.${idx}.start_date`)}
                    placeholder="2020.09"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">
                    结束时间
                  </label>
                  <Input
                    {...register(`basic_info.education.${idx}.end_date`)}
                    placeholder="2024.06"
                  />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Experiences */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            经历
          </CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => appendExp(emptyExperience())}
          >
            <Plus className="mr-1 h-3 w-3" />
            添加
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {expFields.map((field, idx) => (
            <ExperienceCard
              key={field.id}
              index={idx}
              register={register}
              control={control}
              canRemove={expFields.length > 1}
              onRemove={() => removeExp(idx)}
            />
          ))}
        </CardContent>
      </Card>

      {/* Skills */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            技能
          </CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => appendSkill('' as never)}
          >
            <Plus className="mr-1 h-3 w-3" />
            添加
          </Button>
        </CardHeader>
        <CardContent>
          <TagListEditor
            fields={skillFields}
            registerName="skills"
            register={register}
            onRemove={removeSkill}
          />
        </CardContent>
      </Card>

      {/* Awards */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            获奖
          </CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => appendAward('' as never)}
          >
            <Plus className="mr-1 h-3 w-3" />
            添加
          </Button>
        </CardHeader>
        <CardContent>
          <StringListEditor
            fields={awardFields}
            registerName="awards"
            register={register}
            onRemove={removeAward}
            placeholder="获奖名称"
          />
        </CardContent>
      </Card>

      {/* Certifications */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            证书
          </CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => appendCert('' as never)}
          >
            <Plus className="mr-1 h-3 w-3" />
            添加
          </Button>
        </CardHeader>
        <CardContent>
          <StringListEditor
            fields={certFields}
            registerName="certifications"
            register={register}
            onRemove={removeCert}
            placeholder="证书名称"
          />
        </CardContent>
      </Card>

      {/* Bottom save */}
      <div className="flex items-center justify-end gap-2">
        {saveMessage && (
          <span
            className={`text-sm ${saveMessage === '保存成功' ? 'text-green-600' : 'text-destructive'}`}
          >
            {saveMessage}
          </span>
        )}
        <Button type="submit" disabled={isSaving}>
          {isSaving ? (
            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-1 h-4 w-4" />
          )}
          保存
        </Button>
      </div>
    </form>
  );
}

// ---- Experience Card sub-component ----

function ExperienceCard({
  index,
  register,
  control,
  canRemove,
  onRemove,
}: {
  index: number;
  register: ReturnType<typeof useForm<ResumeFormData>>['register'];
  control: ReturnType<typeof useForm<ResumeFormData>>['control'];
  canRemove: boolean;
  onRemove: () => void;
}) {
  const {
    fields: descFields,
    append: appendDesc,
    remove: removeDesc,
  } = useFieldArray({ control, name: `experiences.${index}.descriptions` as never });

  const {
    fields: skillFields,
    append: appendSkill,
    remove: removeSkill,
  } = useFieldArray({ control, name: `experiences.${index}.skills_involved` as never });

  const {
    fields: metricFields,
    append: appendMetric,
    remove: removeMetric,
  } = useFieldArray({ control, name: `experiences.${index}.metrics` as never });

  return (
    <div className="relative rounded-lg border p-4 space-y-4">
      {canRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="absolute top-2 right-2 rounded-full p-1 hover:bg-muted"
        >
          <X className="h-3 w-3" />
        </button>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">类型</label>
          <Controller
            control={control}
            name={`experiences.${index}.type`}
            render={({ field }) => (
              <select
                {...field}
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {EXPERIENCE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            )}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">公司/组织</label>
          <Input
            {...register(`experiences.${index}.company_or_org`)}
            placeholder="公司或组织名称"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">角色</label>
          <Input
            {...register(`experiences.${index}.role`)}
            placeholder="职位/角色"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">时间段</label>
          <Input
            {...register(`experiences.${index}.duration`)}
            placeholder="2023.06 - 2023.09"
          />
        </div>
      </div>

      {/* Descriptions */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium">工作描述</label>
          <button
            type="button"
            onClick={() => appendDesc('' as never)}
            className="text-xs text-primary hover:underline"
          >
            + 添加
          </button>
        </div>
        {descFields.map((field, dIdx) => (
          <div key={field.id} className="flex items-center gap-1">
            <Input
              {...register(`experiences.${index}.descriptions.${dIdx}` as const)}
              placeholder="描述内容"
              className="flex-1"
            />
            {descFields.length > 1 && (
              <button
                type="button"
                onClick={() => removeDesc(dIdx)}
                className="shrink-0 rounded-full p-1 hover:bg-muted"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Skills involved */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium">涉及技能</label>
          <button
            type="button"
            onClick={() => appendSkill('' as never)}
            className="text-xs text-primary hover:underline"
          >
            + 添加
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {skillFields.map((field, sIdx) => (
            <div
              key={field.id}
              className="flex items-center gap-1 rounded-full border px-2 py-0.5"
            >
              <input
                {...register(
                  `experiences.${index}.skills_involved.${sIdx}` as const
                )}
                placeholder="技能"
                className="w-20 bg-transparent text-xs outline-none"
              />
              {skillFields.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeSkill(sIdx)}
                  className="shrink-0"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Metrics */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium">量化成果</label>
          <button
            type="button"
            onClick={() => appendMetric('' as never)}
            className="text-xs text-primary hover:underline"
          >
            + 添加
          </button>
        </div>
        {metricFields.map((field, mIdx) => (
          <div key={field.id} className="flex items-center gap-1">
            <Input
              {...register(`experiences.${index}.metrics.${mIdx}` as const)}
              placeholder="量化成果"
              className="flex-1"
            />
            {metricFields.length > 1 && (
              <button
                type="button"
                onClick={() => removeMetric(mIdx)}
                className="shrink-0 rounded-full p-1 hover:bg-muted"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- Tag List Editor (for skills) ----

function TagListEditor({
  fields,
  registerName,
  register,
  onRemove,
}: {
  fields: Record<'id', string>[];
  registerName: string;
  register: ReturnType<typeof useForm<ResumeFormData>>['register'];
  onRemove: (idx: number) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {fields.map((field, idx) => (
        <div
          key={field.id}
          className="flex items-center gap-1 rounded-full border bg-muted/50 px-3 py-1"
        >
          <input
            {...register(`${registerName}.${idx}` as keyof ResumeFormData)}
            placeholder="技能名称"
            className="w-24 bg-transparent text-sm outline-none"
          />
          {fields.length > 1 && (
            <button
              type="button"
              onClick={() => onRemove(idx)}
              className="shrink-0"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

// ---- String List Editor (for awards, certifications) ----

function StringListEditor({
  fields,
  registerName,
  register,
  onRemove,
  placeholder,
}: {
  fields: Record<'id', string>[];
  registerName: string;
  register: ReturnType<typeof useForm<ResumeFormData>>['register'];
  onRemove: (idx: number) => void;
  placeholder: string;
}) {
  return (
    <div className="space-y-2">
      {fields.map((field, idx) => (
        <div key={field.id} className="flex items-center gap-1">
          <Input
            {...register(`${registerName}.${idx}` as keyof ResumeFormData)}
            placeholder={placeholder}
            className="flex-1"
          />
          {fields.length > 1 && (
            <button
              type="button"
              onClick={() => onRemove(idx)}
              className="shrink-0 rounded-full p-1 hover:bg-muted"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
