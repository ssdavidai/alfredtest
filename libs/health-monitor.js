/**
 * VM Health Monitoring Service
 *
 * Provides health monitoring capabilities for user VMs, including:
 * - Individual VM health checks
 * - Batch health checks for all VMs with status='ready'
 * - Consecutive failure tracking
 * - Automatic status updates based on health check results
 *
 * Environment Variables:
 * - VM_HEALTH_CHECK_TIMEOUT: Health check timeout in milliseconds (default: 10000)
 * - VM_HEALTH_MAX_FAILURES: Max consecutive failures before marking as 'error' (default: 3)
 */

import { checkVmHealth as checkSingleVmHealth } from "./vm-communication";
import User from "@/models/User";
import connectMongo from "./mongoose";

const VM_HEALTH_CHECK_TIMEOUT = parseInt(process.env.VM_HEALTH_CHECK_TIMEOUT || "10000");
const VM_HEALTH_MAX_FAILURES = parseInt(process.env.VM_HEALTH_MAX_FAILURES || "3");

/**
 * In-memory store for consecutive failure counts
 * Structure: { userId: { count: number, lastCheck: Date } }
 * This will reset on server restart, which is acceptable for this use case
 */
const failureTracker = new Map();

/**
 * Get consecutive failure count for a user
 * @param {string} userId - User ID
 * @returns {number} Consecutive failure count
 */
function getFailureCount(userId) {
  const tracker = failureTracker.get(userId);
  return tracker ? tracker.count : 0;
}

/**
 * Increment failure count for a user
 * @param {string} userId - User ID
 * @returns {number} New failure count
 */
function incrementFailureCount(userId) {
  const tracker = failureTracker.get(userId) || { count: 0, lastCheck: null };
  tracker.count += 1;
  tracker.lastCheck = new Date();
  failureTracker.set(userId, tracker);
  return tracker.count;
}

/**
 * Reset failure count for a user
 * @param {string} userId - User ID
 */
function resetFailureCount(userId) {
  failureTracker.delete(userId);
}

/**
 * Check VM health for a specific user
 *
 * This function:
 * 1. Checks the VM's health endpoint
 * 2. Tracks consecutive failures
 * 3. Updates user's vmStatus to 'error' after MAX_FAILURES consecutive failures
 * 4. Resets failure count on successful check
 *
 * @param {object|string} user - User object or user ID
 * @returns {Promise<object>} Health check result with failure tracking
 *
 * @example
 * const result = await checkVmHealth(userId);
 * if (result.healthy) {
 *   console.log('VM is healthy');
 * } else {
 *   console.log(`VM check failed. Consecutive failures: ${result.consecutiveFailures}`);
 * }
 */
export async function checkVmHealth(user) {
  try {
    const userId = typeof user === "string" ? user : user._id?.toString() || user.id;

    if (!userId) {
      throw new Error("Valid user object or user ID is required");
    }

    await connectMongo();
    const userDoc = await User.findById(userId);

    if (!userDoc) {
      return {
        success: false,
        healthy: false,
        error: "User not found",
        userId,
      };
    }

    // Only check VMs with status 'ready'
    if (userDoc.vmStatus !== "ready") {
      return {
        success: false,
        healthy: false,
        error: `VM status is '${userDoc.vmStatus}', not 'ready'`,
        userId,
        vmStatus: userDoc.vmStatus,
        skipped: true,
      };
    }

    // Perform health check with timeout
    const healthResult = await checkSingleVmHealth(userId);

    const consecutiveFailures = getFailureCount(userId);

    if (healthResult.healthy) {
      // Health check succeeded - reset failure count
      resetFailureCount(userId);

      return {
        success: true,
        healthy: true,
        userId,
        vmSubdomain: userDoc.vmSubdomain,
        vmUrl: healthResult.vmUrl,
        ping: healthResult.ping,
        consecutiveFailures: 0,
        message: "VM is healthy",
      };
    } else {
      // Health check failed - increment failure count
      const newFailureCount = incrementFailureCount(userId);

      console.warn(
        `VM health check failed for user ${userId} (${userDoc.vmSubdomain}). ` +
        `Consecutive failures: ${newFailureCount}/${VM_HEALTH_MAX_FAILURES}`
      );

      // Check if we've reached the failure threshold
      if (newFailureCount >= VM_HEALTH_MAX_FAILURES) {
        console.error(
          `VM for user ${userId} has failed ${newFailureCount} consecutive health checks. ` +
          `Marking as 'error'.`
        );

        // Update VM status to 'error'
        await updateVmStatus(userId, "error");

        // Reset failure count after marking as error
        resetFailureCount(userId);

        return {
          success: false,
          healthy: false,
          userId,
          vmSubdomain: userDoc.vmSubdomain,
          vmStatus: "error",
          consecutiveFailures: newFailureCount,
          statusUpdated: true,
          error: healthResult.error || "VM health check failed",
          message: `VM marked as 'error' after ${newFailureCount} consecutive failures`,
        };
      }

      return {
        success: false,
        healthy: false,
        userId,
        vmSubdomain: userDoc.vmSubdomain,
        vmStatus: userDoc.vmStatus,
        consecutiveFailures: newFailureCount,
        statusUpdated: false,
        error: healthResult.error || "VM health check failed",
        message: `VM health check failed (${newFailureCount}/${VM_HEALTH_MAX_FAILURES})`,
      };
    }
  } catch (error) {
    console.error("Error checking VM health:", error);
    return {
      success: false,
      healthy: false,
      error: error.message,
      userId: typeof user === "string" ? user : user?._id?.toString() || user?.id,
    };
  }
}

/**
 * Update VM status for a user
 *
 * @param {string} userId - User ID
 * @param {string} status - New status ('pending', 'provisioning', 'ready', 'error', 'deprovisioned')
 * @returns {Promise<object>} Update result
 *
 * @example
 * await updateVmStatus(userId, 'error');
 */
export async function updateVmStatus(userId, status) {
  try {
    if (!userId) {
      throw new Error("userId is required");
    }

    if (!status) {
      throw new Error("status is required");
    }

    // Validate status
    const validStatuses = ["pending", "provisioning", "ready", "error", "deprovisioned"];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status: ${status}. Must be one of: ${validStatuses.join(", ")}`);
    }

    await connectMongo();

    const result = await User.findByIdAndUpdate(
      userId,
      { vmStatus: status },
      { new: true }
    );

    if (!result) {
      return {
        success: false,
        error: "User not found",
      };
    }

    console.log(`Updated VM status for user ${userId}: ${status}`);

    return {
      success: true,
      userId,
      vmStatus: status,
      vmSubdomain: result.vmSubdomain,
    };
  } catch (error) {
    console.error("Error updating VM status:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Check health of all VMs with status='ready'
 *
 * This function:
 * 1. Queries all users with vmStatus='ready'
 * 2. Checks each VM's health sequentially (to avoid overwhelming VMs)
 * 3. Returns a summary of results
 *
 * @returns {Promise<object>} Summary of health check results
 *
 * @example
 * const summary = await checkAllVms();
 * console.log(`Checked ${summary.total} VMs: ${summary.healthy} healthy, ${summary.unhealthy} unhealthy`);
 */
export async function checkAllVms() {
  const startTime = Date.now();
  const results = {
    total: 0,
    healthy: 0,
    unhealthy: 0,
    errors: 0,
    markedAsError: 0,
    checks: [],
  };

  try {
    await connectMongo();

    // Find all users with VMs in 'ready' state
    const users = await User.find({ vmStatus: "ready" }).select(
      "_id vmSubdomain vmStatus vmIp"
    );

    results.total = users.length;

    if (users.length === 0) {
      console.log("No VMs with status='ready' found");
      return {
        ...results,
        duration: Date.now() - startTime,
        message: "No VMs to check",
      };
    }

    console.log(`Starting health checks for ${users.length} VMs...`);

    // Check each VM sequentially to avoid overwhelming the VMs
    for (const user of users) {
      try {
        const checkResult = await checkVmHealth(user._id.toString());

        // Track results
        if (checkResult.healthy) {
          results.healthy++;
        } else {
          results.unhealthy++;
          if (checkResult.statusUpdated) {
            results.markedAsError++;
          }
        }

        // Add to detailed results
        results.checks.push({
          userId: user._id.toString(),
          vmSubdomain: user.vmSubdomain,
          healthy: checkResult.healthy,
          consecutiveFailures: checkResult.consecutiveFailures,
          statusUpdated: checkResult.statusUpdated,
          error: checkResult.error,
        });

        // Small delay between checks to avoid overwhelming the system
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Failed to check VM for user ${user._id}:`, error);
        results.errors++;
        results.checks.push({
          userId: user._id.toString(),
          vmSubdomain: user.vmSubdomain,
          healthy: false,
          error: error.message,
        });
      }
    }

    const duration = Date.now() - startTime;
    console.log(
      `Health check completed in ${duration}ms. ` +
      `Healthy: ${results.healthy}, Unhealthy: ${results.unhealthy}, ` +
      `Marked as error: ${results.markedAsError}`
    );

    return {
      ...results,
      duration,
      message: `Checked ${results.total} VMs: ${results.healthy} healthy, ${results.unhealthy} unhealthy`,
    };
  } catch (error) {
    console.error("Error checking all VMs:", error);
    return {
      ...results,
      success: false,
      error: error.message,
      duration: Date.now() - startTime,
    };
  }
}

/**
 * Get failure statistics for all tracked VMs
 * Useful for debugging and monitoring
 *
 * @returns {Array} Array of failure statistics
 */
export function getFailureStats() {
  const stats = [];
  for (const [userId, tracker] of failureTracker.entries()) {
    stats.push({
      userId,
      consecutiveFailures: tracker.count,
      lastCheck: tracker.lastCheck,
    });
  }
  return stats;
}

/**
 * Clear all failure tracking data
 * Use with caution - mainly for testing or manual intervention
 */
export function clearFailureTracking() {
  const count = failureTracker.size;
  failureTracker.clear();
  console.log(`Cleared failure tracking for ${count} users`);
  return { cleared: count };
}
