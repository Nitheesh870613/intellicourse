/**
 * Process-level error handlers for production
 * Prevents silent crashes and ensures proper logging
 */

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('🔴 Unhandled Rejection at:', promise);
    console.error('Reason:', reason);
    // Log to external service in production (e.g., Sentry)
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('🔴 Uncaught Exception:', error);
    console.error('Stack:', error.stack);

    // Exit process to let Render restart the service
    // This ensures the app recovers from fatal errors
    process.exit(1);
});

// Graceful shutdown handler
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    process.exit(0);
});

console.log('✅ Process-level error handlers initialized');
