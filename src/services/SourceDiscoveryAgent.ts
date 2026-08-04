import axios from 'axios';
import * as cheerio from 'cheerio';
import { logger } from '../utils/logger.js';
import { SourceEntity } from '../models/DomainModels.js';

export interface DiscoveryResult {
  companyDomain: string;
  careersUrl: string;
  detectedATS: 'Greenhouse' | 'Lever' | 'Ashby' | 'Workday' | 'Darwinbox' | 'Zoho Recruit' | 'Generic';
  suggestedPluginId: string;
  apiUrl?: string;
}

export class SourceDiscoveryAgent {
  async discoverCompanySource(companyDomain: string): Promise<DiscoveryResult> {
    const cleanDomain = companyDomain.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    logger.info(`🔍 SourceDiscoveryAgent inspecting target company: ${cleanDomain}`);

    const candidateUrls = [
      `https://careers.${cleanDomain}`,
      `https://${cleanDomain}/careers`,
      `https://${cleanDomain}/jobs`,
    ];

    for (const url of candidateUrls) {
      try {
        const response = await axios.get(url, { timeout: 5000, headers: { 'User-Agent': 'AtlasSourceDiscovery/1.0' } });
        if (response.status === 200) {
          const html = response.data;
          const detectedATS = this.detectATS(html, url);
          const suggestedPluginId = detectedATS !== 'Generic' ? 'ats-portal' : 'generic-html';

          logger.info(`✓ Careers page discovered at: ${url} | Detected ATS: ${detectedATS}`);
          return {
            companyDomain: cleanDomain,
            careersUrl: url,
            detectedATS,
            suggestedPluginId,
          };
        }
      } catch {
        // Continue to next candidate URL
      }
    }

    // Default fallback
    logger.warn(`SourceDiscoveryAgent used generic fallback for domain: ${cleanDomain}`);
    return {
      companyDomain: cleanDomain,
      careersUrl: `https://${cleanDomain}/careers`,
      detectedATS: 'Generic',
      suggestedPluginId: 'generic-html',
    };
  }

  private detectATS(html: string, url: string): DiscoveryResult['detectedATS'] {
    const htmlLower = html.toLowerCase();
    const urlLower = url.toLowerCase();

    if (urlLower.includes('greenhouse.io') || htmlLower.includes('boards.greenhouse.io')) return 'Greenhouse';
    if (urlLower.includes('lever.co') || htmlLower.includes('jobs.lever.co')) return 'Lever';
    if (urlLower.includes('ashbyhq.com') || htmlLower.includes('jobs.ashbyhq.com')) return 'Ashby';
    if (urlLower.includes('workday.com') || htmlLower.includes('myworkdayjobs.com')) return 'Workday';
    if (urlLower.includes('darwinbox') || htmlLower.includes('darwinbox.in')) return 'Darwinbox';
    if (urlLower.includes('zoho.com') || htmlLower.includes('zohorecruit.com')) return 'Zoho Recruit';

    return 'Generic';
  }
}

export const sourceDiscoveryAgent = new SourceDiscoveryAgent();
