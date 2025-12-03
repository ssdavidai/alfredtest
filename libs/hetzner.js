/**
 * Hetzner Cloud API Integration
 *
 * Provides functions to manage Hetzner Cloud servers for the Alfred platform.
 * Each user gets their own dedicated VM (CX22 instance) with Ubuntu 24.04.
 *
 * API Documentation: https://docs.hetzner.cloud/
 */

const HETZNER_API_BASE = "https://api.hetzner.cloud/v1";
const HETZNER_API_KEY = process.env.HETZNER_API_KEY;

/**
 * Make an authenticated request to the Hetzner Cloud API
 * @param {string} endpoint - API endpoint (e.g., '/servers')
 * @param {string} method - HTTP method
 * @param {object} data - Request body data
 * @returns {Promise<object>} - API response
 */
async function hetznerRequest(endpoint, method = "GET", data = null) {
  if (!HETZNER_API_KEY) {
    throw new Error("HETZNER_API_KEY environment variable is not set");
  }

  const url = `${HETZNER_API_BASE}${endpoint}`;
  const options = {
    method,
    headers: {
      "Authorization": `Bearer ${HETZNER_API_KEY}`,
      "Content-Type": "application/json",
    },
  };

  if (data && (method === "POST" || method === "PUT")) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, options);
    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(
        `Hetzner API error (${response.status}): ${responseData.error?.message || JSON.stringify(responseData)}`
      );
    }

    return responseData;
  } catch (error) {
    console.error("Hetzner API request failed:", error);
    throw error;
  }
}

/**
 * Create a new Hetzner Cloud server
 *
 * @param {string} name - Server name (e.g., 'cozy-peanut')
 * @param {string} userData - Cloud-init script for server initialization
 * @param {object} options - Additional server options
 * @param {string} options.location - Server location (default: 'nbg1' - Nuremberg, Germany)
 * @param {string} options.serverType - Server type (default: 'cx22' - 2 vCPU, 4GB RAM)
 * @param {string} options.image - OS image (default: 'ubuntu-24.04')
 * @param {string[]} options.sshKeys - Array of SSH key names or IDs
 * @param {object} options.labels - Key-value labels for the server
 * @returns {Promise<object>} - Created server details including id, ip, and status
 *
 * @example
 * const server = await createServer('cozy-peanut', cloudInitScript, {
 *   labels: { user_id: 'user-123', environment: 'production' }
 * });
 */
export async function createServer(name, userData, options = {}) {
  try {
    const {
      location = "nbg1",
      serverType = "cx22",
      image = "ubuntu-24.04",
      sshKeys = [],
      labels = {},
    } = options;

    if (!name) {
      throw new Error("Server name is required");
    }

    const requestData = {
      name,
      server_type: serverType,
      image,
      location,
      start_after_create: true,
      labels: {
        ...labels,
        managed_by: "alfred",
        created_at: new Date().toISOString(),
      },
    };

    // Add cloud-init user data if provided
    if (userData) {
      requestData.user_data = userData;
    }

    // Add SSH keys if provided
    if (sshKeys.length > 0) {
      requestData.ssh_keys = sshKeys;
    }

    const response = await hetznerRequest("/servers", "POST", requestData);

    return {
      success: true,
      server: {
        id: response.server.id,
        name: response.server.name,
        status: response.server.status,
        publicIpv4: response.server.public_net.ipv4.ip,
        publicIpv6: response.server.public_net.ipv6.ip,
        serverType: response.server.server_type.name,
        datacenter: response.server.datacenter.name,
        location: response.server.datacenter.location.name,
        created: response.server.created,
      },
      action: {
        id: response.action.id,
        status: response.action.status,
        command: response.action.command,
      },
    };
  } catch (error) {
    console.error("Failed to create Hetzner server:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Delete a Hetzner Cloud server
 *
 * @param {number|string} serverId - Server ID to delete
 * @returns {Promise<object>} - Deletion result
 *
 * @example
 * const result = await deleteServer(12345678);
 */
export async function deleteServer(serverId) {
  try {
    if (!serverId) {
      throw new Error("Server ID is required");
    }

    const response = await hetznerRequest(`/servers/${serverId}`, "DELETE");

    return {
      success: true,
      action: response.action ? {
        id: response.action.id,
        status: response.action.status,
        command: response.action.command,
      } : null,
    };
  } catch (error) {
    console.error("Failed to delete Hetzner server:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get the current status of a Hetzner Cloud server
 *
 * @param {number|string} serverId - Server ID
 * @returns {Promise<object>} - Server status and details
 *
 * @example
 * const status = await getServerStatus(12345678);
 * console.log(status.server.status); // 'running', 'starting', 'stopping', 'off'
 */
export async function getServerStatus(serverId) {
  try {
    if (!serverId) {
      throw new Error("Server ID is required");
    }

    const response = await hetznerRequest(`/servers/${serverId}`, "GET");

    return {
      success: true,
      server: {
        id: response.server.id,
        name: response.server.name,
        status: response.server.status,
        publicIpv4: response.server.public_net.ipv4.ip,
        publicIpv6: response.server.public_net.ipv6.ip,
        serverType: response.server.server_type.name,
        datacenter: response.server.datacenter.name,
        location: response.server.datacenter.location.name,
        created: response.server.created,
        labels: response.server.labels,
        volumes: response.server.volumes,
        locked: response.server.locked,
        backupWindow: response.server.backup_window,
        outgoingTraffic: response.server.outgoing_traffic,
        incomingTraffic: response.server.incoming_traffic,
        includedTraffic: response.server.included_traffic,
      },
    };
  } catch (error) {
    console.error("Failed to get Hetzner server status:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * List all servers (optionally filtered by label)
 *
 * @param {object} filters - Filter options
 * @param {string} filters.labelSelector - Label selector (e.g., 'managed_by=alfred')
 * @returns {Promise<object>} - List of servers
 *
 * @example
 * const servers = await listServers({ labelSelector: 'managed_by=alfred' });
 */
export async function listServers(filters = {}) {
  try {
    let endpoint = "/servers";
    const params = new URLSearchParams();

    if (filters.labelSelector) {
      params.append("label_selector", filters.labelSelector);
    }

    if (params.toString()) {
      endpoint += `?${params.toString()}`;
    }

    const response = await hetznerRequest(endpoint, "GET");

    return {
      success: true,
      servers: response.servers.map(server => ({
        id: server.id,
        name: server.name,
        status: server.status,
        publicIpv4: server.public_net.ipv4.ip,
        serverType: server.server_type.name,
        datacenter: server.datacenter.name,
        created: server.created,
        labels: server.labels,
      })),
      meta: response.meta,
    };
  } catch (error) {
    console.error("Failed to list Hetzner servers:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Power on a server
 *
 * @param {number|string} serverId - Server ID
 * @returns {Promise<object>} - Action result
 */
export async function powerOnServer(serverId) {
  try {
    if (!serverId) {
      throw new Error("Server ID is required");
    }

    const response = await hetznerRequest(
      `/servers/${serverId}/actions/poweron`,
      "POST"
    );

    return {
      success: true,
      action: {
        id: response.action.id,
        status: response.action.status,
        command: response.action.command,
      },
    };
  } catch (error) {
    console.error("Failed to power on Hetzner server:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Power off a server
 *
 * @param {number|string} serverId - Server ID
 * @returns {Promise<object>} - Action result
 */
export async function powerOffServer(serverId) {
  try {
    if (!serverId) {
      throw new Error("Server ID is required");
    }

    const response = await hetznerRequest(
      `/servers/${serverId}/actions/poweroff`,
      "POST"
    );

    return {
      success: true,
      action: {
        id: response.action.id,
        status: response.action.status,
        command: response.action.command,
      },
    };
  } catch (error) {
    console.error("Failed to power off Hetzner server:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Reboot a server
 *
 * @param {number|string} serverId - Server ID
 * @returns {Promise<object>} - Action result
 */
export async function rebootServer(serverId) {
  try {
    if (!serverId) {
      throw new Error("Server ID is required");
    }

    const response = await hetznerRequest(
      `/servers/${serverId}/actions/reboot`,
      "POST"
    );

    return {
      success: true,
      action: {
        id: response.action.id,
        status: response.action.status,
        command: response.action.command,
      },
    };
  } catch (error) {
    console.error("Failed to reboot Hetzner server:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}
