/**
 * VM Health Check Cron Endpoint
 *
 * This endpoint is designed to be called by Vercel Cron or external monitoring services
 * to perform periodic health checks on all user VMs.
 *
 * Recommended schedule: Every 5-10 minutes
 *
 * Security:
 * - Should be protected with CRON_SECRET environment variable
 * - Only accepts GET requests
 * - Returns detailed summary of health checks
 *
 * Usage:
 * - Vercel Cron: Configure in vercel.json
 * - External: Call with Authorization header containing CRON_SECRET
 *   Example: curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://yourapp.com/api/cron/health-check
 */

import { NextResponse } from "next/server";
import { checkAllVms } from "@/libs/health-monitor";

/**
 * GET /api/cron/health-check
 *
 * Performs health checks on all VMs with status='ready'
 */
export async function GET(req) {
  const startTime = Date.now();

  try {
    // Verify cron secret for security
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
      const authHeader = req.headers.get("authorization");
      const token = authHeader?.replace("Bearer ", "");

      if (token !== cronSecret) {
        console.warn("Unauthorized health check attempt");
        return NextResponse.json(
          {
            success: false,
            error: "Unauthorized",
          },
          { status: 401 }
        );
      }
    } else {
      console.warn(
        "CRON_SECRET not set - health check endpoint is not protected. " +
        "Set CRON_SECRET environment variable to secure this endpoint."
      );
    }

    console.log("Starting VM health check cron job...");

    // Run health checks on all VMs
    const results = await checkAllVms();

    const duration = Date.now() - startTime;

    // Log summary
    console.log(
      `Health check cron completed in ${duration}ms. ` +
      `Total: ${results.total}, Healthy: ${results.healthy}, ` +
      `Unhealthy: ${results.unhealthy}, Marked as error: ${results.markedAsError}`
    );

    // Return detailed results
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      duration,
      summary: {
        total: results.total,
        healthy: results.healthy,
        unhealthy: results.unhealthy,
        errors: results.errors,
        markedAsError: results.markedAsError,
        message: results.message,
      },
      // Include detailed checks if there are issues
      checks: results.unhealthy > 0 ? results.checks : undefined,
    });
  } catch (error) {
    console.error("Health check cron job failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}

/**
 * POST is not allowed
 */
export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: "Method not allowed. Use GET.",
    },
    { status: 405 }
  );
}
