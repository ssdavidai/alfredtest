/**
 * Hetzner Cloud API Integration
 * Manages VM provisioning for Alfred instances
 */

const HETZNER_API_BASE = 'https://api.hetzner.cloud/v1';

/**
 * Makes authenticated requests to Hetzner Cloud API
 * @param {string} endpoint - API endpoint
 * @param {object} options - Fetch options
 * @returns {Promise<object>} API response
 */
async function hetznerRequest(endpoint, options = {}) {
  const apiKey = process.env.HETZNER_API_KEY;

  if (!apiKey) {
    throw new Error('HETZNER_API_KEY environment variable is not set');
  }

  const response = await fetch(`${HETZNER_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMessage = data.error?.message || `Hetzner API error: ${response.status}`;
    throw new Error(errorMessage);
  }

  return data;
}

/**
 * Creates a new CX22 server on Hetzner Cloud
 * @param {string} subdomain - Subdomain for the server (used as server name)
 * @param {string} cloudInitScript - Cloud-init script for server initialization
 * @returns {Promise<object>} Created server details including id, ip, and status
 */
async function createServer(subdomain, cloudInitScript) {
  if (!subdomain) {
    throw new Error('Subdomain is required');
  }

  const serverName = `alfred-${subdomain}`;

  const payload = {
    name: serverName,
    server_type: 'cx22',
    image: 'ubuntu-22.04',
    location: 'nbg1', // Nuremberg datacenter
    start_after_create: true,
    user_data: cloudInitScript || '',
    labels: {
      project: 'alfred',
      subdomain: subdomain,
      created_by: 'alfred-provisioning',
    },
  };

  const data = await hetznerRequest('/servers', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return {
    id: data.server.id,
    name: data.server.name,
    ip: data.server.public_net.ipv4.ip,
    status: data.server.status,
    created: data.server.created,
  };
}

/**
 * Deletes a server from Hetzner Cloud
 * @param {number|string} serverId - The Hetzner server ID
 * @returns {Promise<object>} Deletion confirmation
 */
async function deleteServer(serverId) {
  if (!serverId) {
    throw new Error('Server ID is required');
  }

  const data = await hetznerRequest(`/servers/${serverId}`, {
    method: 'DELETE',
  });

  return {
    success: true,
    action: data.action,
  };
}

/**
 * Gets the current status of a server
 * @param {number|string} serverId - The Hetzner server ID
 * @returns {Promise<object>} Server status and details
 */
async function getServerStatus(serverId) {
  if (!serverId) {
    throw new Error('Server ID is required');
  }

  const data = await hetznerRequest(`/servers/${serverId}`, {
    method: 'GET',
  });

  return {
    id: data.server.id,
    name: data.server.name,
    status: data.server.status,
    ip: data.server.public_net?.ipv4?.ip || null,
    created: data.server.created,
    labels: data.server.labels,
  };
}

/**
 * Lists all Alfred servers
 * @returns {Promise<Array>} List of servers with Alfred project label
 */
async function listServers() {
  const data = await hetznerRequest('/servers?label_selector=project=alfred', {
    method: 'GET',
  });

  return data.servers.map(server => ({
    id: server.id,
    name: server.name,
    status: server.status,
    ip: server.public_net?.ipv4?.ip || null,
    subdomain: server.labels?.subdomain || null,
    created: server.created,
  }));
}

module.exports = {
  createServer,
  deleteServer,
  getServerStatus,
  listServers,
};
