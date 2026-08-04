import { CanonicalInternship } from '../models/DomainModels.js';
import { InternshipRepository } from '../repositories/InternshipRepository.js';
import { ObservabilityRepository } from '../repositories/ObservabilityRepository.js';
import { logger } from '../utils/logger.js';

export class DeduplicationStage {
  constructor(
    private internshipRepo = new InternshipRepository(),
    private observabilityRepo = new ObservabilityRepository()
  ) {}

  async process(items: CanonicalInternship[]): Promise<{ unique: CanonicalInternship[]; duplicatesCount: number }> {
    const unique: CanonicalInternship[] = [];
    const seenHashes = new Set<string>();
    const seenUrls = new Set<string>();
    let duplicatesCount = 0;

    for (const item of items) {
      if (seenHashes.has(item.contentHash) || seenUrls.has(item.canonicalUrl)) {
        duplicatesCount++;
        continue;
      }

      seenHashes.add(item.contentHash);
      seenUrls.add(item.canonicalUrl);
      unique.push(item);
    }

    if (duplicatesCount > 0) {
      logger.info(`DeduplicationStage filtered ${duplicatesCount} duplicate internships out of ${items.length}`);
      await this.observabilityRepo.incrementMetric('deduplication_duplicate_rate', duplicatesCount);
    }

    return { unique, duplicatesCount };
  }
}
