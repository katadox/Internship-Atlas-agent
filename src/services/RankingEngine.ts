import { CanonicalInternship, RankingWeights, UserPriorities } from '../models/DomainModels.js';
import { PreferenceRepository } from '../repositories/PreferenceRepository.js';
import { logger } from '../utils/logger.js';

export class RankingEngine {
  constructor(private prefRepo = new PreferenceRepository()) {}

  async rankInternships(items: CanonicalInternship[]): Promise<CanonicalInternship[]> {
    const weights: RankingWeights = await this.prefRepo.getRankingWeights();
    const priorities: UserPriorities = await this.prefRepo.getUserPriorities();

    for (const item of items) {
      const resumeScore = item.resumeScore || 60;
      const companyScore = this.computeCompanyScore(item.companyName, priorities);
      const growthScore = this.computeGrowthScore(item.title, priorities);
      const deadlineScore = this.computeDeadlineScore(item.deadline);
      const stipendScore = this.computeStipendScore(item.stipendMin, item.stipendMax, priorities);

      // Multi-factor formula
      let overall =
        weights.resumeMatch * resumeScore +
        weights.companyPrestige * companyScore +
        weights.careerGrowth * growthScore +
        weights.deadlineUrgency * deadlineScore +
        weights.stipend * stipendScore;

      const reasons: string[] = [];
      reasons.push(`Resume match score: ${resumeScore}%`);

      // Apply Indian Government & Lab Bonus (+15)
      const isGovt = item.companyName.includes('DRDO') ||
        item.companyName.includes('ISRO') ||
        item.companyName.includes('C-DAC') ||
        item.companyName.includes('AICTE') ||
        item.companyName.includes('MeitY') ||
        item.companyName.includes('CSIR') ||
        item.companyName.includes('Govt');

      if (isGovt) {
        overall += 15;
        reasons.push('⭐ National Government Lab research prestige bonus (+15)');
      }

      // Indian Location & Remote Bonus (+10)
      if (item.isRemote) {
        overall += 10;
        reasons.push('🏠 Flexible Remote India opportunity (+10)');
      }

      if (companyScore >= 90) {
        reasons.push(`🏢 Premier tech brand: ${item.companyName}`);
      }

      item.companyScore = companyScore;
      item.growthScore = growthScore;
      item.deadlineScore = deadlineScore;
      item.stipendScore = stipendScore;
      item.overallScore = Math.min(100, Math.round(overall));
      item.matchExplanation = reasons.join(' | ');
      item.status = 'RANKED';
    }

    // Sort descending by overallScore
    return items.sort((a, b) => (b.overallScore || 0) - (a.overallScore || 0));
  }

  private computeCompanyScore(companyName: string, priorities: UserPriorities): number {
    const topIndianTech = [
      'DRDO', 'ISRO', 'C-DAC', 'AICTE', 'CSIR', 'BARC', 'MeitY',
      'Zoho', 'Freshworks', 'Razorpay', 'Zerodha', 'BrowserStack', 'Juspay', 'Swiggy', 'Zomato', 'PhonePe', 'Groww', 'CRED', 'Postman',
      'TCS', 'Infosys', 'Wipro', 'HCLTech', 'Tech Mahindra',
      'Google', 'Microsoft', 'Amazon', 'Meta', 'Apple'
    ];
    
    if (topIndianTech.some((p) => companyName.toLowerCase().includes(p.toLowerCase()))) {
      return 95;
    }
    return 70;
  }

  private computeGrowthScore(title: string, priorities: UserPriorities): number {
    const targetDomains = priorities.target_domains || ['AI/ML', 'Backend', 'Systems'];
    const titleLower = title.toLowerCase();
    for (const domain of targetDomains) {
      if (titleLower.includes(domain.toLowerCase())) {
        return 90;
      }
    }
    return 75;
  }

  private computeDeadlineScore(deadlineISO: string | null): number {
    if (!deadlineISO) return 50;
    const diffDays = (new Date(deadlineISO).getTime() - Date.now()) / (1000 * 3600 * 24);
    if (diffDays < 0) return 0;
    if (diffDays <= 3) return 95;
    if (diffDays <= 14) return 80;
    return 60;
  }

  private computeStipendScore(min: number | null, max: number | null, priorities: UserPriorities): number {
    if (!min && !max) return 50;
    const avg = ((min || 0) + (max || min || 0)) / 2;
    if (avg >= 35000) return 95;
    if (avg >= 20000) return 80;
    if (avg >= 10000) return 65;
    return 40;
  }
}

export const rankingEngine = new RankingEngine();
