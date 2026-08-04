import { careerAdvisorAgent } from '../services/CareerAdvisorAgent.js';
import { enrichmentService } from '../services/EnrichmentService.js';
import { InternshipRepository } from '../repositories/InternshipRepository.js';

async function main() {
  console.log('\n==================================================');
  console.log('🤖 ATLAS AI CAREER ADVISOR & ENRICHMENT TEST');
  console.log('==================================================\n');

  const repo = new InternshipRepository();
  const topInternships = await repo.getTopRankedInternships(5);

  if (topInternships.length === 0) {
    console.log('⚠️ No internships found in database. Run plugin collector first:');
    console.log('   npx tsx src/scripts/testPlugin.ts github-internships --save\n');
    return;
  }

  const sample = topInternships[0];
  console.log(`📌 Analyzing Top Internship: ${sample.title} at ${sample.companyName}`);

  const enriched = await enrichmentService.enrichInternship(sample);
  console.log('\n1. 🔍 AI Enrichment & Strategy Breakdown:');
  console.log(`   - Status: ${enriched.status}`);
  console.log(`   - Explanation: ${enriched.matchExplanation}`);

  console.log('\n2. 💬 Asking AI Career Advisor: "Why is this internship ranked first & should I apply?"');
  const advice = await careerAdvisorAgent.askAdvisor(
    'Why is this internship ranked first and should I apply today?',
    sample
  );
  console.log(`   - Recommendation: ${advice.recommendationTier}`);
  console.log(`   - Advice: ${advice.answer}`);
  console.log(`   - Action Steps:\n     * ${advice.actionableSteps.join('\n     * ')}`);

  console.log('\n3. 📊 Generating Weekly Market Intelligence Report:');
  const report = careerAdvisorAgent.generateWeeklyMarketIntelligence(topInternships);
  console.log(report);

  console.log('\n==================================================\n');
}

main().catch((err) => {
  console.error('Advisor Test Error:', err);
});
