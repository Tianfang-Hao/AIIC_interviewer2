import Anthropic from '@anthropic-ai/sdk';

// ---- Types ----

export interface CoachScores {
  relevance: number; // 内容相关性 1-10
  structure: number; // 结构清晰度 1-10
  quantification: number; // 量化数据 1-10
  technicalDepth: number; // 技术深度 1-10
  fluency: number; // 表达流畅度 1-10
}

export interface CoachCard {
  questionIndex: number;
  question: string;
  userAnswer: string;
  os: string; // 面试官OS
  scores: CoachScores;
  overallScore: number; // 五维度均分
  suggestions: string[]; // 2-3条改进建议
  referenceAnswer: string; // 推荐话术（完整优秀回答）
  isWeakPoint: boolean; // overallScore <= 4
  isBookmarked: boolean; // 用户手动收藏
}

// ---- Prompt ----

function buildCoachPrompt(params: {
  question: string;
  answer: string;
  round: string;
  resumeData: Record<string, unknown> | null;
  jobJd: string | null;
}): string {
  const { question, answer, round, resumeData, jobJd } = params;

  const roundLabel =
    round === 'FIRST'
      ? '第一轮（技术/业务基础面）'
      : round === 'SECOND'
        ? '第二轮（深度思维面）'
        : '第三轮（HR综合面）';

  return `你是一位资深面试辅导教练，拥有多年帮助候选人准备顶尖互联网公司面试的经验。你需要对候选人的每一道回答提供实时、精准、有建设性的反馈。

## 面试轮次
${roundLabel}

${jobJd ? `## 目标岗位信息\n${jobJd}\n` : ''}
${resumeData ? `## 候选人简历数据\n${JSON.stringify(resumeData, null, 2)}\n` : ''}

## 面试官提出的问题
${question}

## 候选人的回答
${answer}

## 你的任务

请从五个维度评估候选人的回答，并给出教练反馈。严格按照以下 JSON 格式输出，不要添加 markdown 代码块或其他文本：

{
  "os": "面试官OS（一段话，融合'这道题考察什么能力'+'面试官听到这个回答的真实反应/内心想法'）",
  "scores": {
    "relevance": 0,
    "structure": 0,
    "quantification": 0,
    "technicalDepth": 0,
    "fluency": 0
  },
  "suggestions": ["建议1", "建议2"],
  "referenceAnswer": "基于候选人简历的推荐话术"
}

## 评分标准（每个维度 1-10 分）

### relevance（内容相关性）
- 9-10：直接命中问题核心，回答高度聚焦
- 7-8：大方向正确，但有部分偏题或冗余内容
- 5-6：涉及了相关内容，但重点不突出
- 3-4：大部分内容与问题关联不大
- 1-2：完全跑题或答非所问

### structure（结构清晰度）
- 9-10：逻辑分明，使用了STAR/分点等结构化表达，层次清晰
- 7-8：有基本结构，但某些部分衔接不够紧密
- 5-6：能看出想表达的逻辑，但结构松散
- 3-4：缺乏组织，想到哪说到哪
- 1-2：杂乱无章，无法跟踪思路

### quantification（量化数据）
- 9-10：关键成果都有具体数据支撑（百分比、用户量、性能指标等）
- 7-8：有部分量化数据，但还有可量化的点未体现
- 5-6：有1-2个数据点，但不够充分
- 3-4：几乎没有量化，全是定性描述
- 1-2：完全没有数据支撑

### technicalDepth（技术深度）
- 9-10：展现了对技术原理的深刻理解，能讲清楚why和trade-off
- 7-8：技术理解正确，但某些方面可以更深入
- 5-6：了解基础概念，但停留在表面
- 3-4：技术理解有明显漏洞或错误
- 1-2：缺乏基本技术认知

### fluency（表达流畅度）
- 9-10：表达自然连贯、简洁有力，用词精准
- 7-8：整体流畅，偶有重复或啰嗦
- 5-6：能表达意思，但有多处不流畅
- 3-4：表达磕绊较多，影响理解
- 1-2：表达混乱，无法有效传递信息

## 重要要求

1. **os**：必须将"这道题考察什么"和"面试官听到回答后的真实反应"融合在一段话中，语气自然，像面试官的内心独白。例如："这道题主要考察候选人的系统设计能力。从回答来看，候选人确实做过这个项目，但对于核心的分布式一致性问题回答得比较表面，如果是我面试的话会继续追问细节。"

2. **suggestions**：必须是2-3条具体、可操作的改进建议。不要写"多用数据"这种笼统建议，而是像"可以补充你在PAIR实验室将推理速度优化了X%的数据"这样具体到候选人自身经历。

3. **referenceAnswer**：这是最重要的部分。必须基于候选人简历中的真实经历来编写一个完整的优秀回答示范。用候选人自己的项目、数据、技术栈来组织答案，不要编造候选人没有的经历。如果简历数据不足，则基于回答中提到的内容进行优化重组。

4. 所有文本用中文输出（技术术语可保留英文）。`;
}

// ---- Raw AI response type ----

interface CoachAIResponse {
  os: string;
  scores: {
    relevance: number;
    structure: number;
    quantification: number;
    technicalDepth: number;
    fluency: number;
  };
  suggestions: string[];
  referenceAnswer: string;
}

// ---- Service ----

export async function generateCoachFeedback(params: {
  question: string;
  answer: string;
  round: string;
  resumeData: Record<string, unknown> | null;
  jobJd: string | null;
}): Promise<
  Omit<CoachCard, 'questionIndex' | 'question' | 'userAnswer' | 'isBookmarked'>
> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      'ANTHROPIC_API_KEY is not set. Please add it to your .env file.'
    );
  }

  const client = new Anthropic({ apiKey, baseURL: process.env.ANTHROPIC_BASE_URL || undefined });
  const prompt = buildCoachPrompt(params);

  let lastError: unknown;

  // Retry up to 2 times on JSON parse failure
  for (let attempt = 0; attempt < 2; attempt++) {
    const message = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const responseText = message.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('');

    // Strip possible markdown fences
    const jsonStr = responseText
      .replace(/^```(?:json)?\s*\n?/, '')
      .replace(/\n?```\s*$/, '')
      .trim();

    try {
      const raw: CoachAIResponse = JSON.parse(jsonStr);

      // Sanitize scores to 1-10 range
      const clamp = (v: number) => Math.min(10, Math.max(1, Number(v) || 5));

      const scores: CoachScores = {
        relevance: clamp(raw.scores?.relevance),
        structure: clamp(raw.scores?.structure),
        quantification: clamp(raw.scores?.quantification),
        technicalDepth: clamp(raw.scores?.technicalDepth),
        fluency: clamp(raw.scores?.fluency),
      };

      const overallScore =
        Math.round(
          ((scores.relevance +
            scores.structure +
            scores.quantification +
            scores.technicalDepth +
            scores.fluency) /
            5) *
            10
        ) / 10;

      return {
        os: raw.os ?? '',
        scores,
        overallScore,
        suggestions: Array.isArray(raw.suggestions)
          ? raw.suggestions.slice(0, 3)
          : [],
        referenceAnswer: raw.referenceAnswer ?? '',
        isWeakPoint: overallScore <= 4,
      };
    } catch (e) {
      lastError = e;
      // Retry on next iteration
    }
  }

  throw new Error(
    `AI 返回的格式无效，请重试: ${lastError instanceof Error ? lastError.message : String(lastError)}`
  );
}
