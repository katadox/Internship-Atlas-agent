import { SourcePlugin } from '../SourcePlugin.js';
import { CollectedPage, RawInternship } from '../../models/DomainModels.js';
import { fetcherService } from '../../pipeline/FetcherService.js';
import { logger } from '../../utils/logger.js';
import * as cheerio from 'cheerio';

export class GenericHtmlPlugin implements SourcePlugin {
  id = 'generic-html';
  name = 'Generic HTML Web Scraper';
  description = 'Fallback Cheerio HTML scraper for standard career portals and directory pages';

  supports(url: string): boolean {
    return true; // Fallback for all HTTP/HTTPS web pages
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
    const $ = cheerio.load(page.content);

    // Look for common job card elements
    $('.job-card, .job-item, .career-item, tr, .listing-item').each((_: number, el: any) => {
      const title = $(el).find('h2, h3, .job-title, .title, a').first().text().trim();
      const companyName = $(el).find('.company, .company-name, .employer').first().text().trim();
      const location = $(el).find('.location, .city').first().text().trim() || 'Unspecified';
      const href = $(el).find('a').attr('href');

      if (title && title.length > 3) {
        let applyUrl = page.url;
        if (href) {
          try {
            applyUrl = new URL(href, page.url).toString();
          } catch {
            applyUrl = page.url;
          }
        }

        internships.push({
          title,
          companyName: companyName || 'Career Portal',
          location,
          applyUrl,
          stipendText: 'Unspecified',
        });
      }
    });

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
