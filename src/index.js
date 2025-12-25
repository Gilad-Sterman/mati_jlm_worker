import ExternalWorker from './worker/externalWorker.js';
import { testConnection } from './config/database.js';

/**
 * Main entry point for the external AI worker service
 */
async function startWorker() {
  console.log('🚀 Mati AI Worker Service Starting...');
  console.log(`📅 Started at: ${new Date().toISOString()}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`💾 Node.js Memory Limit: ${process.env.NODE_OPTIONS || 'default'}`);
  
  try {
    // Test database connection first
    console.log('🔗 Testing database connection...');
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('❌ Database connection failed. Exiting...');
      process.exit(1);
    }
    
    // Create and start the external worker
    const worker = new ExternalWorker();
    await worker.start();
    
    console.log('✅ External AI Worker started successfully');
    
    // Handle graceful shutdown
    const gracefulShutdown = (signal) => {
      console.log(`\n📡 Received ${signal}. Starting graceful shutdown...`);
      
      worker.stop();
      
      setTimeout(() => {
        console.log('✅ Worker shutdown complete');
        process.exit(0);
      }, 2000);
    };
    
    // Register shutdown handlers
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('💥 Uncaught Exception:', error);
      console.error('Stack:', error.stack);
      
      // Try to stop worker gracefully
      try {
        worker.stop();
      } catch (stopError) {
        console.error('❌ Error stopping worker:', stopError);
      }
      
      process.exit(1);
    });
    
    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
      
      // Try to stop worker gracefully
      try {
        worker.stop();
      } catch (stopError) {
        console.error('❌ Error stopping worker:', stopError);
      }
      
      process.exit(1);
    });
    
  } catch (error) {
    console.error('💥 Failed to start worker:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Start the worker
startWorker();
