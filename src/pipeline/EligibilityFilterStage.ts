import { CanonicalInternship } from '../models/DomainModels.js';
import { logger } from '../utils/logger.js';

export class EligibilityFilterStage {
  process(items: CanonicalInternship[]): { filtered: CanonicalInternship[]; rejectedCount: number } {
    const filtered: CanonicalInternship[] = [];
    let rejectedCount = 0;

    const fullTimeSeniorKeywords = [
      'senior software engineer', 'staff engineer', 'principal engineer',
      'lead engineer', 'engineering manager', 'tech lead', 'full time - senior'
    ];

    for (const item of items) {
      const titleLower = item.title.toLowerCase();

      // Reject non-intern full-time senior positions
      const isSenior = fullTimeSeniorKeywords.some((kw) => titleLower.includes(kw));
      if (isSenior && !titleLower.includes('intern') && !titleLower.includes('co-op')) {
        rejectedCount++;
        continue;
      }

      filtered.push(item);
    }

    logger.info(`🎓 EligibilityFilterStage: Kept ${filtered.length} eligible student internships, rejected ${rejectedCount} full-time roles.`);
    return { filtered, rejectedCount };
  }
}
