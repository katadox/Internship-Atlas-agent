import { task } from '@trigger.dev/sdk/v3';
import { NormalizationStage } from '../pipeline/NormalizationStage.js';
import { DeduplicationStage } from '../pipeline/DeduplicationStage.js';
import { VerificationStage } from '../pipeline/VerificationStage.js';
import { CountryFilterStage } from '../pipeline/CountryFilterStage.js';
import { EligibilityFilterStage } from '../pipeline/EligibilityFilterStage.js';
import { matchingEngine } from '../services/MatchingEngine.js';
import { rankingEngine } from '../services/RankingEngine.js';
import { resumeParserService } from '../services/ResumeParserService.js';
import { enrichmentService } from '../services/EnrichmentService.js';
import { InternshipRepository } from '../repositories/InternshipRepository.js';
import { telegramNotifier } from '../notifications/TelegramNotifier.js';
import { RawInternship } from '../models/DomainModels.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export const processPipelineTask = task({
  id: 'process-pipeline',
  run: async (payload: { rawItems: RawInternship[]; sourceId?: string }) => {
    logger.info(`Starting Verified Indian Engineering Pipeline execution for ${payload.rawItems.length} raw items`);

    // 1. Normalization Stage
    const canonicalItems = payload.rawItems.map((raw) => NormalizationStage.toCanonical(raw, payload.sourceId));

    // 2. Deduplication Stage
    const dedup = new DeduplicationStage();
    const { unique } = await dedup.process(canonicalItems);

    // 3. Verification Stage (Strict URL & Data Verification)
    const verifier = new VerificationStage();
    const { verified } = verifier.verify(unique);

    // 4. Country Filter Stage (India Only)
    const countryFilter = new CountryFilterStage();
    const { filtered: indiaFiltered } = countryFilter.process(verified);

    // 5. Student & Degree Eligibility Filter Stage
    const eligibilityFilter = new EligibilityFilterStage();
    const { filtered: eligibleItems } = eligibilityFilter.process(indiaFiltered);

    // 6. Resume Parsing & Granular Matching Stage
    const resume = await resumeParserService.parseResume(env.USER_RESUME_PATH);
    for (const item of eligibleItems) {
      const match = await matchingEngine.evaluateMatch(item, resume);
      item.resumeScore = match.score;
      item.skillMatchScore = match.skillMatchScore;
      item.projectMatchScore = match.projectMatchScore;
      item.educationMatchScore = match.educationMatchScore;
    }

    // 7. Deterministic Multi-Factor Ranking Engine Stage
    const ranked = await rankingEngine.rankInternships(eligibleItems);

    // 8. AI Enrichment Stage
    const enrichedListings = [];
    for (const item of ranked.slice(0, 10)) {
      const enriched = await enrichmentService.enrichInternship(item, resume);
      enrichedListings.push(enriched);
    }

    // 9. Fast Batch Database Persistence Stage
    const internshipRepo = new InternshipRepository();
    const { savedCount } = await internshipRepo.saveBatch(ranked);

    // 10. Single Intelligent Telegram Digest Notification Stage
    await telegramNotifier.sendDailyDigest(payload.rawItems.length, eligibleItems.length, ranked);

    return {
      processedCount: payload.rawItems.length,
      verifiedCount: verified.length,
      eligibleIndiaCount: eligibleItems.length,
      savedCount,
      topRankedTitle: ranked[0]?.title,
      topRankedCompany: ranked[0]?.companyName,
    };
  },
});
