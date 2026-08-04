import { CanonicalInternship, ResumeData } from '../models/DomainModels.js';
import { geminiService } from './GeminiService.js';
import { logger } from '../utils/logger.js';

export interface MatchEvaluationResult {
  score: number;
  skillMatchScore: number;
  projectMatchScore: number;
  educationMatchScore: number;
  explanation: string;
}

export class MatchingEngine {
  async evaluateMatch(internship: CanonicalInternship, resume: ResumeData): Promise<MatchEvaluationResult> {
    if (!resume || !resume.isParsedSuccessfully) {
      const reason = resume?.parseErrorReason || 'Resume unavailable (Missing resume.pdf file)';
      logger.warn(`Resume matching skipped: ${reason}`);
      return {
        score: 0,
        skillMatchScore: 0,
        projectMatchScore: 0,
        educationMatchScore: 0,
        explanation: `Resume status: ${reason}`,
      };
    }

    const resumeSkills = new Set(resume.skills.map((s) => s.toLowerCase()));
    const jobSkills = internship.skills.map((s) => s.toLowerCase());

    // 1. Skill Sub-Match
    let matchedSkillsCount = 0;
    if (jobSkills.length > 0) {
      jobSkills.forEach((skill) => {
        if (resumeSkills.has(skill)) matchedSkillsCount++;
      });
    } else {
      const descLower = internship.description.toLowerCase();
      resumeSkills.forEach((skill) => {
        if (descLower.includes(skill)) matchedSkillsCount++;
      });
    }

    const skillMatchScore = Math.min(
      100,
      Math.round((matchedSkillsCount / Math.max(1, jobSkills.length || 5)) * 100)
    );

    // 2. Project Sub-Match
    let projectMatchScore = 70;
    if (resume.projects.length > 0) {
      const projTechs = new Set(resume.projects.flatMap((p) => p.technologies.map((t) => t.toLowerCase())));
      let projMatched = 0;
      jobSkills.forEach((s) => {
        if (projTechs.has(s)) projMatched++;
      });
      projectMatchScore = Math.min(100, Math.round((projMatched / Math.max(1, jobSkills.length)) * 100) + 50);
    }

    // 3. Education Sub-Match
    let educationMatchScore = 80;
    if (resume.education.length > 0) {
      const edu = resume.education[0];
      if (edu.institution.includes('IIT') || edu.institution.includes('Tier-1')) educationMatchScore = 95;
      else if (edu.degree.includes('Tech') || edu.degree.includes('B.E.')) educationMatchScore = 85;
    }

    // 4. Overall Formula
    const overallMatchScore = Math.round(
      skillMatchScore * 0.60 + projectMatchScore * 0.25 + educationMatchScore * 0.15
    );

    const explanation = `Skill Match: ${skillMatchScore}% (${matchedSkillsCount} skills matched) | Project Match: ${projectMatchScore}% | Edu Match: ${educationMatchScore}%.`;

    return {
      score: overallMatchScore,
      skillMatchScore,
      projectMatchScore,
      educationMatchScore,
      explanation,
    };
  }
}

export const matchingEngine = new MatchingEngine();
