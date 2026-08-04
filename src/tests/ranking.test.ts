import { describe, it, expect, vi } from 'vitest';
import { RankingEngine } from '../services/RankingEngine.js';
import { CanonicalInternship } from '../models/DomainModels.js';

describe('RankingEngine Unit Tests', () => {
  it('should rank prestige companies and high stipend roles higher', async () => {
    const mockPrefRepo = {
      getRankingWeights: async () => ({
        resumeMatch: 0.40,
        companyPrestige: 0.20,
        careerGrowth: 0.15,
        deadlineUrgency: 0.10,
        stipend: 0.15,
      }),
      getUserPriorities: async () => ({
        prefer_government: true,
        prefer_remote: false,
        prefer_high_stipend: true,
        target_domains: ['AI/ML'],
      }),
    };

    const engine = new RankingEngine(mockPrefRepo as any);

    const items: CanonicalInternship[] = [
      {
        title: 'Software Intern',
        companyName: 'Unknown Startup',
        description: 'Web development',
        location: 'City',
        isRemote: false,
        stipendMin: 5000,
        stipendMax: 5000,
        stipendCurrency: 'INR',
        stipendText: '₹5,000',
        applyUrl: 'https://example.com/1',
        canonicalUrl: 'https://example.com/1',
        contentHash: 'hash1',
        deadline: null,
        skills: [],
        status: 'NORMALIZED',
        resumeScore: 60,
      },
      {
        title: 'AI/ML Engineering Intern',
        companyName: 'ISRO',
        description: 'Space mission AI algorithms',
        location: 'Remote',
        isRemote: true,
        stipendMin: 50000,
        stipendMax: 50000,
        stipendCurrency: 'INR',
        stipendText: '₹50,000',
        applyUrl: 'https://isro.gov.in/job',
        canonicalUrl: 'https://isro.gov.in/job',
        contentHash: 'hash2',
        deadline: null,
        skills: ['AI/ML'],
        status: 'NORMALIZED',
        resumeScore: 90,
      },
    ];

    const ranked = await engine.rankInternships(items);

    expect(ranked[0].companyName).toBe('ISRO');
    expect(ranked[0].overallScore).toBeGreaterThan(ranked[1].overallScore || 0);
  });
});
