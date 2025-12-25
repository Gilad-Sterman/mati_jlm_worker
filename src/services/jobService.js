import { supabase, supabaseAdmin } from '../config/database.js';

class JobService {
  /**
   * Create a new job in the queue
   */
  static async createJob(jobData) {
    try {
      const {
        session_id,
        type,
        payload = {},
        priority = 0,
        max_attempts = 3,
        scheduled_at = new Date()
      } = jobData;

      const { data, error } = await supabaseAdmin
        .from('jobs')
        .insert([{
          session_id,
          type,
          payload,
          priority,
          max_attempts,
          scheduled_at,
          status: 'pending'
        }])
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create job: ${error.message}`);
      }

      console.log(`✅ Worker created ${type} job for session ${session_id}:`, data.id);
      return data;

    } catch (error) {
      console.error('Worker error creating job:', error);
      throw error;
    }
  }

  /**
   * Get next job from queue (using the database function)
   */
  static async getNextJob() {
    try {
      const { data, error } = await supabaseAdmin
        .rpc('get_next_job');

      if (error) {
        throw new Error(`Failed to get next job: ${error.message}`);
      }

      if (data.length === 0) {
        return null;
      }

      const job = data[0];

      // Fetch additional job details including attempts and max_attempts
      const { data: jobDetails, error: detailsError } = await supabaseAdmin
        .from('jobs')
        .select('attempts, max_attempts, status')
        .eq('id', job.job_id)
        .single();

      if (detailsError) {
        console.error('Worker error fetching job details:', detailsError);
        // Return job without details rather than failing completely
        return job;
      }

      // Merge the details with the job data
      return {
        ...job,
        attempts: jobDetails.attempts,
        max_attempts: jobDetails.max_attempts,
        current_status: jobDetails.status
      };

    } catch (error) {
      console.error('Worker error getting next job:', error);
      throw error;
    }
  }

  /**
   * Update job status and metadata
   */
  static async updateJob(jobId, updates) {
    try {
      const updateData = {
        ...updates,
        updated_at: new Date()
      };

      // If status is changing to 'processing', set started_at
      if (updates.status === 'processing') {
        updateData.started_at = new Date();
      }

      // If status is changing to 'completed' or 'failed', set completed_at
      if (updates.status === 'completed' || updates.status === 'failed') {
        updateData.completed_at = new Date();
      }

      const { data, error } = await supabaseAdmin
        .from('jobs')
        .update(updateData)
        .eq('id', jobId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update job: ${error.message}`);
      }

      return data;

    } catch (error) {
      console.error('Worker error updating job:', error);
      throw error;
    }
  }

  /**
   * Mark job as failed and increment attempts
   */
  static async markJobFailed(jobId, errorMessage, shouldRetry = true) {
    try {
      // First get current job data
      const { data: currentJob, error: fetchError } = await supabaseAdmin
        .from('jobs')
        .select('attempts, max_attempts, status')
        .eq('id', jobId)
        .single();

      if (fetchError) {
        throw new Error(`Failed to fetch job: ${fetchError.message}`);
      }

      // Safety check: if job is already failed or completed, don't process
      if (currentJob.status === 'failed' || currentJob.status === 'completed') {
        console.log(`⚠️ Worker: Job ${jobId} is already ${currentJob.status}, skipping markJobFailed`);
        return currentJob;
      }

      const newAttempts = currentJob.attempts + 1;
      
      // Safety check: hard limit to prevent infinite retries
      const hardLimit = 10;
      const effectiveMaxAttempts = Math.min(currentJob.max_attempts, hardLimit);
      const canRetry = shouldRetry && newAttempts < effectiveMaxAttempts;

      const updateData = {
        attempts: newAttempts,
        error_log: errorMessage,
        status: canRetry ? 'retry' : 'failed',
        completed_at: canRetry ? null : new Date(),
        updated_at: new Date()
      };

      // If retrying, schedule for later (exponential backoff)
      if (canRetry) {
        const delayMinutes = Math.pow(2, newAttempts - 1); // 1, 2, 4 minutes
        updateData.scheduled_at = new Date(Date.now() + delayMinutes * 60 * 1000);
      }

      const { data, error } = await supabaseAdmin
        .from('jobs')
        .update(updateData)
        .eq('id', jobId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to mark job as failed: ${error.message}`);
      }

      const statusMessage = canRetry ? 
        `Will retry in ${Math.pow(2, newAttempts - 1)} minutes` : 
        `Max attempts reached (${newAttempts}/${effectiveMaxAttempts})`;
      
      console.log(`❌ Worker: Job ${jobId} failed (attempt ${newAttempts}/${effectiveMaxAttempts}). ${statusMessage}`);
      return data;

    } catch (error) {
      console.error('Worker error marking job as failed:', error);
      throw error;
    }
  }

  /**
   * Get jobs that are stuck in processing state (for recovery)
   */
  static async getStuckJobs() {
    try {
      // Jobs that have been processing for more than 30 minutes
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
      
      const { data, error } = await supabaseAdmin
        .from('jobs')
        .select('*')
        .eq('status', 'processing')
        .lt('started_at', thirtyMinutesAgo.toISOString());

      if (error) {
        throw new Error(`Failed to get stuck jobs: ${error.message}`);
      }

      return data || [];

    } catch (error) {
      console.error('Worker error getting stuck jobs:', error);
      return [];
    }
  }

  /**
   * Reset job status from processing to pending (for recovery)
   */
  static async resetJobStatus(jobId) {
    try {
      const { data, error } = await supabaseAdmin
        .from('jobs')
        .update({
          status: 'pending',
          started_at: null,
          updated_at: new Date()
        })
        .eq('id', jobId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to reset job status: ${error.message}`);
      }

      console.log(`🔄 Worker: Reset job ${jobId} from processing to pending`);
      return data;

    } catch (error) {
      console.error('Worker error resetting job status:', error);
      throw error;
    }
  }

  /**
   * Get jobs for a specific session
   */
  static async getJobsForSession(sessionId) {
    try {
      const { data, error } = await supabaseAdmin
        .from('jobs')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to get jobs for session: ${error.message}`);
      }

      return data;

    } catch (error) {
      console.error('Worker error getting jobs for session:', error);
      throw error;
    }
  }
}

export default JobService;
