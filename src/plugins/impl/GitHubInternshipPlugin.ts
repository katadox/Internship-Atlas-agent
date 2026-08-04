import { SourcePlugin } from '../SourcePlugin.js';
import { CollectedPage, RawInternship } from '../../models/DomainModels.js';
import { fetcherService } from '../../pipeline/FetcherService.js';
import { logger } from '../../utils/logger.js';
import * as cheerio from 'cheerio';

export class GitHubInternshipPlugin implements SourcePlugin {
  id = 'github-internships';
  name = 'GitHub Tech Internships List';
  description = 'Scrapes curated open-source tech internship repositories (markdown tables)';

  supports(url: string): boolean {
    return url.includes('github.com') || url.includes('raw.githubusercontent.com');
  }

  async discover(sourceUrl: string): Promise<string[]> {
    return [sourceUrl];
  }

  async collect(url: string): Promise<CollectedPage> {
    const rawUrl = url
      .replace('github.com', 'raw.githubusercontent.com')
      .replace('/blob/', '/');
    const { page } = await fetcherService.fetch(rawUrl);
    return page;
  }

  async normalize(page: CollectedPage): Promise<RawInternship[]> {
    const internships: RawInternship[] = [];
    const content = page.content;

    // 1. Try Cheerio for HTML tables inside Markdown/HTML
    const $ = cheerio.load(content);
    $('tr').each((_, element) => {
      const tds = $(element).find('td');
      if (tds.length >= 3) {
        const companyText = $(tds[0]).text().trim();
        const roleText = $(tds[1]).text().trim();
        const locationText = $(tds[2]).text().trim();
        const applyLink = $(element).find('a[href^="http"]').attr('href') || $(tds[3]).find('a').attr('href') || page.url;

        if (companyText && roleText && !companyText.toLowerCase().includes('company') && !roleText.toLowerCase().includes('role')) {
          internships.push({
            companyName: companyText.replace(/↳\s*/g, ''),
            title: roleText,
            location: locationText || 'Remote / Unspecified',
            applyUrl: applyLink,
            stipendText: 'Unspecified',
            deadlineText: 'Open',
            rawSkills: ['Software Engineering', 'Computer Science'],
          });
        }
      }
    });

    // 2. Parse Markdown table lines (| Company | Role | Location | Link |)
    if (internships.length === 0) {
      let lastCompany = '';
      const lines = content.split('\n');
      for (const line of lines) {
        if (!line.includes('|') || line.includes('---')) continue;
        const parts = line.split('|').map((p) => p.trim()).filter(Boolean);
        if (parts.length < 3) continue;

        let companyName = parts[0].replace(/\[(.*?)\]\(.*?\)/g, '$1').replace(/<[^>]*>/g, '').replace(/\*\*/g, '').trim();
        const title = parts[1].replace(/\[(.*?)\]\(.*?\)/g, '$1').replace(/<[^>]*>/g, '').trim();
        const location = parts[2].replace(/<[^>]*>/g, '').trim() || 'Remote / Unspecified';

        if (companyName.includes('↳') || companyName === '' || companyName === '↳') {
          companyName = lastCompany || 'Unknown Company';
        } else {
          lastCompany = companyName;
        }

        let applyUrl = page.url;
        const linkMatch = line.match(/href="([^"]+)"/) || line.match(/\((https?:\/\/[^\s\)]+)\)/);
        if (linkMatch) {
          applyUrl = linkMatch[1];
        }

        if (
          companyName &&
          title &&
          !title.toLowerCase().includes('role') &&
          !companyName.toLowerCase().includes('company') &&
          !companyName.includes('---')
        ) {
          internships.push({
            companyName: companyName.replace(/↳\s*/g, ''),
            title,
            location,
            applyUrl,
            stipendText: 'Unspecified',
            deadlineText: 'Open',
            rawSkills: ['Software Engineering', 'Computer Science'],
          });
        }
      }
    }

    logger.info(`GitHubInternshipPlugin normalized ${internships.length} internships from ${page.url}`);
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
