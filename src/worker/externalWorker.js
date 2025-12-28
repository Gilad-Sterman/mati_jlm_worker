import AIWorker from './aiWorker.js';
import HttpService from '../services/httpService.js';

class ExternalWorker extends AIWorker {
  constructor() {
    super();
    this.httpService = new HttpService();
    
    console.log('🌐 External Worker initialized');
    console.log(`📡 Web server URL: ${process.env.WEB_SERVER_URL}`);
  }

  /**
   * Override the sendProgressUpdate method to use HTTP webhooks
   */
  async sendProgressUpdate(userId, eventType, data) {
    try {
      // Send progress update via HTTP webhook to web server
      const success = await this.httpService.sendProgressUpdate(userId, eventType, data);
      
      if (!success) {
        console.warn(`⚠️ Failed to send ${eventType} progress update, but continuing job processing`);
      }
      
      return success;
    } catch (error) {
      console.error(`❌ Error sending progress update for ${eventType}:`, error.message);
      // Don't fail the job if progress update fails
      return false;
    }
  }

  /**
   * Enhanced startup with connection validation
   */
  async start() {
    // Validate environment variables
    this.validateEnvironment();
    
    // Test connection to web server
    const connectionValid = await this.httpService.validateConnection();
    if (!connectionValid) {
      console.error('❌ Cannot connect to web server. Please check WEB_SERVER_URL and ensure web server is running.');
      process.exit(1);
    }
    
    // Call parent start method
    await super.start();
  }

  /**
   * Validate required environment variables
   */
  validateEnvironment() {
    const required = [
      'WEB_SERVER_URL', 
      'WORKER_API_KEY', 
      'SUPABASE_URL', 
      'SUPABASE_SERVICE_KEY',
      'OPENAI_API_KEY'
    ];
    
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
      console.error('Please check your .env file and ensure all required variables are set.');
      process.exit(1);
    }
    
    // Environment variables validated silently
  }

  /**
   * Override job processing to include startup recovery
   */
  async processJobs() {
    // Perform startup recovery for stuck jobs
    await this.startupRecovery();
    
    // Call parent processJobs method
    await super.processJobs();
  }

  /**
   * Startup recovery for jobs that were processing when worker crashed
   */
  async startupRecovery() {
    try {
      const { default: JobService } = await import('../services/jobService.js');
      const stuckJobs = await JobService.getStuckJobs();
      
      if (stuckJobs.length > 0) {
        console.log(`🔧 Resetting ${stuckJobs.length} stuck jobs...`);
        
        for (const job of stuckJobs) {
          try {
            await JobService.resetJobStatus(job.id);
          } catch (error) {
            console.error(`❌ Failed to reset job ${job.id}:`, error.message);
          }
        }
      }
    } catch (error) {
      console.warn('⚠️ Startup recovery failed:', error.message);
      // Don't fail startup if recovery fails
    }
  }

  /**
   * Enhanced memory monitoring with webhook notifications
   */
  checkMemoryUsage() {
    const memUsage = process.memoryUsage();
    const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
    const rssMB = Math.round(memUsage.rss / 1024 / 1024);
    
    // Log memory usage periodically
    if (this.currentJob) {
      console.log(`💾 Worker Memory: ${heapUsedMB}MB used, ${heapTotalMB}MB total, ${rssMB}MB RSS`);
    }
    
    // Trigger cleanup if memory usage is high (conservative for 512MB container)
    const MEMORY_WARNING_THRESHOLD = 150; // 150MB (30% of 512MB)
    const MEMORY_CRITICAL_THRESHOLD = 200; // 200MB (40% of 512MB)
    
    if (heapUsedMB > MEMORY_CRITICAL_THRESHOLD) {
      console.warn(`🚨 CRITICAL: Worker memory usage ${heapUsedMB}MB exceeds ${MEMORY_CRITICAL_THRESHOLD}MB threshold!`);
      
      // Send critical memory warning to web server
      this.sendProgressUpdate('system', 'worker_memory_critical', {
        memoryUsage: heapUsedMB,
        threshold: MEMORY_CRITICAL_THRESHOLD,
        totalMemory: heapTotalMB,
        rss: rssMB
      });
      
      this.forceMemoryCleanup();
    } else if (heapUsedMB > MEMORY_WARNING_THRESHOLD) {
      console.warn(`⚠️ WARNING: Worker memory usage ${heapUsedMB}MB exceeds ${MEMORY_WARNING_THRESHOLD}MB threshold`);
      
      // Send memory warning to web server
      this.sendProgressUpdate('system', 'worker_memory_warning', {
        memoryUsage: heapUsedMB,
        threshold: MEMORY_WARNING_THRESHOLD,
        totalMemory: heapTotalMB,
        rss: rssMB
      });
      
      this.triggerGarbageCollection();
    }
  }

  /**
   * Get enhanced worker status
   */
  getStatus() {
    const baseStatus = super.getStatus();
    
    return {
      ...baseStatus,
      workerType: 'external',
      webServerUrl: process.env.WEB_SERVER_URL,
      connectionStatus: 'connected', // Could be enhanced with actual connection checks
      environment: process.env.NODE_ENV || 'development'
    };
  }
}

export default ExternalWorker;
