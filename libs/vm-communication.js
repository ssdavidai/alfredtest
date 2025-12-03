/**
 * VM Communication Service
 *
 * Provides secure communication between Alfred Core and user VMs using JWT-based authentication.
 * Each request to a VM is signed with a JWT token containing user identification and action details.
 *
 * Environment Variables:
 * - VM_JWT_SECRET: Secret key for signing JWT tokens (required)
 * - VM_COMMUNICATION_TIMEOUT: Request timeout in milliseconds (default: 10000)
 */

import jwt from "jsonwebtoken";
import User from "@/models/User";
import connectMongo from "./mongoose";

const VM_JWT_SECRET = process.env.VM_JWT_SECRET;
const VM_COMMUNICATION_TIMEOUT = parseInt(process.env.VM_COMMUNICATION_TIMEOUT || "10000");
const VM_DOMAIN = process.env.VM_DOMAIN || "alfredos.site";

/**
 * Sign a JWT token for VM communication
 *
 * @param {string} userId - MongoDB User ID
 * @param {string} vmSubdomain - VM subdomain (e.g., 'cozy-peanut')
 * @param {string} action - Action being performed (e.g., 'skills.list', 'skills.create', 'task.execute')
 * @param {object} options - Additional options
 * @param {number} options.expiresIn - Token expiration in seconds (default: 300 = 5 minutes)
 * @returns {Promise<string>} Signed JWT token
 *
 * @example
 * const token = await signVmRequest('user-123', 'cozy-peanut', 'skills.list');
 */
export async function signVmRequest(userId, vmSubdomain, action, options = {}) {
  if (!VM_JWT_SECRET) {
    throw new Error("VM_JWT_SECRET environment variable is not set");
  }

  if (!userId) {
    throw new Error("userId is required");
  }

  if (!vmSubdomain) {
    throw new Error("vmSubdomain is required");
  }

  if (!action) {
    throw new Error("action is required");
  }

  const expiresIn = options.expiresIn || 300; // Default 5 minutes

  const payload = {
    sub: userId,
    vm: vmSubdomain,
    action: action,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + expiresIn,
  };

  try {
    const token = jwt.sign(payload, VM_JWT_SECRET, {
      algorithm: "HS256",
    });

    return token;
  } catch (error) {
    console.error("Failed to sign VM request:", error);
    throw new Error(`Failed to sign VM request: ${error.message}`);
  }
}

/**
 * Verify a JWT token from a VM response
 *
 * @param {string} token - JWT token to verify
 * @returns {Promise<object>} Decoded token payload
 * @throws {Error} If token is invalid or expired
 *
 * @example
 * try {
 *   const payload = await verifyVmResponse(token);
 *   console.log('User ID:', payload.sub);
 * } catch (error) {
 *   console.error('Invalid token:', error.message);
 * }
 */
export async function verifyVmResponse(token) {
  if (!VM_JWT_SECRET) {
    throw new Error("VM_JWT_SECRET environment variable is not set");
  }

  if (!token) {
    throw new Error("token is required");
  }

  try {
    const decoded = jwt.verify(token, VM_JWT_SECRET, {
      algorithms: ["HS256"],
    });

    return decoded;
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new Error("VM token has expired");
    } else if (error.name === "JsonWebTokenError") {
      throw new Error(`Invalid VM token: ${error.message}`);
    } else {
      throw new Error(`Failed to verify VM token: ${error.message}`);
    }
  }
}

/**
 * Ping a VM to check if it's healthy and responding
 *
 * @param {string} vmUrl - Full VM URL (e.g., 'https://cozy-peanut.alfredos.site')
 * @param {object} options - Additional options
 * @param {number} options.timeout - Request timeout in milliseconds (default: VM_COMMUNICATION_TIMEOUT)
 * @param {string} options.healthPath - Health check endpoint path (default: '/health')
 * @returns {Promise<object>} Health check result
 *
 * @example
 * const result = await pingVm('https://cozy-peanut.alfredos.site');
 * if (result.success) {
 *   console.log('VM is healthy:', result.status);
 * }
 */
export async function pingVm(vmUrl, options = {}) {
  if (!vmUrl) {
    throw new Error("vmUrl is required");
  }

  const timeout = options.timeout || VM_COMMUNICATION_TIMEOUT;
  const healthPath = options.healthPath || "/health";

  // Ensure URL has https protocol
  if (!vmUrl.startsWith("http://") && !vmUrl.startsWith("https://")) {
    vmUrl = `https://${vmUrl}`;
  }

  const fullUrl = `${vmUrl}${healthPath}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const startTime = Date.now();
    const response = await fetch(fullUrl, {
      method: "GET",
      signal: controller.signal,
      headers: {
        "User-Agent": "Alfred-Core/1.0",
      },
    });

    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;

    if (response.ok) {
      const data = await response.json().catch(() => ({}));

      return {
        success: true,
        status: "healthy",
        statusCode: response.status,
        responseTime,
        data,
        timestamp: new Date().toISOString(),
      };
    } else {
      return {
        success: false,
        status: "unhealthy",
        statusCode: response.status,
        responseTime,
        error: `VM returned status ${response.status}`,
        timestamp: new Date().toISOString(),
      };
    }
  } catch (error) {
    if (error.name === "AbortError") {
      return {
        success: false,
        status: "timeout",
        error: `VM health check timed out after ${timeout}ms`,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: false,
      status: "error",
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Send an authenticated request to a user's VM
 *
 * This is the main helper function for VM communication. It:
 * 1. Looks up the user's VM subdomain
 * 2. Creates a signed JWT token
 * 3. Sends the request with proper authentication
 * 4. Handles timeouts and errors
 *
 * @param {object} user - User object or user ID string
 * @param {string} path - API path on the VM (e.g., '/api/skills')
 * @param {string} method - HTTP method (GET, POST, PUT, DELETE, etc.)
 * @param {object} body - Request body (will be JSON stringified)
 * @param {object} options - Additional options
 * @param {number} options.timeout - Request timeout in milliseconds (default: VM_COMMUNICATION_TIMEOUT)
 * @param {string} options.action - Action name for JWT (default: derived from method and path)
 * @param {object} options.headers - Additional headers to send
 * @returns {Promise<object>} Response data and metadata
 *
 * @example
 * // List skills
 * const result = await sendToVm(user, '/api/skills', 'GET');
 * if (result.success) {
 *   console.log('Skills:', result.data);
 * }
 *
 * @example
 * // Create a skill
 * const result = await sendToVm(user, '/api/skills', 'POST', {
 *   name: 'Daily Report',
 *   description: 'Generate daily report',
 *   trigger_type: 'schedule',
 *   steps: [...]
 * });
 */
export async function sendToVm(user, path, method = "GET", body = null, options = {}) {
  try {
    // Extract user ID if user object is passed
    const userId = typeof user === "string" ? user : user._id || user.id;

    if (!userId) {
      throw new Error("Valid user object or user ID is required");
    }

    // Ensure path starts with /
    if (!path.startsWith("/")) {
      path = `/${path}`;
    }

    // Connect to MongoDB and get user details
    await connectMongo();
    const userDoc = await User.findById(userId);

    if (!userDoc) {
      return {
        success: false,
        error: "User not found",
        statusCode: 404,
      };
    }

    // Check if user has a VM
    if (!userDoc.vmSubdomain) {
      return {
        success: false,
        error: "User has no VM provisioned",
        statusCode: 404,
      };
    }

    // Check VM status
    if (userDoc.vmStatus !== "ready") {
      return {
        success: false,
        error: `VM is not ready. Current status: ${userDoc.vmStatus}`,
        statusCode: 503,
      };
    }

    const vmSubdomain = userDoc.vmSubdomain;
    const vmUrl = `https://${vmSubdomain}.${VM_DOMAIN}`;

    // Determine action for JWT
    const action = options.action || `${method.toLowerCase()}:${path}`;

    // Sign the request
    const token = await signVmRequest(userId, vmSubdomain, action, {
      expiresIn: options.expiresIn || 300,
    });

    // Prepare request options
    const timeout = options.timeout || VM_COMMUNICATION_TIMEOUT;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const requestOptions = {
      method,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        "User-Agent": "Alfred-Core/1.0",
        "X-Alfred-User-Id": userId,
        ...options.headers,
      },
    };

    // Add body for POST, PUT, PATCH requests
    if (body && ["POST", "PUT", "PATCH"].includes(method.toUpperCase())) {
      requestOptions.body = JSON.stringify(body);
    }

    const fullUrl = `${vmUrl}${path}`;
    const startTime = Date.now();

    try {
      const response = await fetch(fullUrl, requestOptions);
      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      // Parse response body
      let responseData;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }

      if (response.ok) {
        return {
          success: true,
          data: responseData,
          statusCode: response.status,
          responseTime,
          vmUrl: fullUrl,
        };
      } else {
        return {
          success: false,
          error: responseData?.error || responseData || `VM returned status ${response.status}`,
          data: responseData,
          statusCode: response.status,
          responseTime,
          vmUrl: fullUrl,
        };
      }
    } catch (fetchError) {
      clearTimeout(timeoutId);

      if (fetchError.name === "AbortError") {
        return {
          success: false,
          error: `Request to VM timed out after ${timeout}ms`,
          statusCode: 408,
          vmUrl: fullUrl,
        };
      }

      throw fetchError;
    }
  } catch (error) {
    console.error("Error sending request to VM:", error);
    return {
      success: false,
      error: error.message,
      statusCode: 500,
    };
  }
}

/**
 * Get the full VM URL for a user
 *
 * @param {object|string} user - User object or user ID
 * @returns {Promise<string|null>} VM URL or null if no VM
 *
 * @example
 * const vmUrl = await getVmUrl(userId);
 * console.log(vmUrl); // 'https://cozy-peanut.alfredos.site'
 */
export async function getVmUrl(user) {
  try {
    const userId = typeof user === "string" ? user : user._id || user.id;

    if (!userId) {
      throw new Error("Valid user object or user ID is required");
    }

    await connectMongo();
    const userDoc = await User.findById(userId);

    if (!userDoc || !userDoc.vmSubdomain) {
      return null;
    }

    return `https://${userDoc.vmSubdomain}.${VM_DOMAIN}`;
  } catch (error) {
    console.error("Error getting VM URL:", error);
    return null;
  }
}

/**
 * Check if a user's VM is ready and healthy
 *
 * @param {object|string} user - User object or user ID
 * @returns {Promise<object>} Health status
 *
 * @example
 * const status = await checkVmHealth(userId);
 * if (status.ready) {
 *   console.log('VM is ready and healthy');
 * }
 */
export async function checkVmHealth(user) {
  try {
    const userId = typeof user === "string" ? user : user._id || user.id;

    if (!userId) {
      throw new Error("Valid user object or user ID is required");
    }

    await connectMongo();
    const userDoc = await User.findById(userId);

    if (!userDoc) {
      return {
        ready: false,
        error: "User not found",
      };
    }

    if (!userDoc.vmSubdomain) {
      return {
        ready: false,
        error: "No VM provisioned",
        vmStatus: userDoc.vmStatus || "pending",
      };
    }

    if (userDoc.vmStatus !== "ready") {
      return {
        ready: false,
        error: "VM is not ready",
        vmStatus: userDoc.vmStatus,
        vmSubdomain: userDoc.vmSubdomain,
      };
    }

    // Perform health check
    const vmUrl = `https://${userDoc.vmSubdomain}.${VM_DOMAIN}`;
    const pingResult = await pingVm(vmUrl);

    return {
      ready: pingResult.success,
      healthy: pingResult.success,
      vmStatus: userDoc.vmStatus,
      vmSubdomain: userDoc.vmSubdomain,
      vmUrl,
      ping: pingResult,
    };
  } catch (error) {
    console.error("Error checking VM health:", error);
    return {
      ready: false,
      error: error.message,
    };
  }
}
