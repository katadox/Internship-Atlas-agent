import { CanonicalInternship } from '../models/DomainModels.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export class CountryFilterStage {
  process(items: CanonicalInternship[]): { filtered: CanonicalInternship[]; rejectedCount: number } {
    if (env.ALLOW_INTERNATIONAL) {
      logger.info('International internships allowed by configuration.');
      return { filtered: items, rejectedCount: 0 };
    }

    const filtered: CanonicalInternship[] = [];
    let rejectedCount = 0;

    const nonIndiaKeywords = [
      'united states', 'usa', 'u.s.', 'canada', 'uk', 'united kingdom', 'london',
      'germany', 'berlin', 'france', 'paris', 'australia', 'sydney', 'japan', 'tokyo',
      'singapore', 'amsterdam', 'netherlands', 'switzerland', 'zurich', 'ireland', 'dublin'
    ];

    const indianKeywords = [
      'india', 'bengaluru', 'bangalore', 'hyderabad', 'pune', 'gurgaon', 'gurugram',
      'noida', 'mumbai', 'chennai', 'delhi', 'ncr', 'kolkata', 'ahmedabad', 'thiruvananthapuram',
      'kochi', 'indore', 'jaipur', 'remote in india', 'work from home (india)'
    ];

    for (const item of items) {
      const locLower = item.location.toLowerCase();
      const titleLower = item.title.toLowerCase();
      const descLower = item.description.toLowerCase();

      // Check explicit non-India keywords
      const isExplicitNonIndia = nonIndiaKeywords.some((kw) =>
        locLower.includes(kw) || titleLower.includes(`(${kw})`) || titleLower.includes(`- ${kw}`)
      );

      if (isExplicitNonIndia) {
        rejectedCount++;
        continue;
      }

      // Check Indian keywords or general remote
      const isExplicitIndia = indianKeywords.some((kw) =>
        locLower.includes(kw) || descLower.includes(kw) || titleLower.includes(kw)
      );

      if (isExplicitIndia || item.isRemote || locLower === '' || locLower === 'remote' || locLower === 'unknown') {
        item.country = 'India';
        filtered.push(item);
      } else {
        rejectedCount++;
      }
    }

    logger.info(`📍 CountryFilterStage (India Only): Kept ${filtered.length} listings, rejected ${rejectedCount} non-India positions.`);
    return { filtered, rejectedCount };
  }
}
