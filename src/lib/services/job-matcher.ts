/**
 * Job Matching Service
 *
 * Keyword-based multi-dimension matching algorithm.
 * Calculates a match score (0-100) between a user's resume/preferences and a job posting.
 *
 * Dimensions & weights:
 *   - Skills match:        30%
 *   - Experience relevance: 25%
 *   - Hard requirements:    20%
 *   - Industry/direction:   15%
 *   - Preferred quals:      10%
 */

import type { ParsedResume } from '@/lib/ai/resume-parser';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface JobForMatching {
  id: string;
  company: string;
  positionName: string;
  department: string | null;
  jobType: string; // 'INTERN' | 'CAMPUS' | 'SOCIAL'
  location: string[];
  jdContent: string | null;
  requirements: string[];
  preferred: string[];
  salaryRange: string | null;
  industry: string | null;
  companySize: string | null;
}

export interface PreferenceForMatching {
  positions: string[];
  jobType: string | null;
  cities: string[];
  companySize: string | null;
  industries: string[];
  salaryMin: number | null;
  salaryMax: number | null;
}

export interface ScoreBreakdown {
  skills: number; // 0-100 within dimension
  experience: number;
  hardRequirements: number;
  industry: number;
  preferred: number;
}

export interface MatchResult {
  jobId: string;
  totalScore: number; // 0-100 final weighted score
  breakdown: ScoreBreakdown;
  matchedItems: string[];
  missingItems: string[];
}

// ---------------------------------------------------------------------------
// Weights
// ---------------------------------------------------------------------------

const WEIGHTS = {
  skills: 0.3,
  experience: 0.25,
  hardRequirements: 0.2,
  industry: 0.15,
  preferred: 0.1,
} as const;

// ---------------------------------------------------------------------------
// Text utilities
// ---------------------------------------------------------------------------

/** Normalize a string for comparison: lowercase, trim, collapse whitespace */
function normalize(s: string): string {
  return s.toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Tokenize text into a set of keywords.
 * Handles both Chinese and English text:
 *   - Splits on whitespace, punctuation, slashes, etc.
 *   - Filters out short noise tokens (length <= 1 for ascii, but keeps single Chinese chars)
 */
function tokenize(text: string): Set<string> {
  const tokens = new Set<string>();
  // Split on common delimiters
  const parts = normalize(text).split(
    /[\s,，.。;；:：!！?？、/\\|()（）[\]【】{}""''""<>《》·\-_+=#@&*^%$~`]+/
  );
  for (const part of parts) {
    if (!part) continue;
    // Keep tokens >= 2 chars for ASCII, or any non-empty for CJK
    if (part.length >= 2 || /[\u4e00-\u9fff]/.test(part)) {
      tokens.add(part);
    }
  }
  return tokens;
}

/**
 * Extract keyword tokens from an array of strings.
 */
function extractKeywords(items: string[]): Set<string> {
  const result = new Set<string>();
  for (const item of items) {
    for (const token of tokenize(item)) {
      result.add(token);
    }
  }
  return result;
}

/**
 * Calculate overlap ratio between two sets of keywords.
 * Returns a value from 0 to 1.
 * If either set is empty, returns 0.
 */
function overlapRatio(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;

  let matchCount = 0;
  // Check each token in `a` to see if it appears in `b` (exact or substring)
  for (const tokenA of a) {
    for (const tokenB of b) {
      if (tokenA === tokenB || tokenB.includes(tokenA) || tokenA.includes(tokenB)) {
        matchCount++;
        break;
      }
    }
  }

  // Normalize by the smaller set to be generous
  return matchCount / Math.min(a.size, b.size);
}

/**
 * Check if any item in `sources` contains or matches any item in `targets`.
 * Returns the list of matched and unmatched target items.
 */
function findMatches(
  sources: string[],
  targets: string[]
): { matched: string[]; unmatched: string[] } {
  const matched: string[] = [];
  const unmatched: string[] = [];

  for (const target of targets) {
    const normalTarget = normalize(target);
    const found = sources.some((source) => {
      const normalSource = normalize(source);
      return (
        normalSource.includes(normalTarget) ||
        normalTarget.includes(normalSource) ||
        // Token-level overlap
        overlapRatio(tokenize(normalSource), tokenize(normalTarget)) > 0.5
      );
    });
    if (found) {
      matched.push(target);
    } else {
      unmatched.push(target);
    }
  }

  return { matched, unmatched };
}

// ---------------------------------------------------------------------------
// Dimension scorers
// ---------------------------------------------------------------------------

/**
 * Skills match (30%): overlap between resume skills and job requirements/JD keywords.
 */
function scoreSkills(
  resume: ParsedResume,
  job: JobForMatching
): { score: number; matched: string[]; missing: string[] } {
  const resumeSkills = new Set(resume.skills.map((s) => normalize(s)));

  // Also gather skills from experiences
  for (const exp of resume.experiences) {
    for (const skill of exp.skills_involved) {
      resumeSkills.add(normalize(skill));
    }
  }

  // Job requirements as target skills
  const jobSkillKeywords = [...job.requirements];
  if (job.jdContent) {
    // Extract potential skill keywords from JD (take notable words)
    jobSkillKeywords.push(job.jdContent);
  }

  // Direct matching on requirements
  const { matched, unmatched } = findMatches(
    [...resumeSkills],
    job.requirements
  );

  // Token-level overlap for a broader score
  const resumeTokens = extractKeywords([...resumeSkills]);
  const jobTokens = extractKeywords(job.requirements);
  // Also add JD tokens for richer matching
  if (job.jdContent) {
    for (const t of tokenize(job.jdContent)) {
      jobTokens.add(t);
    }
  }

  const ratio = overlapRatio(resumeTokens, jobTokens);
  const score = Math.min(100, Math.round(ratio * 100));

  return { score, matched, missing: unmatched };
}

/**
 * Experience relevance (25%): keyword overlap between resume descriptions and JD content.
 */
function scoreExperience(resume: ParsedResume, job: JobForMatching): number {
  // Collect all experience text from resume
  const expTexts: string[] = [];
  for (const exp of resume.experiences) {
    expTexts.push(exp.company_or_org, exp.role, ...exp.descriptions);
  }

  const expTokens = extractKeywords(expTexts);

  // Collect JD text
  const jdTexts: string[] = [job.positionName];
  if (job.jdContent) jdTexts.push(job.jdContent);
  jdTexts.push(...job.requirements);

  const jdTokens = extractKeywords(jdTexts);

  const ratio = overlapRatio(expTokens, jdTokens);
  return Math.min(100, Math.round(ratio * 100));
}

/**
 * Hard requirements (20%): city match, job type match, education level.
 */
function scoreHardRequirements(
  resume: ParsedResume,
  preference: PreferenceForMatching,
  job: JobForMatching
): number {
  let total = 0;
  let maxPoints = 0;

  // City match (40% of this dimension)
  maxPoints += 40;
  if (preference.cities.length > 0 && job.location.length > 0) {
    const prefCities = preference.cities.map((c) => normalize(c));
    const jobCities = job.location.map((c) => normalize(c));
    const cityMatch = prefCities.some((pc) =>
      jobCities.some((jc) => jc.includes(pc) || pc.includes(jc))
    );
    if (cityMatch) total += 40;
  } else {
    // If no preference set, don't penalize
    total += 20;
  }

  // Job type match (30% of this dimension)
  maxPoints += 30;
  if (preference.jobType) {
    if (preference.jobType === job.jobType) {
      total += 30;
    }
  } else {
    total += 15; // No preference, neutral
  }

  // Education level (30% of this dimension)
  maxPoints += 30;
  if (resume.basic_info.education.length > 0) {
    // Just having education info is a baseline
    total += 15;
    // Check if degree keywords appear in requirements
    const eduKeywords = resume.basic_info.education.flatMap((e) => [
      normalize(e.degree),
      normalize(e.major),
      normalize(e.school),
    ]);
    const reqText = normalize(job.requirements.join(' ') + ' ' + (job.jdContent || ''));
    const eduMatch = eduKeywords.some((ek) => ek && reqText.includes(ek));
    if (eduMatch) total += 15;
  } else {
    total += 10;
  }

  return Math.round((total / maxPoints) * 100);
}

/**
 * Industry/direction (15%): match between user's preferred industries/positions and job's industry/position.
 */
function scoreIndustry(
  preference: PreferenceForMatching,
  job: JobForMatching
): number {
  let score = 0;
  let dimensions = 0;

  // Industry match
  if (preference.industries.length > 0) {
    dimensions++;
    if (job.industry) {
      const jobInd = normalize(job.industry);
      const match = preference.industries.some((ind) => {
        const normInd = normalize(ind);
        return jobInd.includes(normInd) || normInd.includes(jobInd);
      });
      if (match) score += 1;
    }
  }

  // Position/direction match
  if (preference.positions.length > 0) {
    dimensions++;
    const jobPos = normalize(job.positionName);
    const match = preference.positions.some((pos) => {
      const normPos = normalize(pos);
      return jobPos.includes(normPos) || normPos.includes(jobPos);
    });
    if (match) score += 1;
  }

  if (dimensions === 0) return 50; // No preference set, neutral score
  return Math.round((score / dimensions) * 100);
}

/**
 * Preferred qualifications (10%): check if resume skills/experience match job's "preferred" list.
 */
function scorePreferred(
  resume: ParsedResume,
  job: JobForMatching
): { score: number; matched: string[]; missing: string[] } {
  if (job.preferred.length === 0) {
    return { score: 100, matched: [], missing: [] }; // No preferred listed, full score
  }

  const resumeTexts = [
    ...resume.skills,
    ...resume.awards,
    ...resume.certifications,
    ...resume.experiences.flatMap((e) => [
      e.company_or_org,
      e.role,
      ...e.descriptions,
      ...e.skills_involved,
    ]),
  ];

  const { matched, unmatched } = findMatches(resumeTexts, job.preferred);
  const ratio =
    job.preferred.length > 0 ? matched.length / job.preferred.length : 0;

  return {
    score: Math.round(ratio * 100),
    matched,
    missing: unmatched,
  };
}

// ---------------------------------------------------------------------------
// Main function
// ---------------------------------------------------------------------------

/**
 * Calculate a weighted match score between a user's resume/preferences and a job.
 */
export function calculateMatchScore(
  resume: ParsedResume,
  preference: PreferenceForMatching,
  job: JobForMatching
): MatchResult {
  // Skills dimension
  const skillsResult = scoreSkills(resume, job);

  // Experience dimension
  const experienceScore = scoreExperience(resume, job);

  // Hard requirements dimension
  const hardReqScore = scoreHardRequirements(resume, preference, job);

  // Industry dimension
  const industryScore = scoreIndustry(preference, job);

  // Preferred qualifications dimension
  const preferredResult = scorePreferred(resume, job);

  // Weighted total
  const totalScore = Math.round(
    skillsResult.score * WEIGHTS.skills +
      experienceScore * WEIGHTS.experience +
      hardReqScore * WEIGHTS.hardRequirements +
      industryScore * WEIGHTS.industry +
      preferredResult.score * WEIGHTS.preferred
  );

  // Aggregate matched/missing items
  const matchedItems: string[] = [];
  const missingItems: string[] = [];

  if (skillsResult.matched.length > 0) {
    matchedItems.push(
      ...skillsResult.matched.map((s) => `[技能] ${s}`)
    );
  }
  if (skillsResult.missing.length > 0) {
    missingItems.push(
      ...skillsResult.missing.map((s) => `[技能] ${s}`)
    );
  }
  if (preferredResult.matched.length > 0) {
    matchedItems.push(
      ...preferredResult.matched.map((s) => `[加分项] ${s}`)
    );
  }
  if (preferredResult.missing.length > 0) {
    missingItems.push(
      ...preferredResult.missing.map((s) => `[加分项] ${s}`)
    );
  }

  return {
    jobId: job.id,
    totalScore: Math.min(100, Math.max(0, totalScore)),
    breakdown: {
      skills: skillsResult.score,
      experience: experienceScore,
      hardRequirements: hardReqScore,
      industry: industryScore,
      preferred: preferredResult.score,
    },
    matchedItems,
    missingItems,
  };
}

/**
 * Calculate match scores for multiple jobs and return sorted by score (desc).
 */
export function calculateMatchScores(
  resume: ParsedResume,
  preference: PreferenceForMatching,
  jobs: JobForMatching[]
): MatchResult[] {
  const results = jobs.map((job) =>
    calculateMatchScore(resume, preference, job)
  );
  results.sort((a, b) => b.totalScore - a.totalScore);
  return results;
}
