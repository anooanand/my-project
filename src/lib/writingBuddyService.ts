import { supabase } from './supabase';

export type SupportLevel = 'High Support' | 'Medium Support' | 'Low Support';

export interface WritingBuddyPreferences {
  id: string;
  user_id: string;
  support_level: SupportLevel;
  previous_support_level?: SupportLevel;
  average_essay_score: number;
  total_essays_completed: number;
  total_feedback_sessions: number;
  grammar_skill_level: number;
  vocabulary_skill_level: number;
  structure_skill_level: number;
  creativity_skill_level: number;
  auto_adjust_enabled: boolean;
  preferred_feedback_style: 'detailed' | 'balanced' | 'concise';
  emoji_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface TieredFeedback {
  id: string;
  user_id: string;
  writing_id?: string;
  support_level: SupportLevel;
  feedback_type: 'chat' | 'evaluation' | 'suggestion' | 'correction';
  student_text?: string;
  feedback_text: string;
  word_count: number;
  focus_area?: string;
  text_type?: string;
  student_rating?: number;
  was_helpful?: boolean;
  follow_up_questions: number;
  improvement_detected: boolean;
  skill_improvement_area?: string;
  session_id?: string;
  created_at: string;
}

export interface SupportLevelRecommendation {
  id: string;
  user_id: string;
  current_level: SupportLevel;
  recommended_level: SupportLevel;
  recommendation_reason: string;
  confidence_score: number;
  based_on_essay_count: number;
  based_on_average_score: number;
  based_on_improvement_rate: number;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  reviewed_at?: string;
  created_at: string;
  expires_at: string;
}

export class WritingBuddyService {

  static async getUserPreferences(userId: string): Promise<WritingBuddyPreferences | null> {
    try {
      const { data, error } = await supabase
        .from('writing_buddy_preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching preferences:', error);
        return null;
      }

      if (!data) {
        const defaultPrefs = await this.createDefaultPreferences(userId);
        return defaultPrefs;
      }

      return data as WritingBuddyPreferences;
    } catch (error) {
      console.error('Error in getUserPreferences:', error);
      return null;
    }
  }

  static async createDefaultPreferences(userId: string): Promise<WritingBuddyPreferences | null> {
    try {
      const { data, error } = await supabase
        .from('writing_buddy_preferences')
        .insert({
          user_id: userId,
          support_level: 'Medium Support',
          auto_adjust_enabled: true,
          emoji_enabled: true,
          preferred_feedback_style: 'balanced',
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating default preferences:', error);
        return null;
      }

      return data as WritingBuddyPreferences;
    } catch (error) {
      console.error('Error in createDefaultPreferences:', error);
      return null;
    }
  }

  static async updateSupportLevel(
    userId: string,
    newLevel: SupportLevel
  ): Promise<boolean> {
    try {
      console.log('[WritingBuddyService] Updating support level:', { userId, newLevel });

      // First, check if preferences exist
      const { data: existingPrefs, error: checkError } = await supabase
        .from('writing_buddy_preferences')
        .select('id, support_level')
        .eq('user_id', userId)
        .maybeSingle();

      console.log('[WritingBuddyService] Check result:', { existingPrefs, checkError });

      if (checkError) {
        console.error('[WritingBuddyService] Error checking preferences:', checkError);
        throw new Error(`Database check failed: ${checkError.message}`);
      }

      if (!existingPrefs) {
        console.log('[WritingBuddyService] Creating new preferences...');
        // Create new preferences with the selected level
        const { data: insertData, error: insertError } = await supabase
          .from('writing_buddy_preferences')
          .insert({
            user_id: userId,
            support_level: newLevel,
            auto_adjust_enabled: true,
            emoji_enabled: true,
            preferred_feedback_style: 'balanced',
          })
          .select()
          .single();

        console.log('[WritingBuddyService] Insert result:', { insertData, insertError });

        if (insertError) {
          console.error('[WritingBuddyService] Error creating preferences:', insertError);
          throw new Error(`Failed to create preferences: ${insertError.message}`);
        }

        console.log('[WritingBuddyService] Successfully created preferences');
        return true;
      }

      // Update existing preferences
      console.log('[WritingBuddyService] Updating existing preferences...');
      const { data: updateData, error: updateError } = await supabase
        .from('writing_buddy_preferences')
        .update({
          previous_support_level: existingPrefs.support_level,
          support_level: newLevel,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .select()
        .single();

      console.log('[WritingBuddyService] Update result:', { updateData, updateError });

      if (updateError) {
        console.error('[WritingBuddyService] Error updating preferences:', updateError);
        throw new Error(`Failed to update preferences: ${updateError.message}`);
      }

      console.log('[WritingBuddyService] Successfully updated preferences');
      return true;
    } catch (error) {
      console.error('[WritingBuddyService] Error in updateSupportLevel:', error);
      return false;
    }
  }

  static async recordFeedbackSession(params: {
    userId: string;
    supportLevel: SupportLevel;
    feedbackType: 'chat' | 'evaluation' | 'suggestion' | 'correction';
    studentText: string;
    feedbackText: string;
    focusArea?: string;
    textType?: string;
    sessionId?: string;
  }): Promise<string | null> {
    try {
      const { data, error } = await supabase.rpc('record_feedback_session', {
        p_user_id: params.userId,
        p_support_level: params.supportLevel,
        p_feedback_type: params.feedbackType,
        p_student_text: params.studentText,
        p_feedback_text: params.feedbackText,
        p_focus_area: params.focusArea || null,
        p_text_type: params.textType || 'narrative',
        p_session_id: params.sessionId || null,
      });

      if (error) {
        console.error('Error recording feedback session:', error);
        return null;
      }

      return data as string;
    } catch (error) {
      console.error('Error in recordFeedbackSession:', error);
      return null;
    }
  }

  static async getFeedbackHistory(
    userId: string,
    limit: number = 20
  ): Promise<TieredFeedback[]> {
    try {
      const { data, error } = await supabase
        .from('tiered_feedback_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching feedback history:', error);
        return [];
      }

      return (data || []) as TieredFeedback[];
    } catch (error) {
      console.error('Error in getFeedbackHistory:', error);
      return [];
    }
  }

  static async getRecommendations(
    userId: string
  ): Promise<SupportLevelRecommendation[]> {
    try {
      const { data, error } = await supabase
        .from('support_level_recommendations')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching recommendations:', error);
        return [];
      }

      return (data || []) as SupportLevelRecommendation[];
    } catch (error) {
      console.error('Error in getRecommendations:', error);
      return [];
    }
  }

  static async calculateRecommendedLevel(userId: string): Promise<SupportLevel> {
    try {
      const { data, error } = await supabase.rpc(
        'calculate_recommended_support_level',
        {
          p_user_id: userId,
        }
      );

      if (error) {
        console.error('Error calculating recommended level:', error);
        return 'Medium Support';
      }

      return (data as SupportLevel) || 'Medium Support';
    } catch (error) {
      console.error('Error in calculateRecommendedLevel:', error);
      return 'Medium Support';
    }
  }

  static async acceptRecommendation(
    recommendationId: string,
    userId: string
  ): Promise<boolean> {
    try {
      const { data: recommendation, error: fetchError } = await supabase
        .from('support_level_recommendations')
        .select('recommended_level')
        .eq('id', recommendationId)
        .eq('user_id', userId)
        .maybeSingle();

      if (fetchError || !recommendation) {
        console.error('Error fetching recommendation:', fetchError);
        return false;
      }

      const updateSuccess = await this.updateSupportLevel(
        userId,
        recommendation.recommended_level as SupportLevel
      );

      if (!updateSuccess) {
        return false;
      }

      const { error: statusError } = await supabase
        .from('support_level_recommendations')
        .update({
          status: 'accepted',
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', recommendationId);

      if (statusError) {
        console.error('Error updating recommendation status:', statusError);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in acceptRecommendation:', error);
      return false;
    }
  }

  static async rejectRecommendation(recommendationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('support_level_recommendations')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', recommendationId);

      if (error) {
        console.error('Error rejecting recommendation:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in rejectRecommendation:', error);
      return false;
    }
  }

  static async rateFeedback(
    feedbackId: string,
    rating: number,
    wasHelpful: boolean
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('tiered_feedback_history')
        .update({
          student_rating: rating,
          was_helpful: wasHelpful,
        })
        .eq('id', feedbackId);

      if (error) {
        console.error('Error rating feedback:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in rateFeedback:', error);
      return false;
    }
  }

  static async updateSkillLevels(
    userId: string,
    skills: {
      grammar?: number;
      vocabulary?: number;
      structure?: number;
      creativity?: number;
    }
  ): Promise<boolean> {
    try {
      const updates: any = { updated_at: new Date().toISOString() };

      if (skills.grammar !== undefined)
        updates.grammar_skill_level = skills.grammar;
      if (skills.vocabulary !== undefined)
        updates.vocabulary_skill_level = skills.vocabulary;
      if (skills.structure !== undefined)
        updates.structure_skill_level = skills.structure;
      if (skills.creativity !== undefined)
        updates.creativity_skill_level = skills.creativity;

      const { error } = await supabase
        .from('writing_buddy_preferences')
        .update(updates)
        .eq('user_id', userId);

      if (error) {
        console.error('Error updating skill levels:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateSkillLevels:', error);
      return false;
    }
  }

  static getSupportLevelDescription(level: SupportLevel): string {
    switch (level) {
      case 'High Support':
        return 'Maximum guidance with templates, direct corrections, and step-by-step help. Perfect for beginners or students who need extra assistance.';
      case 'Medium Support':
        return 'Balanced guidance with targeted suggestions and examples. Ideal for developing writers who want to improve specific skills.';
      case 'Low Support':
        return 'Minimal guidance with advanced prompts and subtle suggestions. Best for confident writers ready for sophisticated challenges.';
      default:
        return '';
    }
  }

  static getSupportLevelColor(level: SupportLevel): string {
    switch (level) {
      case 'High Support':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'Medium Support':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Low Support':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  }
}
