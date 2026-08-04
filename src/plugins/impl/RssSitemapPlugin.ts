import { SourcePlugin } from '../SourcePlugin.js';
import { CollectedPage, RawInternship } from '../../models/DomainModels.js';
import { fetcherService } from '../../pipeline/FetcherService.js';
import { logger } from '../../utils/logger.js';
import Parser from 'rss-parser';

export class RssSitemapPlugin implements SourcePlugin {
  id = 'rss-sitemap';
  name = 'RSS Feed & XML Sitemap Collector';
  description = 'Parses RSS 2.0 / Atom feeds and XML Sitemaps for job announcements';

  private parser = new Parser();

  supports(url: string): boolean {
    return url.endsWith('.xml') || url.includes('/rss') || url.includes('/feed') || url.includes('sitemap');
  }

  async discover(sourceUrl: string): Promise<string[]> {
    return [sourceUrl];
  }

  async collect(url: string): Promise<CollectedPage> {
    const { page } = await fetcherService.fetch(url);
    return page;
  }

  async normalize(page: CollectedPage): Promise<RawInternship[]> {
    const internships: RawInternship[] = [];

    try {
      const feed = await this.parser.parseString(page.content);
      for (const item of feed.items || []) {
        if (!item.title || !item.link) continue;

        const title = item.title;
        const applyUrl = item.link;
        const description = item.contentSnippet || item.content || '';
        
        // Extract company if title format is "Company - Role" or "Role at Company"
        let companyName = 'Unknown';
        if (title.includes(' at ')) {
          companyName = title.split(' at ')[1].trim();
        } else if (title.includes(' - ')) {
          companyName = title.split(' - ')[0].trim();
        }

        internships.push({
          title,
          companyName,
          applyUrl,
          description,
          deadlineText: item.pubDate || 'Open',
        });
      }
    } catch (err) {
      logger.warn(`RssSitemapPlugin parsing warning on ${page.url}`, { error: String(err) });
    }

    return internships;
  }

  async healthCheck(sourceUrl: string): Promise<boolean> {
    try {
      const page = await this.collect(sourceUrl);
      return page.statusCode === 200;
    } catch {
      return false;
    }
  }
}
