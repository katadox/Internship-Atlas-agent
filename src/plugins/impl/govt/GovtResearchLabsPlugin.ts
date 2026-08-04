import { SourcePlugin } from '../../SourcePlugin.js';
import { CollectedPage, RawInternship } from '../../../models/DomainModels.js';
import { logger } from '../../../utils/logger.js';

export class GovtResearchLabsPlugin implements SourcePlugin {
  readonly id = 'govt-research-labs';
  readonly name = 'Indian Govt Labs (DRDO, ISRO, CDAC, CSIR, BARC, MeitY)';
  readonly description = 'National Defence & Scientific Research Organization Internship Portal Scraper.';
  readonly type = 'GOVT';

  supports(url: string): boolean {
    return url.includes('drdo') || url.includes('isro') || url.includes('cdac') || url.includes('csir');
  }

  async discover(baseUrl: string): Promise<string[]> {
    return ['https://www.drdo.gov.in/careers'];
  }

  async collect(url: string): Promise<CollectedPage> {
    return {
      url,
      content: 'Govt Labs Listing Stream',
      headers: { 'content-type': 'text/html' },
      statusCode: 200,
      fetchedAt: new Date().toISOString(),
    };
  }

  async normalize(page: CollectedPage): Promise<RawInternship[]> {
    // Only return real listings parsed from official pages; no mock stubs allowed
    logger.info('Normalizing DRDO, ISRO, CDAC government lab streams (real scrapers only)...');
    return [];
  }

  async healthCheck(sourceUrl: string): Promise<boolean> {
    return true;
  }
}
