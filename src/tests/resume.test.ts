import { describe, it, expect } from 'vitest';
import { resumeParserService } from '../services/ResumeParserService.js';
import path from 'path';
import fs from 'fs';

describe('ResumeParserService Unit Tests', () => {
  const rootDir = process.cwd();

  it('should parse a valid PDF resume correctly', async () => {
    const pdfPath = path.join(rootDir, 'resume.pdf');
    if (fs.existsSync(pdfPath)) {
      const result = await resumeParserService.parseResume(pdfPath);
      expect(result.isParsedSuccessfully).toBe(true);
      expect(result.completenessScore).toBeGreaterThan(0);
      expect(result.skills.length).toBeGreaterThan(0);
    }
  });

  it('should return explicit error status for a missing file', async () => {
    const result = await resumeParserService.parseResume('non_existent_file.pdf');
    expect(result.isParsedSuccessfully).toBe(false);
    expect(result.parseErrorReason).toContain('Resume file not found');
    expect(result.completenessScore).toBe(0);
  });

  it('should return explicit error status for an unsupported file format', async () => {
    const dummyPath = path.join(rootDir, 'test_dummy.exe');
    fs.writeFileSync(dummyPath, 'dummy data');
    try {
      const result = await resumeParserService.parseResume(dummyPath);
      expect(result.isParsedSuccessfully).toBe(false);
      expect(result.parseErrorReason).toContain('Unsupported resume file extension');
    } finally {
      if (fs.existsSync(dummyPath)) fs.unlinkSync(dummyPath);
    }
  });

  it('should return explicit error for an empty resume file', async () => {
    const emptyPath = path.join(rootDir, 'empty_resume.txt');
    fs.writeFileSync(emptyPath, '   ');
    try {
      const result = await resumeParserService.parseResume(emptyPath);
      expect(result.isParsedSuccessfully).toBe(false);
      expect(result.parseErrorReason).toContain('empty or insufficient text content');
    } finally {
      if (fs.existsSync(emptyPath)) fs.unlinkSync(emptyPath);
    }
  });
});
