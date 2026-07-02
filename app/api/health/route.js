import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

/**
 * Health Check Endpoint
 * 
 * Used by Render (and other platforms) to:
 * - Monitor uptime
 * - Health probe for load balancers
 * - Incident detection
 * 
 * Configure in Render: Health Check Path = /api/health
 */
export async function GET() {
    try {
        // Check database connectivity with timeout
        const startTime = Date.now();
        await pool.query('SELECT 1');
        const dbLatency = Date.now() - startTime;

        return NextResponse.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            services: {
                api: 'operational',
                database: 'connected',
                dbLatency: `${dbLatency}ms`
            },
            uptime: process.uptime()
        });
    } catch (error) {
        console.error('Health check failed:', error);

        return NextResponse.json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: error.message,
            services: {
                api: 'operational',
                database: 'disconnected'
            }
        }, { status: 503 });  // Service Unavailable
    }
}
