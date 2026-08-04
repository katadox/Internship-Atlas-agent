import { task } from '@trigger.dev/sdk/v3';
import { pluginRegistry } from '../plugins/PluginRegistry.js';
import { SourceRepository } from '../repositories/SourceRepository.js';
import { logger } from '../utils/logger.js';

export const crawlSourcesTask = task({
  id: 'crawl-sources',
  run: async () => {
    logger.info('Starting Trigger.dev Crawl Sources task');
    const sourceRepo = new SourceRepository();
    const activeSources = await sourceRepo.getActiveSources();
    let totalItemsCrawled = 0;

    for (const source of activeSources) {
      const plugin = pluginRegistry.get(source.pluginId) || pluginRegistry.getForUrl(source.url);
      if (plugin) {
        try {
          const page = await plugin.collect(source.url);
          const rawItems = await plugin.normalize(page);
          totalItemsCrawled += rawItems.length;
          await sourceRepo.updateCrawlStatus(source.id, 'HEALTHY');
        } catch (err) {
          logger.error(`Error crawling source ${source.name}`, { error: String(err) });
          await sourceRepo.updateCrawlStatus(source.id, 'ERROR');
        }
      }
    }

    return { totalItemsCrawled };
  },
});
