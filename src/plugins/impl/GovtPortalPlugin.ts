import { SourcePlugin } from '../SourcePlugin.js';
import { CollectedPage, RawInternship } from '../../models/DomainModels.js';
import { fetcherService } from '../../pipeline/FetcherService.js';
import { logger } from '../../utils/logger.js';
import * as cheerio from 'cheerio';

export class GovtPortalPlugin implements SourcePlugin {
  id = 'govt-portal';
  name = 'Indian Government & Public Research Institutes Portal';
  description = 'Scrapes Indian govt internship schemes (AICTE, ISRO, DRDO, NITI Aayog, MeitY, NIC, CDAC, BARC, BEL)';

  supports(url: string): boolean {
    return (
      url.includes('.gov.in') ||
      url.includes('.nic.in') ||
      url.includes('.res.in') ||
      url.includes('aicte-india.org') ||
      url.includes('isro.gov.in') ||
      url.includes('drdo.gov.in')
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
    const $ = cheerio.load(page.content);

    // Govt portals usually publish scheme notifications in tables or list items with PDF links
    $('table tr, ul li, div.scheme-item').each((_: number, el: any) => {
      const text = $(el).text().trim();
      if (text.toLowerCase().includes('internship') || text.toLowerCase().includes('fellowship') || text.toLowerCase().includes('trainee')) {
        const titleAnchor = $(el).find('a').first();
        const title = titleAnchor.text().trim() || text.slice(0, 100);
        const href = titleAnchor.attr('href');

        let applyUrl = page.url;
        if (href) {
          try {
            applyUrl = new URL(href, page.url).toString();
          } catch {
            applyUrl = page.url;
          }
        }

        let orgName = 'Government of India';
        if (page.url.includes('isro')) orgName = 'ISRO';
        else if (page.url.includes('drdo')) orgName = 'DRDO';
        else if (page.url.includes('aicte')) orgName = 'AICTE';
        else if (page.url.includes('niti')) orgName = 'NITI Aayog';
        else if (page.url.includes('meity')) orgName = 'MeitY';
        else if (page.url.includes('barc')) orgName = 'BARC';

        internships.push({
          title: title.length > 5 ? title : `Government Internship Scheme - ${orgName}`,
          companyName: orgName,
          location: 'India',
          applyUrl,
          stipendText: 'Government Norms',
          deadlineText: 'Refer Portal',
          rawSkills: ['Research', 'Engineering', 'Public Policy'],
          metadata: { isGovernment: true },
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
