import crypto from 'crypto';
import { RawInternship, CanonicalInternship } from '../models/DomainModels.js';

export class NormalizationStage {
  public static toCanonical(raw: RawInternship, sourceId?: string): CanonicalInternship {
    const title = this.cleanText(raw.title);
    const companyName = this.cleanText(raw.companyName);
    const location = raw.location ? this.cleanText(raw.location) : 'Remote / India';
    const isRemote = location.toLowerCase().includes('remote') || location.toLowerCase().includes('work from home');
    const description = raw.description ? this.cleanText(raw.description) : `${title} opportunity at ${companyName}`;

    // Canonicalize apply URL
    const canonicalUrl = this.canonicalizeUrl(raw.applyUrl);

    // Compute MD5 content hash for exact duplicate detection
    const rawContentString = `${title.toLowerCase()}|${companyName.toLowerCase()}|${canonicalUrl}`;
    const contentHash = crypto.createHash('md5').update(rawContentString).digest('hex');

    // Parse Stipends deterministically
    const { min: stipendMin, max: stipendMax, currency: stipendCurrency } = this.parseStipend(raw.stipendText);

    return {
      sourceId,
      companyName,
      title,
      description,
      location,
      country: 'India',
      isRemote,
      stipendMin,
      stipendMax,
      stipendCurrency,
      stipendText: raw.stipendText || 'Unspecified',
      applyUrl: raw.applyUrl,
      canonicalUrl,
      contentHash,
      deadline: this.parseDeadline(raw.deadlineText),
      skills: raw.rawSkills || [],
      status: 'NORMALIZED',
      confidenceScore: 1.0,
    };
  }

  private static cleanText(text: string): string {
    return text.replace(/\s+/g, ' ').trim();
  }

  public static canonicalizeUrl(rawUrl: string): string {
    try {
      const parsed = new URL(rawUrl);
      parsed.hash = ''; // strip anchor
      // strip common tracking params
      ['utm_source', 'utm_medium', 'utm_campaign', 'ref', 'source'].forEach((param) => {
        parsed.searchParams.delete(param);
      });
      let href = parsed.toString();
      if (href.endsWith('/')) {
        href = href.slice(0, -1);
      }
      return href;
    } catch {
      return rawUrl.trim().toLowerCase();
    }
  }

  private static parseStipend(stipendText?: string): { min: number | null; max: number | null; currency: string } {
    if (!stipendText) return { min: null, max: null, currency: 'INR' };

    const clean = stipendText.replace(/,/g, '');
    const matches = clean.match(/\d+/g);

    let currency = 'INR';
    if (stipendText.includes('$') || stipendText.includes('USD')) currency = 'USD';
    if (stipendText.includes('€') || stipendText.includes('EUR')) currency = 'EUR';

    if (!matches || matches.length === 0) {
      return { min: null, max: null, currency };
    }

    const nums = matches.map(Number);
    if (nums.length === 1) {
      return { min: nums[0], max: nums[0], currency };
    }

    return {
      min: Math.min(...nums),
      max: Math.max(...nums),
      currency,
    };
  }

  private static parseDeadline(deadlineText?: string): string | null {
    if (!deadlineText || deadlineText.toLowerCase() === 'open') return null;
    const timestamp = Date.parse(deadlineText);
    if (!isNaN(timestamp)) {
      return new Date(timestamp).toISOString();
    }
    return null;
  }
}
