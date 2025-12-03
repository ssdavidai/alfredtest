/**
 * Cloudflare DNS Integration
 * Manages DNS records for Alfred subdomains on alfredos.site
 */

const CLOUDFLARE_API_BASE = 'https://api.cloudflare.com/client/v4';
const ZONE_NAME = 'alfredos.site';

// Cache for zone ID to avoid repeated lookups
let cachedZoneId = null;

/**
 * Makes authenticated requests to Cloudflare API
 * @param {string} endpoint - API endpoint
 * @param {object} options - Fetch options
 * @returns {Promise<object>} API response
 */
async function cloudflareRequest(endpoint, options = {}) {
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!apiToken) {
    throw new Error('CLOUDFLARE_API_TOKEN environment variable is not set');
  }

  const response = await fetch(`${CLOUDFLARE_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!data.success) {
    const errors = data.errors?.map(e => e.message).join(', ') || 'Unknown error';
    throw new Error(`Cloudflare API error: ${errors}`);
  }

  return data;
}

/**
 * Gets the zone ID for alfredos.site
 * @returns {Promise<string>} Zone ID
 */
async function getZoneId() {
  if (cachedZoneId) {
    return cachedZoneId;
  }

  const data = await cloudflareRequest(`/zones?name=${ZONE_NAME}`, {
    method: 'GET',
  });

  if (!data.result || data.result.length === 0) {
    throw new Error(`Zone not found: ${ZONE_NAME}`);
  }

  cachedZoneId = data.result[0].id;
  return cachedZoneId;
}

/**
 * Creates an A record for a subdomain pointing to the specified IP
 * @param {string} subdomain - Subdomain name (without .alfredos.site)
 * @param {string} ip - IPv4 address to point the record to
 * @returns {Promise<object>} Created DNS record details
 */
async function createDnsRecord(subdomain, ip) {
  if (!subdomain) {
    throw new Error('Subdomain is required');
  }

  if (!ip || !/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ip)) {
    throw new Error('Valid IPv4 address is required');
  }

  const zoneId = await getZoneId();
  const fullName = `${subdomain}.${ZONE_NAME}`;

  const payload = {
    type: 'A',
    name: fullName,
    content: ip,
    ttl: 300, // 5 minutes for faster propagation during provisioning
    proxied: false, // Direct connection for SSH and other services
    comment: 'Created by Alfred provisioning',
  };

  const data = await cloudflareRequest(`/zones/${zoneId}/dns_records`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return {
    id: data.result.id,
    name: data.result.name,
    type: data.result.type,
    content: data.result.content,
    ttl: data.result.ttl,
    proxied: data.result.proxied,
    created: data.result.created_on,
  };
}

/**
 * Deletes a DNS record by its ID
 * @param {string} recordId - Cloudflare DNS record ID
 * @returns {Promise<object>} Deletion confirmation
 */
async function deleteDnsRecord(recordId) {
  if (!recordId) {
    throw new Error('Record ID is required');
  }

  const zoneId = await getZoneId();

  await cloudflareRequest(`/zones/${zoneId}/dns_records/${recordId}`, {
    method: 'DELETE',
  });

  return {
    success: true,
    deletedRecordId: recordId,
  };
}

/**
 * Gets a DNS record by subdomain name
 * @param {string} subdomain - Subdomain name (without .alfredos.site)
 * @returns {Promise<object|null>} DNS record details or null if not found
 */
async function getDnsRecord(subdomain) {
  if (!subdomain) {
    throw new Error('Subdomain is required');
  }

  const zoneId = await getZoneId();
  const fullName = `${subdomain}.${ZONE_NAME}`;

  const data = await cloudflareRequest(
    `/zones/${zoneId}/dns_records?type=A&name=${fullName}`,
    { method: 'GET' }
  );

  if (!data.result || data.result.length === 0) {
    return null;
  }

  const record = data.result[0];
  return {
    id: record.id,
    name: record.name,
    type: record.type,
    content: record.content,
    ttl: record.ttl,
    proxied: record.proxied,
  };
}

/**
 * Lists all A records for alfredos.site
 * @returns {Promise<Array>} List of DNS A records
 */
async function listDnsRecords() {
  const zoneId = await getZoneId();

  const data = await cloudflareRequest(
    `/zones/${zoneId}/dns_records?type=A`,
    { method: 'GET' }
  );

  return data.result.map(record => ({
    id: record.id,
    name: record.name,
    content: record.content,
    ttl: record.ttl,
    proxied: record.proxied,
  }));
}

module.exports = {
  createDnsRecord,
  deleteDnsRecord,
  getDnsRecord,
  listDnsRecords,
};
