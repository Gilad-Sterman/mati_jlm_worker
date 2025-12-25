import axios from 'axios';

class HttpService {
  constructor() {
    this.webServerUrl = process.env.WEB_SERVER_URL;
    this.workerApiKey = process.env.WORKER_API_KEY;
    this.timeout = parseInt(process.env.WEBHOOK_TIMEOUT) || 5000;
    this.maxRetries = parseInt(process.env.MAX_RETRIES) || 3;
    
    if (!this.webServerUrl) {
      throw new Error('WEB_SERVER_URL environment variable is required');
    }
    if (!this.workerApiKey) {
      throw new Error('WORKER_API_KEY environment variable is required');
    }
  }

  /**
   * Send progress update to web server via HTTP webhook
   */
  async sendProgressUpdate(userId, eventType, data) {
    let attempt = 0;
    
    while (attempt < this.maxRetries) {
      try {
        const payload = {
          userId,
          sessionId: data.sessionId,
          eventType,
          data,
          workerKey: this.workerApiKey,
          timestamp: new Date().toISOString()
        };

        console.log(`📡 Worker sending ${eventType} to web server (attempt ${attempt + 1}/${this.maxRetries})`);
        
        const response = await axios.post(
          `${this.webServerUrl}/api/worker/progress`,
          payload,
          { 
            timeout: this.timeout,
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'mati-worker/1.0.0'
            }
          }
        );
        
        if (response.status === 200) {
          console.log(`✅ Worker successfully sent ${eventType} to web server`);
          return true;
        } else {
          throw new Error(`Unexpected response status: ${response.status}`);
        }
        
      } catch (error) {
        attempt++;
        const isLastAttempt = attempt >= this.maxRetries;
        
        if (error.code === 'ECONNABORTED') {
          console.warn(`⏰ Worker webhook timeout for ${eventType} (attempt ${attempt}/${this.maxRetries})`);
        } else if (error.response) {
          console.warn(`🚫 Worker webhook HTTP error ${error.response.status} for ${eventType} (attempt ${attempt}/${this.maxRetries}): ${error.response.data?.error || 'Unknown error'}`);
        } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
          console.warn(`🔌 Worker webhook connection error for ${eventType} (attempt ${attempt}/${this.maxRetries}): ${error.message}`);
        } else {
          console.warn(`❌ Worker webhook error for ${eventType} (attempt ${attempt}/${this.maxRetries}): ${error.message}`);
        }
        
        if (isLastAttempt) {
          console.error(`💥 Worker failed to send ${eventType} after ${this.maxRetries} attempts. Job will continue without progress updates.`);
          return false;
        }
        
        // Exponential backoff: 1s, 2s, 4s
        const delayMs = Math.pow(2, attempt - 1) * 1000;
        console.log(`⏳ Worker retrying ${eventType} in ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
    
    return false;
  }

  /**
   * Send health check to web server
   */
  async sendHealthCheck() {
    try {
      const response = await axios.post(
        `${this.webServerUrl}/api/worker/health`,
        {
          workerKey: this.workerApiKey,
          timestamp: new Date().toISOString(),
          status: 'healthy'
        },
        { 
          timeout: this.timeout,
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'mati-worker/1.0.0'
          }
        }
      );
      
      return response.status === 200;
    } catch (error) {
      console.warn(`⚠️ Worker health check failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Validate connection to web server
   */
  async validateConnection() {
    console.log(`🔗 Worker validating connection to ${this.webServerUrl}...`);
    
    try {
      // Try to reach the web server's health endpoint
      const response = await axios.get(`${this.webServerUrl}/api/health`, {
        timeout: this.timeout,
        headers: {
          'User-Agent': 'mati-worker/1.0.0'
        }
      });
      
      if (response.status === 200) {
        console.log('✅ Worker successfully connected to web server');
        return true;
      } else {
        console.warn(`⚠️ Worker received unexpected status from web server: ${response.status}`);
        return false;
      }
    } catch (error) {
      console.error(`❌ Worker cannot connect to web server: ${error.message}`);
      return false;
    }
  }
}

export default HttpService;
