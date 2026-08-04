import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { ObservabilityRepository } from '../repositories/ObservabilityRepository.js';

export class GeminiService {
  private ai: GoogleGenAI | null = null;
  private callsInCurrentRun = 0;
  private observability = new ObservabilityRepository();

  constructor() {
    if (env.GEMINI_API_KEY && env.GEMINI_API_KEY !== 'mock-gemini-key') {
      this.ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
    }
  }

  private loadPrompt(templateName: string): string {
    try {
      const filePath = path.join(process.cwd(), 'src', 'prompts', `${templateName}.prompt.txt`);
      return fs.readFileSync(filePath, 'utf-8');
    } catch {
      logger.warn(`Prompt template ${templateName} not found on disk, using empty template`);
      return '';
    }
  }

  async generateContent(promptName: string, replacements: Record<string, string>): Promise<string | null> {
    if (this.callsInCurrentRun >= env.MAX_GEMINI_CALLS_PER_RUN) {
      logger.warn(`Gemini API call limit reached for current run (${env.MAX_GEMINI_CALLS_PER_RUN})`);
      return null;
    }

    let promptText = this.loadPrompt(promptName);
    for (const [key, val] of Object.entries(replacements)) {
      promptText = promptText.replace(new RegExp(`{{${key}}}`, 'g'), val);
    }

    if (!this.ai) {
      logger.info(`[Mock Gemini API] Prompt executed: ${promptName}`);
      return null;
    }

    const startTime = Date.now();
    try {
      this.callsInCurrentRun++;
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: promptText,
      });

      const duration = Date.now() - startTime;
      await this.observability.recordMetric('gemini_api_latency_ms', duration);
      await this.observability.incrementMetric('gemini_calls_count');

      return response.text || null;
    } catch (err) {
      logger.error('Gemini API execution error', { promptName, error: String(err) });
      await this.observability.incrementMetric('gemini_failures_count');
      return null;
    }
  }
}

export const geminiService = new GeminiService();
