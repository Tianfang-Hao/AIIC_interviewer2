import Anthropic from '@anthropic-ai/sdk';
import type { InterviewRound } from '@/generated/prisma/enums';

// ---- Types ----

export interface QuestionEvaluation {
  question: string;
  answer: string;
  score: number; // 1-10
  highlights: string[];
  improvements: string[];
  referenceAnswer: string;
}

export interface Evaluation {
  questions: QuestionEvaluation[];
  overallScore: number;
  overallRating: 'pass' | 'needs_improvement' | 'fail';
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// ---- Round-specific evaluation focus ----

function getRoundEvaluationFocus(round: InterviewRound): string {
  switch (round) {
    case 'FIRST':
      return `评估重点（第一轮·技术/业务基础面）：
- 简历经历的真实性和深度：候选人对自己项目经历的描述是否清晰、具体
- 技术基础扎实程度：基础知识回答的准确性和深度
- 个人贡献的清晰度：候选人能否明确说明自己在项目中的角色和贡献
- 技术选型和问题解决能力：对技术方案的思考是否合理`;

    case 'SECOND':
      return `评估重点（第二轮·深度思维面）：
- 系统思维能力：面对复杂问题的分析和拆解能力
- 决策逻辑：方案选择的合理性和权衡能力
- 应变能力：面对约束变化时的调整能力
- 行业认知：对行业趋势和技术发展的关注程度
- 思维深度：是否能超越表面给出深入分析`;

    case 'THIRD':
      return `评估重点（第三轮·HR综合面）：
- 职业规划清晰度：对自身定位和发展方向是否明确
- 价值观匹配度：表达的价值观是否与企业文化吻合
- 沟通表达能力：表达是否清晰、有条理、有说服力
- 抗压能力：面对压力问题时的应对表现
- 稳定性信号：求职动机和长期规划是否合理`;
  }
}

// ---- Build evaluation prompt ----

function buildEvaluationPrompt(
  messages: ChatMessage[],
  round: InterviewRound,
  jobJd: string
): string {
  const conversation = messages
    .map((msg) => `${msg.role === 'assistant' ? '面试官' : '候选人'}：${msg.content}`)
    .join('\n\n');

  return `你是一位资深的面试评估专家。请分析以下模拟面试对话，给出详细的评估报告。

${getRoundEvaluationFocus(round)}

${jobJd ? `## 目标岗位信息\n${jobJd}\n` : ''}
## 面试对话记录

${conversation}

## 输出要求

请以 JSON 格式返回评估结果，只返回 JSON，不加 markdown 代码块：

{
  "questions": [
    {
      "question": "面试官提出的问题（原文摘要）",
      "answer": "候选人的回答（原文摘要）",
      "score": 7,
      "highlights": ["回答亮点1", "回答亮点2"],
      "improvements": ["改进建议1", "改进建议2"],
      "referenceAnswer": "参考答案/答题框架：建议的理想回答方式和要点"
    }
  ],
  "overallScore": 7,
  "overallRating": "pass",
  "strengths": ["候选人总体优势1", "候选人总体优势2"],
  "weaknesses": ["候选人总体不足1", "候选人总体不足2"],
  "suggestions": ["改进建议1", "改进建议2"]
}

注意：
1. questions 数组应包含面试中的每一个实质性问答（跳过寒暄和自我介绍引导语）。
2. 每题 score 为 1-10 分，10 为最佳。
3. overallScore 为所有题目的加权平均分（1-10），按题目重要程度适当加权。
4. overallRating 规则：overallScore >= 7 为 "pass"，4-6 为 "needs_improvement"，< 4 为 "fail"。
5. highlights 列出回答中好的方面，improvements 列出可以改进的地方。
6. referenceAnswer 应提供一个完整的参考答案框架，帮助候选人了解理想回答的结构和要点。
7. strengths 和 weaknesses 是对候选人整体面试表现的总结。
8. suggestions 是针对候选人未来面试准备的具体可操作建议。
9. 所有文本用中文输出（技术术语可保留英文）。
10. 如果面试对话非常短（少于2个实质性问答），仍需基于已有内容给出评估。`;
}

// ---- Service ----

export async function generateEvaluation(
  messages: ChatMessage[],
  round: InterviewRound,
  jobJd: string
): Promise<Evaluation> {
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
        content: buildEvaluationPrompt(messages, round, jobJd),
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

  const raw: Evaluation = JSON.parse(jsonStr);

  // Validate and sanitize
  const evaluation: Evaluation = {
    questions: Array.isArray(raw.questions)
      ? raw.questions.map((q) => ({
          question: q.question ?? '',
          answer: q.answer ?? '',
          score: Math.min(10, Math.max(1, Number(q.score) || 5)),
          highlights: Array.isArray(q.highlights) ? q.highlights : [],
          improvements: Array.isArray(q.improvements) ? q.improvements : [],
          referenceAnswer: q.referenceAnswer ?? '',
        }))
      : [],
    overallScore: Math.min(10, Math.max(1, Number(raw.overallScore) || 5)),
    overallRating:
      raw.overallRating === 'pass' ||
      raw.overallRating === 'needs_improvement' ||
      raw.overallRating === 'fail'
        ? raw.overallRating
        : raw.overallScore >= 7
          ? 'pass'
          : raw.overallScore >= 4
            ? 'needs_improvement'
            : 'fail',
    strengths: Array.isArray(raw.strengths) ? raw.strengths : [],
    weaknesses: Array.isArray(raw.weaknesses) ? raw.weaknesses : [],
    suggestions: Array.isArray(raw.suggestions) ? raw.suggestions : [],
  };

  return evaluation;
}
