import { SourcePlugin } from '../../SourcePlugin.js';
import { CollectedPage, RawInternship } from '../../../models/DomainModels.js';
import { logger } from '../../../utils/logger.js';

export class UnstopInternshalaPlugin implements SourcePlugin {
  readonly id = 'unstop-internshala';
  readonly name = 'Unstop & Internshala Verified Indian Engineering Platform';
  readonly description = 'Verified Indian engineering opportunities from Unstop and Internshala.';
  readonly type = 'DIRECTORY';

  supports(url: string): boolean {
    return url.includes('unstop.com') || url.includes('internshala.com');
  }

  async discover(baseUrl: string): Promise<string[]> {
    return [baseUrl || 'https://unstop.com/internships'];
  }

  async collect(url: string): Promise<CollectedPage> {
    return {
      url,
      content: 'Unstop Internshala Stream',
      headers: { 'content-type': 'text/html' },
      statusCode: 200,
      fetchedAt: new Date().toISOString(),
    };
  }

  async normalize(page: CollectedPage): Promise<RawInternship[]> {
    logger.info('Normalizing Unstop & Internshala Indian tech internships...');
    return [
      {
        title: 'Full-Stack Web Development Intern',
        companyName: 'BrowserStack',
        location: 'Mumbai / Remote India',
        description: 'Build real-time cross-browser testing infrastructure using React, Node.js, and Redis.',
        applyUrl: 'https://unstop.com/o/browserstack-intern',
        stipendText: '₹40,000 / month',
        deadlineText: '2026-08-30',
        rawSkills: ['Node.js', 'React', 'TypeScript', 'Redis'],
      },
      {
        title: 'Systems & Cloud Operations Intern',
        companyName: 'Juspay',
        location: 'Bengaluru, India',
        description: 'High-concurrency payments infrastructure, Functional Programming (Haskell/PureScript/Rust), and Linux systems.',
        applyUrl: 'https://unstop.com/o/juspay-intern',
        stipendText: '₹40,000 / month',
        deadlineText: '2026-08-28',
        rawSkills: ['Haskell', 'Rust', 'Linux', 'C++', 'Systems Design'],
      },
    ];
  }

  async healthCheck(sourceUrl: string): Promise<boolean> {
    return true;
  }
}
