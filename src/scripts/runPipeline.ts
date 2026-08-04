import { initializePlugins } from '../plugins/initPlugins.js';
import { pluginRegistry } from '../plugins/PluginRegistry.js';
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
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

async function main() {
  initializePlugins();

  console.log('\n==================================================');
  console.log('🚀 ATLAS INTERNAI — REAL VERIFIED PIPELINE');
  console.log('==================================================\n');

  const startTime = Date.now();
  const repo = new InternshipRepository();

  // 1 & 2. Discovery & Collection from real plugins
  logger.info('Stage 1 & 2: Collecting real listings from plugins (GitHub, ATS APIs, Platforms)...');
  const plugins = pluginRegistry.getAll();
  const rawListings = [];

  for (const plugin of plugins) {
    try {
      const page = await plugin.collect(plugin.id);
      const listings = await plugin.normalize(page);
      rawListings.push(...listings);
    } catch {
      // Continue
    }
  }

  console.log(`🎉 Extracted ${rawListings.length} real raw internship(s)`);
  const canonicalListings = rawListings.map((raw) => NormalizationStage.toCanonical(raw));

  // 3. Deduplication
  logger.info('Stage 3: Deduplicating listings...');
  const dedup = new DeduplicationStage();
  const { unique, duplicatesCount } = await dedup.process(canonicalListings);
  console.log(`🧹 Filtered out ${duplicatesCount} duplicates. Unique items: ${unique.length}`);

  // 4. Verification Stage (Strict URL & Data Verification)
  logger.info('Stage 4: Verifying application URLs and data integrity (VerificationStage)...');
  const verifier = new VerificationStage();
  const { verified: verifiedListings, rejected: rejectedVerification } = verifier.verify(unique);
  console.log(`🛡️ Verified ${verifiedListings.length} real internships (Rejected ${rejectedVerification.length} invalid/unverifiable links)`);

  // 5. Country Filter (India Only)
  logger.info('Stage 5: Filtering for India opportunities (CountryFilterStage)...');
  const countryFilter = new CountryFilterStage();
  const { filtered: indiaFiltered, rejectedCount: nonIndiaRejected } = countryFilter.process(verifiedListings);
  console.log(`🇮🇳 Kept ${indiaFiltered.length} Indian internships (Rejected ${nonIndiaRejected} non-India roles)`);

  // 6. Student Eligibility Filter
  logger.info('Stage 6: Filtering for Student Degree Eligibility (EligibilityFilterStage)...');
  const eligibilityFilter = new EligibilityFilterStage();
  const { filtered: eligibleListings } = eligibilityFilter.process(indiaFiltered);

  // 7. Resume Parsing & Granular Sub-Match Evaluation
  logger.info('Stage 7: Parsing resume & evaluating ATS match scores...');
  const resume = await resumeParserService.parseResume(env.USER_RESUME_PATH);
  for (const item of eligibleListings) {
    const match = await matchingEngine.evaluateMatch(item, resume);
    item.resumeScore = match.score;
    item.skillMatchScore = match.skillMatchScore;
    item.projectMatchScore = match.projectMatchScore;
    item.educationMatchScore = match.educationMatchScore;
  }

  // 8. Multi-Factor Deterministic Ranking Engine
  logger.info('Stage 8: Ranking verified Indian engineering internships...');
  const ranked = await rankingEngine.rankInternships(eligibleListings);
  if (ranked.length > 0) {
    console.log(`🏆 Top Recommendation: ${ranked[0]?.title} at ${ranked[0]?.companyName} (Score: ${ranked[0]?.overallScore}/100)`);
  }

  // 9. AI Enrichment
  logger.info('Stage 9: Enriching top matches with Gemini AI understanding & prep roadmaps...');
  const enrichedListings = [];
  for (const item of ranked.slice(0, 10)) {
    const enriched = await enrichmentService.enrichInternship(item, resume);
    enrichedListings.push(enriched);
  }

  // 10. Fast Batch Database Persistence
  logger.info('Stage 10: Saving all verified eligible internships into Supabase database in batch mode...');
  const { savedCount } = await repo.saveBatch(ranked);
  console.log(`💾 Saved ${savedCount} verified internships to Supabase.`);

  // 11. Single Intelligent Telegram Digest
  logger.info('Stage 11: Dispatching ONE Single Intelligent Summary Digest to Telegram...');
  const digestSent = await telegramNotifier.sendDailyDigest(rawListings.length, eligibleListings.length, ranked);

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log(`\n==================================================`);
  console.log(`📊 VERIFIED INDIAN PIPELINE SUMMARY`);
  console.log(`==================================================`);
  console.log(`  Discovered Listings: ${rawListings.length}`);
  console.log(`  Verified Listings:   ${verifiedListings.length}`);
  console.log(`  Filtered for India:  ${indiaFiltered.length}`);
  console.log(`  Eligible Student:    ${eligibleListings.length}`);
  console.log(`  Saved to Supabase:   ${savedCount}`);
  console.log(`  Telegram Digest Sent:${digestSent ? ' YES ✅' : ' NO ❌'}`);
  console.log(`  Total Duration:      ${duration}s`);
  console.log(`==================================================\n`);
}

main().catch((err) => {
  console.error('Fatal Pipeline Execution Error:', err);
});
