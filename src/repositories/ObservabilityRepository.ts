import { getSupabaseClient } from '../database/client.js';
import { logger } from '../utils/logger.js';

export class ObservabilityRepository {
  private client = getSupabaseClient();

  async recordMetric(name: string, value: number, tags: Record<string, unknown> = {}): Promise<void> {
    try {
      await this.client.from('observability_metrics').insert({
        metric_name: name,
        metric_value: value,
        tags_json: tags,
        recorded_at: new Date().toISOString(),
      });
    } catch (err) {
      logger.error('Failed to record metric', { metric: name, error: String(err) });
    }
  }

  async incrementMetric(name: string, step = 1, tags: Record<string, unknown> = {}): Promise<void> {
    await this.recordMetric(name, step, tags);
  }
}
