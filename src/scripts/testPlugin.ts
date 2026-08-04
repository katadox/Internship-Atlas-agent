import { initializePlugins } from '../plugins/initPlugins.js';
import { pluginRegistry } from '../plugins/PluginRegistry.js';
import { NormalizationStage } from '../pipeline/NormalizationStage.js';
import { DeduplicationStage } from '../pipeline/DeduplicationStage.js';
import { InternshipRepository } from '../repositories/InternshipRepository.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

async function main() {
  initializePlugins();

  const args = process.argv.slice(2);
  const isSaveMode = args.includes('--save');
  const cleanArgs = args.filter((a) => a !== '--save');

  const pluginQuery = cleanArgs[0];
  let customUrl = cleanArgs[1];

  if (!pluginQuery) {
    console.log('\n🔍 Available Plugins in Registry:');
    const plugins = pluginRegistry.getAll();
    for (const p of plugins) {
      console.log(`  - ID: ${p.id} | Name: ${p.name}`);
    }
    console.log('\nUsage: npm run plugin:test <pluginId|url> [targetUrl] [--save]\n');
    process.exit(0);
  }

  let plugin = pluginRegistry.get(pluginQuery);
  let targetUrl = customUrl;

  if (!plugin) {
    plugin = pluginRegistry.getForUrl(pluginQuery);
    if (plugin && !targetUrl) {
      targetUrl = pluginQuery;
    }
  }

  if (!plugin) {
    console.error(
      `❌ Plugin not found for query: "${pluginQuery}". Use one of: ${pluginRegistry
        .getAll()
        .map((p) => p.id)
        .join(', ')}`
    );
    process.exit(1);
  }

  const defaultUrls: Record<string, string> = {
    'github-internships': 'https://raw.githubusercontent.com/pittcsc/Summer2025-Internships/dev/README.md',
    'generic-html': 'https://example.com',
    'rss-sitemap': 'https://news.ycombinator.com/rss',
    'govt-portal': 'https://internship.aicte-india.org',
    'ats-portal': 'https://boards.greenhouse.io',
  };

  const url = targetUrl || defaultUrls[plugin.id] || 'https://example.com';
  const startTime = Date.now();

  console.log(`\n==================================================`);
  console.log(`🧪 Testing Plugin: [${plugin.id}] ${plugin.name}`);
  console.log(`🔗 Target URL: ${url}`);
  console.log(`💾 Save to Supabase Mode: ${isSaveMode ? 'ENABLED ✅' : 'DISABLED ❌'}`);
  console.log(`==================================================\n`);

  try {
    logger.info('Stage 1: Discovering URLs...');
    const discoveredUrls = await plugin.discover(url);
    console.log(`📌 Discovered ${discoveredUrls.length} URL(s):`, discoveredUrls.slice(0, 5));

    logger.info('Stage 2: Collecting page content...');
    const collectedPage = await plugin.collect(url);
    console.log(`📄 Page Status Code: ${collectedPage.statusCode} | Length: ${collectedPage.content.length} chars`);

    logger.info('Stage 3: Normalizing extracted internships...');
    const rawListings = await plugin.normalize(collectedPage);
    console.log(`🎉 Extracted ${rawListings.length} raw internship(s)`);

    const canonicalListings = rawListings.map((raw) => NormalizationStage.toCanonical(raw));

    let duplicatesCount = 0;
    let insertedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    if (isSaveMode) {
      const keys = [
        env.SUPABASE_SECRET_KEY,
        env.SUPABASE_SERVICE_ROLE_KEY,
        env.SUPABASE_PUBLISHABLE_KEY,
        env.SUPABASE_ANON_KEY,
      ];
      const hasValidKey = keys.some((k) => k && !k.startsWith('mock') && !k.includes('•'));

      if (!hasValidKey) {
        console.error(`\n⚠️  Cannot save to Supabase: Real Supabase API key is missing!`);
        console.error(`   Your .env has mock/redacted keys.`);
        console.error(`   Please set your real Supabase Service Role Key or Publishable Key in .env to enable database writing.\n`);
        process.exit(1);
      }

      console.log('\n💾 Executing Integration Mode: Saving to Supabase...');
      const repo = new InternshipRepository();
      const dedup = new DeduplicationStage();

      const { unique: uniqueListings, duplicatesCount: count } = await dedup.process(canonicalListings);
      duplicatesCount = count;

      const { savedCount, failedCount } = await repo.saveBatch(uniqueListings);
      insertedCount = savedCount;
      skippedCount = failedCount;
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log(`\n==================================================`);
    console.log(`📊 INGESTION PIPELINE SUMMARY`);
    console.log(`==================================================`);
    console.log(`  Pages Crawled:     ${discoveredUrls.length}`);
    console.log(`  Internships Found: ${rawListings.length}`);
    if (isSaveMode) {
      console.log(`  Duplicates:        ${duplicatesCount}`);
      console.log(`  Inserted:          ${insertedCount}`);
      console.log(`  Updated:           ${updatedCount}`);
      console.log(`  Skipped:           ${skippedCount}`);
    }
    console.log(`  Duration:          ${duration}s`);
    console.log(`==================================================\n`);

    if (!isSaveMode && rawListings.length > 0) {
      console.log('Sample Extracted Item (First 3):');
      console.log(JSON.stringify(rawListings.slice(0, 3), null, 2));
      console.log('\nTip: Run with --save flag to persist listings into Supabase database.\n');
    }
  } catch (error) {
    console.error(`❌ Test Harness Error:`, error);
  }
}

main().catch((err) => {
  console.error('Fatal Test Harness Error:', err);
});
