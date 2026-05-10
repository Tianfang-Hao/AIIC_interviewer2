import type { ApplicationStatus, Priority } from '@/generated/prisma/client';

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  APPLIED: '已投递',
  SCREENING: '简历筛选中',
  WRITTEN_TEST: '笔试',
  FIRST_INTERVIEW: '一面',
  SECOND_INTERVIEW: '二面',
  THIRD_INTERVIEW: '三面',
  HR_INTERVIEW: 'HR面',
  OFFER: 'Offer',
  REJECTED: '已拒',
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  P0: 'P0 必冲',
  P1: 'P1 重点',
  P2: 'P2 保底',
  P3: 'P3 海投',
};

export const STATUS_COLORS: Record<ApplicationStatus, string> = {
  APPLIED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  SCREENING:
    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  WRITTEN_TEST:
    'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  FIRST_INTERVIEW:
    'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  SECOND_INTERVIEW:
    'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
  THIRD_INTERVIEW:
    'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400',
  HR_INTERVIEW:
    'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400',
  OFFER:
    'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

export const PRIORITY_COLORS: Record<Priority, string> = {
  P0: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  P1: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  P2: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  P3: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
};

export const STATUS_OPTIONS = Object.entries(STATUS_LABELS) as [
  ApplicationStatus,
  string,
][];

export const PRIORITY_OPTIONS = Object.entries(PRIORITY_LABELS) as [
  Priority,
  string,
][];
