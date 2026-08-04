import { CanonicalInternship, ResumeData } from '../models/DomainModels.js';
import { geminiService } from './GeminiService.js';
import { logger } from '../utils/logger.js';

export interface EnrichmentResult {
  domain: string;
  difficultyLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  orientation: 'Research-Oriented' | 'Product-Oriented' | 'Hybrid';
  learningOutcomes: string[];
  missingSkills: string[];
  preparationRoadmap: string[];
  applicationTier: 'High Chance' | 'Moderate Chance' | 'Competitive Reach';
  recommendedEffortMins: number;
}

export class EnrichmentService {
  async enrichInternship(internship: CanonicalInternship, resume?: ResumeData): Promise<EnrichedInternship> {
    const candidateSkills = resume?.skills || ['TypeScript', 'Node.js', 'Python', 'PostgreSQL', 'Docker', 'Git'];
    const jobSkills = internship.skills.length > 0 ? internship.skills : ['Software Engineering', 'Computer Science'];

    // Deterministic Gap Analysis
    const candidateSkillSet = new Set(candidateSkills.map((s) => s.toLowerCase()));
    const missingSkills = jobSkills.filter((skill) => !candidateSkillSet.has(skill.toLowerCase()));

    // Infer Orientation & Difficulty
    const titleLower = internship.title.toLowerCase();
    const descLower = internship.description.toLowerCase();

    let orientation: 'Research-Oriented' | 'Product-Oriented' | 'Hybrid' = 'Product-Oriented';
    if (titleLower.includes('research') || titleLower.includes('phd') || descLower.includes('publication')) {
      orientation = 'Research-Oriented';
    } else if (titleLower.includes('lab') || descLower.includes('prototype')) {
      orientation = 'Hybrid';
    }

    let difficultyLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert' = 'Intermediate';
    if (titleLower.includes('apprentice') || titleLower.includes('junior') || titleLower.includes('undergrad')) {
      difficultyLevel = 'Beginner';
    } else if (titleLower.includes('phd') || titleLower.includes('senior') || titleLower.includes('lead')) {
      difficultyLevel = 'Expert';
    } else if (titleLower.includes('masters') || titleLower.includes('graduate')) {
      difficultyLevel = 'Advanced';
    }

    // Infer Domain
    let domain = 'Software Engineering';
    if (titleLower.includes('ai') || titleLower.includes('machine learning') || titleLower.includes('ml')) {
      domain = 'AI/ML & Data Science';
    } else if (titleLower.includes('backend') || titleLower.includes('systems') || titleLower.includes('infrastructure')) {
      domain = 'Backend & Distributed Systems';
    } else if (titleLower.includes('frontend') || titleLower.includes('ui') || titleLower.includes('web')) {
      domain = 'Frontend & Web Development';
    } else if (titleLower.includes('hardware') || titleLower.includes('embedded') || titleLower.includes('asic')) {
      domain = 'Hardware & Embedded Engineering';
    }

    // Application Tier & Prep Roadmap
    const missingCount = missingSkills.length;
    let applicationTier: 'High Chance' | 'Moderate Chance' | 'Competitive Reach' = 'Moderate Chance';
    let recommendedEffortMins = 20;

    if (missingCount === 0) {
      applicationTier = 'High Chance';
      recommendedEffortMins = 15;
    } else if (missingCount > 3) {
      applicationTier = 'Competitive Reach';
      recommendedEffortMins = 45;
    }

    const preparationRoadmap = missingSkills.map(
      (skill) => `Build a mini-project or module utilizing ${skill} before applying.`
    );

    if (preparationRoadmap.length === 0) {
      preparationRoadmap.push('Highlight Python and Systems projects prominently in your top resume section.');
      preparationRoadmap.push('Tailor cover letter around your microservices & API experience.');
    }

    logger.info(`Enriched internship [${internship.title}] at [${internship.companyName}] -> Tier: ${applicationTier}`);

    return {
      ...internship,
      status: 'ENRICHED',
      matchExplanation: `Domain: ${domain} | Difficulty: ${difficultyLevel} | Orientation: ${orientation}. Application Tier: ${applicationTier}.`,
    };
  }
}

export interface EnrichedInternship extends CanonicalInternship {
  enrichmentDetails?: EnrichmentResult;
}

export const enrichmentService = new EnrichmentService();
