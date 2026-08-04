import { SourcePlugin } from '../SourcePlugin.js';
import { CollectedPage, RawInternship } from '../../models/DomainModels.js';
import { fetcherService } from '../../pipeline/FetcherService.js';
import { logger } from '../../utils/logger.js';

export class AtsPortalPlugin implements SourcePlugin {
  id = 'ats-portal';
  name = 'Corporate ATS Public API Collector';
  description = 'Scrapes public API endpoints of Greenhouse, Lever, and Ashby ATS portals';

  supports(url: string): boolean {
    return (
      url.includes('boards-api.greenhouse.io') ||
      url.includes('api.lever.co') ||
      url.includes('jobs.ashbyhq.com') ||
      url.includes('greenhouse.io') ||
      url.includes('lever.co')
    );
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
      const data = JSON.parse(page.content);

      // Greenhouse API response format
      if (data.jobs && Array.isArray(data.jobs)) {
        for (const job of data.jobs) {
          const title = job.title;
          if (title.toLowerCase().includes('intern') || title.toLowerCase().includes('co-op')) {
            internships.push({
              title,
              companyName: job.company_name || 'Tech Company',
              location: job.location?.name || 'Remote',
              applyUrl: job.absolute_url || page.url,
              stipendText: 'Competitive',
            });
          }
        }
      } 
      // Lever API response format
      else if (Array.isArray(data)) {
        for (const job of data) {
          if (job.text && (job.text.toLowerCase().includes('intern') || job.text.toLowerCase().includes('co-op'))) {
            internships.push({
              title: job.text,
              companyName: job.categories?.department || 'Tech Company',
              location: job.categories?.location || 'Remote',
              applyUrl: job.hostedUrl || page.url,
              stipendText: 'Competitive',
            });
          }
        }
      }
    } catch {
      logger.warn(`AtsPortalPlugin page content non-JSON or custom layout on ${page.url}`);
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
