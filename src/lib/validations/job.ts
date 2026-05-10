import * as z from 'zod';

export const jobSchema = z.object({
  company: z.string().min(1, '请输入公司名称'),
  positionName: z.string().min(1, '请输入岗位名称'),
  department: z.string().optional(),
  jobType: z.enum(['INTERN', 'CAMPUS', 'SOCIAL']),
  location: z
    .string()
    .min(1, '请输入工作地点')
    .transform((val) =>
      val
        .split(/[,，、\s]+/)
        .map((s) => s.trim())
        .filter(Boolean)
    ),
  jdContent: z.string().optional(),
  requirements: z
    .string()
    .optional()
    .transform((val) =>
      val
        ? val
            .split('\n')
            .map((s) => s.trim())
            .filter(Boolean)
        : []
    ),
  preferred: z
    .string()
    .optional()
    .transform((val) =>
      val
        ? val
            .split('\n')
            .map((s) => s.trim())
            .filter(Boolean)
        : []
    ),
  salaryRange: z.string().optional(),
  postDate: z.string().optional(),
  deadline: z.string().optional(),
  sourceUrl: z.string().url('请输入有效的链接').optional().or(z.literal('')),
  companySize: z.string().optional(),
  industry: z.string().optional(),
});

export type JobInput = z.input<typeof jobSchema>;
export type JobOutput = z.output<typeof jobSchema>;

export const JOB_TYPE_LABELS: Record<string, string> = {
  INTERN: '实习',
  CAMPUS: '校招',
  SOCIAL: '社招',
};

export const CITY_OPTIONS = [
  '北京',
  '上海',
  '深圳',
  '杭州',
  '广州',
  '成都',
  '南京',
  '武汉',
  '西安',
  '苏州',
];
