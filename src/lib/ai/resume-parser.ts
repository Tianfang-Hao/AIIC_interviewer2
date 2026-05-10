import fs from 'fs/promises';
import path from 'path';
import Anthropic from '@anthropic-ai/sdk';

// ---- Types ----

export interface Education {
  school: string;
  degree: string;
  major: string;
  gpa: string;
  start_date: string;
  end_date: string;
}

export interface Experience {
  id: string;
  type: 'internship' | 'project' | 'research' | 'competition';
  company_or_org: string;
  role: string;
  duration: string;
  descriptions: string[];
  skills_involved: string[];
  metrics: string[];
}

export interface ParsedResume {
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

// ---- Text Extraction ----

export async function extractTextFromPDF(filePath: string): Promise<string> {
  const dataBuffer = await fs.readFile(filePath);
  const { PDFParse } = await import('pdf-parse');
  const parser = new PDFParse({ data: new Uint8Array(dataBuffer) });
  const result = await parser.getText();
  await parser.destroy();
  return result.text;
}

export async function extractTextFromDOCX(filePath: string): Promise<string> {
  const dataBuffer = await fs.readFile(filePath);
  const mammoth = await import('mammoth');
  const result = await mammoth.extractRawText({ buffer: dataBuffer });
  return result.value;
}

export async function extractText(filePath: string): Promise<string> {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.pdf') {
    return extractTextFromPDF(filePath);
  } else if (ext === '.docx') {
    return extractTextFromDOCX(filePath);
  }
  throw new Error(`Unsupported file type: ${ext}`);
}

// ---- AI Parsing ----

const SYSTEM_PROMPT = `You are a professional resume parser. Your job is to extract structured information from resume text and return it as a JSON object.

Extract the following information:
1. **basic_info**: name, phone, email, and education history (school, degree, major, GPA, start_date, end_date)
2. **experiences**: Each experience should include:
   - id: a unique short identifier (e.g. "exp-1", "exp-2")
   - type: one of "internship", "project", "research", "competition"
   - company_or_org: the company or organization name
   - role: the person's role/title
   - duration: the time period (e.g. "2023.06 - 2023.09")
   - descriptions: array of bullet-point descriptions of what was done
   - skills_involved: array of technologies/skills used
   - metrics: array of quantifiable achievements (e.g. "improved performance by 30%")
3. **skills**: array of all technical and soft skills mentioned
4. **awards**: array of awards and honors
5. **certifications**: array of certifications

Rules:
- If a field cannot be found, use an empty string "" for string fields or an empty array [] for array fields.
- For experience type, use your best judgment: work at a company = "internship", academic/lab work = "research", personal/course project = "project", competition = "competition".
- Dates should be kept in the format used in the original text.
- The resume may be in Chinese or English; extract information as-is without translation.
- Return ONLY the JSON object, no markdown fences, no explanation.`;

export async function parseResumeWithAI(
  text: string
): Promise<ParsedResume> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      'ANTHROPIC_API_KEY is not set. Please add it to your .env file.'
    );
  }

  const client = new Anthropic({ apiKey, baseURL: process.env.ANTHROPIC_BASE_URL || undefined });

  const message = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Please parse the following resume text into structured JSON:\n\n${text}`,
      },
    ],
  });

  // Extract text from the response
  const responseText = message.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('');

  // Parse JSON - strip possible markdown fences just in case
  const jsonStr = responseText
    .replace(/^```(?:json)?\s*\n?/, '')
    .replace(/\n?```\s*$/, '')
    .trim();

  let parsed: ParsedResume;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new Error('AI 返回的格式无效，请重试');
  }

  // Ensure structure integrity with defaults
  return {
    basic_info: {
      name: parsed.basic_info?.name ?? '',
      phone: parsed.basic_info?.phone ?? '',
      email: parsed.basic_info?.email ?? '',
      education: Array.isArray(parsed.basic_info?.education)
        ? parsed.basic_info.education.map((edu) => ({
            school: edu.school ?? '',
            degree: edu.degree ?? '',
            major: edu.major ?? '',
            gpa: edu.gpa ?? '',
            start_date: edu.start_date ?? '',
            end_date: edu.end_date ?? '',
          }))
        : [],
    },
    experiences: Array.isArray(parsed.experiences)
      ? parsed.experiences.map((exp, idx) => ({
          id: exp.id ?? `exp-${idx + 1}`,
          type: exp.type ?? 'project',
          company_or_org: exp.company_or_org ?? '',
          role: exp.role ?? '',
          duration: exp.duration ?? '',
          descriptions: Array.isArray(exp.descriptions)
            ? exp.descriptions
            : [],
          skills_involved: Array.isArray(exp.skills_involved)
            ? exp.skills_involved
            : [],
          metrics: Array.isArray(exp.metrics) ? exp.metrics : [],
        }))
      : [],
    skills: Array.isArray(parsed.skills) ? parsed.skills : [],
    awards: Array.isArray(parsed.awards) ? parsed.awards : [],
    certifications: Array.isArray(parsed.certifications)
      ? parsed.certifications
      : [],
  };
}
