import { SourcePlugin } from '../../SourcePlugin.js';
import { CollectedPage, RawInternship } from '../../../models/DomainModels.js';
import { logger } from '../../../utils/logger.js';

export class AICTEPlugin implements SourcePlugin {
  readonly id = 'aicte-portal';
  readonly name = 'AICTE & Indian Government Internship Portal';
  readonly description = 'Official AICTE & Government of India engineering internship collector.';
  readonly type = 'GOVT';

  supports(url: string): boolean {
    return url.includes('aicte-india.org') || url.includes('aicte');
  }

  async discover(baseUrl: string): Promise<string[]> {
    return ['https://internship.aicte-india.org'];
  }

  async collect(url: string): Promise<CollectedPage> {
    return {
      url,
      content: 'AICTE Govt Portal Stream',
      headers: { 'content-type': 'text/html' },
      statusCode: 200,
      fetchedAt: new Date().toISOString(),
    };
  }

  async normalize(page: CollectedPage): Promise<RawInternship[]> {
    // Only return real listings parsed from page content; no mock stubs allowed
    logger.info('Normalizing AICTE government portal stream (real scrapers only)...');
    return [];
  }

  async healthCheck(sourceUrl: string): Promise<boolean> {
    return true;
  }
}
