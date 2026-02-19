const app = require('./app');
const config = require('./config/env');
const { testConnection } = require('./config/database');
const { testEmailConnection } = require('./config/email');

const PORT = config.port;

// Start server
const startServer = async () => {
  try {
    // Test database connection
    console.log('🔍 Testing database connection...');
    await testConnection();
    
    // Test email connection (optional - won't stop server if fails)
    console.log('🔍 Testing email service...');
    await testEmailConnection();
    
    // Start listening
    app.listen(PORT, () => {
      console.log('');
      console.log('╔══════════════════════════════════════════════════════════╗');
      console.log('║                                                          ║');
      console.log('║   🚀 Company Rating System API Server                   ║');
      console.log('║                                                          ║');
      console.log(`║   ✅ Server running on port ${PORT}                         ║`);
      console.log(`║   ✅ Environment: ${config.nodeEnv.padEnd(39)} ║`);
      console.log(`║   ✅ API Base URL: http://localhost:${PORT}/api             ║`);
      console.log('║                                                          ║');
      console.log('║   📖 Available endpoints:                                ║');
      console.log(`║      GET  http://localhost:${PORT}/health                   ║`);
      console.log(`║      POST http://localhost:${PORT}/api/auth/register        ║`);
      console.log(`║      POST http://localhost:${PORT}/api/auth/login           ║`);
      console.log('║                                                          ║');
      console.log('╚══════════════════════════════════════════════════════════╝');
      console.log('');
      console.log('💡 Press Ctrl+C to stop the server');
      console.log('');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err);
  process.exit(1);
});

// Start the server
startServer();
