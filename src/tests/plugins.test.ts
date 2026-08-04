import { describe, it, expect } from 'vitest';
import { GitHubInternshipPlugin } from '../plugins/impl/GitHubInternshipPlugin.js';
import { GovtPortalPlugin } from '../plugins/impl/GovtPortalPlugin.js';

describe('Source Plugins Unit Tests', () => {
  it('GitHubInternshipPlugin should correctly recognize supported URLs', () => {
    const plugin = new GitHubInternshipPlugin();
    expect(plugin.supports('https://github.com/pittcsc/Summer2026-Internships')).toBe(true);
    expect(plugin.supports('https://google.com')).toBe(false);
  });

  it('GovtPortalPlugin should identify Indian government domain URLs', () => {
    const plugin = new GovtPortalPlugin();
    expect(plugin.supports('https://isro.gov.in/careers')).toBe(true);
    expect(plugin.supports('https://aicte-india.org/internships')).toBe(true);
    expect(plugin.supports('https://drdo.gov.in')).toBe(true);
    expect(plugin.supports('https://company.com')).toBe(false);
  });
});
