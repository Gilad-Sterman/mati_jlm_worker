import { supabase, supabaseAdmin } from '../config/database.js';

class SessionService {
  /**
   * Get session by ID (worker needs this for job processing)
   */
  static async getSessionById(sessionId, userId = null, userRole = 'admin') {
    try {
      const client = supabaseAdmin || supabase;

      const { data: session, error } = await client
        .from('sessions')
        .select(`
          id, client_id, adviser_id, title, file_url, file_name, 
          file_size, file_type, duration, status, created_at, updated_at,
          transcription_text, transcription_metadata, processing_metadata,
          client:clients(id, name, email, phone, metadata),
          adviser:users(id, name, email, phone)
        `)
        .eq('id', sessionId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('Session not found');
        }
        throw error;
      }

      return session;

    } catch (error) {
      throw new Error(error.message || 'Failed to get session');
    }
  }

  /**
   * Update session (worker needs this for status updates)
   */
  static async updateSession(sessionId, updates, userId = null, userRole = 'admin') {
    try {
      const client = supabaseAdmin || supabase;

      // Prepare update fields
      const updateFields = {
        updated_at: new Date()
      };

      // Add valid fields from updates
      const validFields = [
        'status', 'transcription_text', 'transcription_metadata', 
        'processing_metadata', 'file_url', 'duration'
      ];

      validFields.forEach(field => {
        if (updates[field] !== undefined) {
          updateFields[field] = updates[field];
        }
      });

      if (Object.keys(updateFields).length === 1) { // Only updated_at
        throw new Error('No valid fields to update');
      }

      const { data: updatedSession, error } = await client
        .from('sessions')
        .update(updateFields)
        .eq('id', sessionId)
        .select(`
          id, client_id, adviser_id, title, file_url, file_name, 
          file_size, file_type, duration, status, created_at, updated_at,
          transcription_text, transcription_metadata, processing_metadata,
          client:clients(id, name, email, phone, metadata),
          adviser:users(id, name, email, phone)
        `)
        .single();

      if (error) throw error;

      // Session updated silently
      return updatedSession;

    } catch (error) {
      console.error('Worker error updating session:', error);
      throw new Error(error.message || 'Failed to update session');
    }
  }
}

export default SessionService;
