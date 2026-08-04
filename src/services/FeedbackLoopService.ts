import { getSupabaseClient } from '../database/client.js';
import { PreferenceRepository } from '../repositories/PreferenceRepository.js';
import { logger } from '../utils/logger.js';

export class FeedbackLoopService {
  private client = getSupabaseClient();
  private prefRepo = new PreferenceRepository();

  async recordUserAction(
    internshipId: string,
    actionType: 'VIEWED' | 'APPLIED' | 'SAVED' | 'REJECTED',
    notes?: string
  ): Promise<boolean> {
    try {
      const { error } = await this.client.from('user_actions').insert({
        internship_id: internshipId,
        action_type: actionType,
        notes: notes || '',
      });

      if (error) {
        logger.error('Failed to record user action', { internshipId, actionType, error: error.message });
        return false;
      }

      logger.info(`Recorded user action [${actionType}] for internship: ${internshipId}`);

      // Trigger feedback loop adaptation
      await this.optimizeWeightsFromFeedback();
      return true;
    } catch (err) {
      logger.error('Error in FeedbackLoopService.recordUserAction', { error: String(err) });
      return false;
    }
  }

  async optimizeWeightsFromFeedback(): Promise<void> {
    try {
      const { data: actions, error } = await this.client
        .from('user_actions')
        .select('action_type, internships(is_remote, company_score, stipend_min)')
        .limit(100);

      if (error || !actions || actions.length === 0) return;

      const currentWeights = await this.prefRepo.getRankingWeights();
      const currentPriorities = await this.prefRepo.getUserPriorities();

      let appliedOrSavedCount = 0;
      let remoteInterestCount = 0;

      actions.forEach((act: any) => {
        const type = act.action_type;
        const internship = act.internships;

        if (type === 'APPLIED' || type === 'SAVED') {
          appliedOrSavedCount++;
          if (internship?.is_remote) {
            remoteInterestCount++;
          }
        }
      });

      // Adjust priorities dynamically
      if (appliedOrSavedCount > 0 && remoteInterestCount / appliedOrSavedCount >= 0.6) {
        currentPriorities.prefer_remote = true;
        await this.prefRepo.saveUserPriorities(currentPriorities);
        logger.info('Feedback Loop: Automatically enabled prefer_remote preference based on user actions.');
      }
    } catch (err) {
      logger.error('Error in FeedbackLoopService.optimizeWeightsFromFeedback', { error: String(err) });
    }
  }
}

export const feedbackLoopService = new FeedbackLoopService();
