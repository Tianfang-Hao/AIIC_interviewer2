import Anthropic from '@anthropic-ai/sdk';
import type { ParsedResume, Experience } from './resume-parser';

// ---- Types ----

export interface ModificationSuggestion {
  id: string;
  experienceId: string;
  experienceTitle: string;
  action: 'keep' | 'delete' | 'rewrite' | 'reorder';
  original: string;
  modified: string;
  reason: string;
  keywordsHit: string[];
}

export interface KeywordSuggestion {
  keyword: string;
  reason: string;
  whereToAdd: string;
}

export interface ExperienceOrderSuggestion {
  experienceId: string;
  experienceTitle: string;
  action: 'keep' | 'remove' | 'move_up' | 'move_down';
  reason: string;
}

export interface LayoutSuggestion {
  section: string;
  suggestion: string;
}

export interface OptimizationPlan {
  strategy: {
    coreCompetencies: string[];
    currentStrengths: string[];
    adjustmentDirection: string;
  };
  modifications: ModificationSuggestion[];
  keywordSuggestions: KeywordSuggestion[];
  experienceOrder: ExperienceOrderSuggestion[];
  layoutSuggestions: LayoutSuggestion[];
}

// ---- Prompt ----

function buildOptimizationPrompt(
  resume: ParsedResume,
  job: {
    company: string;
    positionName: string;
    jdContent: string | null;
    requirements: string[];
    preferred: string[];
  }
): string {
  const resumeJson = JSON.stringify(resume, null, 2);

  const jdParts: string[] = [];
  if (job.jdContent) jdParts.push(`职位描述：\n${job.jdContent}`);
  if (job.requirements.length > 0)
    jdParts.push(`任职要求：\n${job.requirements.map((r) => `- ${r}`).join('\n')}`);
  if (job.preferred.length > 0)
    jdParts.push(`优先条件：\n${job.preferred.map((p) => `- ${p}`).join('\n')}`);

  return `你是一个专业的简历优化顾问。用户正在申请以下岗位，请对照 JD 分析用户简历并给出详细的优化建议。

## 目标岗位
公司：${job.company}
职位：${job.positionName}
${jdParts.join('\n\n')}

## 用户简历（JSON 结构）
${resumeJson}

## 输出要求

请以 JSON 格式返回优化方案，结构如下。只返回 JSON，不加 markdown 代码块：

{
  "strategy": {
    "coreCompetencies": ["该岗位核心考察的3-5项能力"],
    "currentStrengths": ["用户简历当前突出的能力"],
    "adjustmentDirection": "整体调整方向说明"
  },
  "modifications": [
    {
      "id": "mod-1",
      "experienceId": "对应简历中 experience 的 id",
      "experienceTitle": "经历标题（公司/项目名 - 角色）",
      "action": "keep/delete/rewrite/reorder",
      "original": "原文（descriptions 中的某一条或多条，原样引用）",
      "modified": "修改后的文本（如action为delete则为空字符串，keep则与original相同）",
      "reason": "修改理由",
      "keywordsHit": ["该修改命中的JD关键词"]
    }
  ],
  "keywordSuggestions": [
    {
      "keyword": "需要补充的关键词",
      "reason": "为什么需要这个关键词",
      "whereToAdd": "建议添加到哪个经历/位置"
    }
  ],
  "experienceOrder": [
    {
      "experienceId": "经历id",
      "experienceTitle": "经历标题",
      "action": "keep/remove/move_up/move_down",
      "reason": "理由"
    }
  ],
  "layoutSuggestions": [
    {
      "section": "板块名称",
      "suggestion": "排版建议"
    }
  ]
}

注意：
1. modifications 中对每个经历的每个可优化的 description 都应单独给出建议。
2. 修改建议要具体、可操作，不要笼统的"建议加强"。
3. 关键词建议要与JD中的用词精确对应。
4. 经历取舍建议要明确说明理由。
5. 所有文本用中文输出（除技术术语保留英文）。
6. experienceId 必须与简历 JSON 中的 experience id 完全一致。`;
}

// ---- Service ----

export async function generateOptimizationPlan(
  resume: ParsedResume,
  job: {
    company: string;
    positionName: string;
    jdContent: string | null;
    requirements: string[];
    preferred: string[];
  }
): Promise<OptimizationPlan> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      'ANTHROPIC_API_KEY is not set. Please add it to your .env file.'
    );
  }

  const client = new Anthropic({ apiKey });

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 8192,
    messages: [
      {
        role: 'user',
        content: buildOptimizationPrompt(resume, job),
      },
    ],
  });

  const responseText = message.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('');

  // Parse JSON - strip possible markdown fences
  const jsonStr = responseText
    .replace(/^```(?:json)?\s*\n?/, '')
    .replace(/\n?```\s*$/, '')
    .trim();

  const plan: OptimizationPlan = JSON.parse(jsonStr);

  // Validate and provide defaults
  return {
    strategy: {
      coreCompetencies: plan.strategy?.coreCompetencies ?? [],
      currentStrengths: plan.strategy?.currentStrengths ?? [],
      adjustmentDirection: plan.strategy?.adjustmentDirection ?? '',
    },
    modifications: Array.isArray(plan.modifications)
      ? plan.modifications.map((m, idx) => ({
          id: m.id ?? `mod-${idx + 1}`,
          experienceId: m.experienceId ?? '',
          experienceTitle: m.experienceTitle ?? '',
          action: m.action ?? 'keep',
          original: m.original ?? '',
          modified: m.modified ?? '',
          reason: m.reason ?? '',
          keywordsHit: Array.isArray(m.keywordsHit) ? m.keywordsHit : [],
        }))
      : [],
    keywordSuggestions: Array.isArray(plan.keywordSuggestions)
      ? plan.keywordSuggestions.map((k) => ({
          keyword: k.keyword ?? '',
          reason: k.reason ?? '',
          whereToAdd: k.whereToAdd ?? '',
        }))
      : [],
    experienceOrder: Array.isArray(plan.experienceOrder)
      ? plan.experienceOrder.map((e) => ({
          experienceId: e.experienceId ?? '',
          experienceTitle: e.experienceTitle ?? '',
          action: e.action ?? 'keep',
          reason: e.reason ?? '',
        }))
      : [],
    layoutSuggestions: Array.isArray(plan.layoutSuggestions)
      ? plan.layoutSuggestions.map((l) => ({
          section: l.section ?? '',
          suggestion: l.suggestion ?? '',
        }))
      : [],
  };
}

// ---- Apply Suggestions ----

export function applyOptimizationPlan(
  resume: ParsedResume,
  plan: OptimizationPlan,
  acceptedModificationIds: string[]
): ParsedResume {
  // Deep clone the resume
  const result: ParsedResume = JSON.parse(JSON.stringify(resume));

  const acceptedMods = plan.modifications.filter((m) =>
    acceptedModificationIds.includes(m.id)
  );

  // Group modifications by experienceId
  const modsByExp = new Map<string, ModificationSuggestion[]>();
  for (const mod of acceptedMods) {
    const existing = modsByExp.get(mod.experienceId) ?? [];
    existing.push(mod);
    modsByExp.set(mod.experienceId, existing);
  }

  // Apply modifications to experiences
  for (const [expId, mods] of modsByExp) {
    const expIdx = result.experiences.findIndex((e) => e.id === expId);
    if (expIdx === -1) continue;

    for (const mod of mods) {
      if (mod.action === 'delete') {
        // Mark for deletion (remove after loop)
        result.experiences[expIdx] = {
          ...result.experiences[expIdx],
          descriptions: [],
          _deleted: true,
        } as Experience & { _deleted?: boolean };
      } else if (mod.action === 'rewrite') {
        // Replace matching description or append
        const descIdx = result.experiences[expIdx].descriptions.findIndex(
          (d) => d === mod.original || d.includes(mod.original.slice(0, 20))
        );
        if (descIdx !== -1) {
          result.experiences[expIdx].descriptions[descIdx] = mod.modified;
        } else {
          // If original not found exactly, try to replace any matching description
          // or just append
          result.experiences[expIdx].descriptions.push(mod.modified);
        }
      }
    }
  }

  // Remove deleted experiences
  result.experiences = result.experiences.filter(
    (e) => !(e as Experience & { _deleted?: boolean })._deleted
  );

  // Apply experience reorder from accepted suggestions
  const acceptedOrderIds = plan.experienceOrder
    .filter((o) => acceptedModificationIds.includes(`order-${o.experienceId}`))
    .reduce((acc, o) => {
      acc.set(o.experienceId, o.action);
      return acc;
    }, new Map<string, string>());

  // Remove experiences marked for removal
  if (acceptedOrderIds.size > 0) {
    result.experiences = result.experiences.filter(
      (e) => acceptedOrderIds.get(e.id) !== 'remove'
    );
  }

  return result;
}
