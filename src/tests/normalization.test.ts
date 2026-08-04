import { describe, it, expect } from 'vitest';
import { NormalizationStage } from '../pipeline/NormalizationStage.js';
import { RawInternship } from '../models/DomainModels.js';

describe('NormalizationStage Unit Tests', () => {
  it('should normalize raw internship fields and canonicalize URL', () => {
    const raw: RawInternship = {
      title: '  Software Engineer Intern  ',
      companyName: '  Google ',
      location: ' Bangalore, India (Work from home) ',
      applyUrl: 'https://careers.google.com/jobs/123/?utm_source=linkedin&ref=abc#apply',
      stipendText: '₹45,000 / month',
      deadlineText: '2026-12-31',
      rawSkills: ['TypeScript', 'Node.js'],
    };

    const canonical = NormalizationStage.toCanonical(raw, 'source_1');

    expect(canonical.title).toBe('Software Engineer Intern');
    expect(canonical.companyName).toBe('Google');
    expect(canonical.isRemote).toBe(true);
    expect(canonical.canonicalUrl).toBe('https://careers.google.com/jobs/123');
    expect(canonical.stipendMin).toBe(45000);
    expect(canonical.stipendCurrency).toBe('INR');
    expect(canonical.contentHash).toBeDefined();
  });

  it('should correctly handle missing stipends and default to INR', () => {
    const raw: RawInternship = {
      title: 'Research Fellow',
      companyName: 'ISRO',
      applyUrl: 'https://isro.gov.in/fellowship',
    };

    const canonical = NormalizationStage.toCanonical(raw);
    expect(canonical.stipendMin).toBeNull();
    expect(canonical.stipendCurrency).toBe('INR');
  });
});
