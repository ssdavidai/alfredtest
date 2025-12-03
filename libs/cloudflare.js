/**
 * Cloudflare API Integration
 *
 * Provides functions to manage DNS records for Alfred user subdomains.
 * Each user gets a unique subdomain under alfredos.site (e.g., cozy-peanut.alfredos.site).
 *
 * API Documentation: https://developers.cloudflare.com/api/
 */

const CLOUDFLARE_API_BASE = "https://api.cloudflare.com/client/v4";
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CLOUDFLARE_ZONE_ID = process.env.CLOUDFLARE_ZONE_ID;
const BASE_DOMAIN = "alfredos.site";

/**
 * Make an authenticated request to the Cloudflare API
 * @param {string} endpoint - API endpoint (e.g., '/zones/xxx/dns_records')
 * @param {string} method - HTTP method
 * @param {object} data - Request body data
 * @returns {Promise<object>} - API response
 */
async function cloudflareRequest(endpoint, method = "GET", data = null) {
  if (!CLOUDFLARE_API_TOKEN) {
    throw new Error("CLOUDFLARE_API_TOKEN environment variable is not set");
  }

  const url = `${CLOUDFLARE_API_BASE}${endpoint}`;
  const options = {
    method,
    headers: {
      "Authorization": `Bearer ${CLOUDFLARE_API_TOKEN}`,
      "Content-Type": "application/json",
    },
  };

  if (data && (method === "POST" || method === "PUT" || method === "PATCH")) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, options);
    const responseData = await response.json();

    if (!responseData.success) {
      const errorMessage = responseData.errors?.[0]?.message || "Unknown error";
      throw new Error(
        `Cloudflare API error: ${errorMessage} (${JSON.stringify(responseData.errors)})`
      );
    }

    return responseData;
  } catch (error) {
    console.error("Cloudflare API request failed:", error);
    throw error;
  }
}

/**
 * Get the Zone ID for the base domain
 * This is useful for validating the zone or if CLOUDFLARE_ZONE_ID is not set
 *
 * @returns {Promise<string>} - Zone ID
 */
async function getZoneId() {
  if (CLOUDFLARE_ZONE_ID) {
    return CLOUDFLARE_ZONE_ID;
  }

  try {
    const response = await cloudflareRequest(
      `/zones?name=${BASE_DOMAIN}`,
      "GET"
    );

    if (!response.result || response.result.length === 0) {
      throw new Error(`Zone not found for domain: ${BASE_DOMAIN}`);
    }

    return response.result[0].id;
  } catch (error) {
    console.error("Failed to get Cloudflare zone ID:", error);
    throw error;
  }
}

/**
 * Create a DNS A record for a subdomain
 *
 * @param {string} subdomain - Subdomain name (e.g., 'cozy-peanut')
 * @param {string} ip - IPv4 address to point to
 * @param {object} options - Additional DNS record options
 * @param {boolean} options.proxied - Whether to proxy through Cloudflare (default: true)
 * @param {number} options.ttl - TTL in seconds (1 = automatic, default: 1)
 * @param {string} options.comment - Comment for the DNS record
 * @returns {Promise<object>} - Created DNS record details
 *
 * @example
 * const record = await createDnsRecord('cozy-peanut', '192.168.1.1', {
 *   comment: 'Alfred VM for user-123'
 * });
 */
export async function createDnsRecord(subdomain, ip, options = {}) {
  try {
    if (!subdomain) {
      throw new Error("Subdomain is required");
    }

    if (!ip) {
      throw new Error("IP address is required");
    }

    // Validate IPv4 format
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipv4Regex.test(ip)) {
      throw new Error("Invalid IPv4 address format");
    }

    const {
      proxied = true,
      ttl = 1,
      comment = "",
    } = options;

    const zoneId = await getZoneId();
    const fullDomain = `${subdomain}.${BASE_DOMAIN}`;

    const requestData = {
      type: "A",
      name: fullDomain,
      content: ip,
      ttl,
      proxied,
    };

    if (comment) {
      requestData.comment = comment;
    }

    const response = await cloudflareRequest(
      `/zones/${zoneId}/dns_records`,
      "POST",
      requestData
    );

    return {
      success: true,
      record: {
        id: response.result.id,
        name: response.result.name,
        type: response.result.type,
        content: response.result.content,
        proxied: response.result.proxied,
        ttl: response.result.ttl,
        createdOn: response.result.created_on,
        modifiedOn: response.result.modified_on,
        comment: response.result.comment,
      },
    };
  } catch (error) {
    console.error("Failed to create Cloudflare DNS record:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Delete a DNS record by ID
 *
 * @param {string} recordId - DNS record ID to delete
 * @returns {Promise<object>} - Deletion result
 *
 * @example
 * const result = await deleteDnsRecord('abc123def456');
 */
export async function deleteDnsRecord(recordId) {
  try {
    if (!recordId) {
      throw new Error("DNS record ID is required");
    }

    const zoneId = await getZoneId();

    await cloudflareRequest(
      `/zones/${zoneId}/dns_records/${recordId}`,
      "DELETE"
    );

    return {
      success: true,
      recordId,
    };
  } catch (error) {
    console.error("Failed to delete Cloudflare DNS record:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get DNS record details by subdomain
 *
 * @param {string} subdomain - Subdomain name (e.g., 'cozy-peanut')
 * @returns {Promise<object>} - DNS record details
 *
 * @example
 * const record = await getDnsRecord('cozy-peanut');
 */
export async function getDnsRecord(subdomain) {
  try {
    if (!subdomain) {
      throw new Error("Subdomain is required");
    }

    const zoneId = await getZoneId();
    const fullDomain = `${subdomain}.${BASE_DOMAIN}`;

    const response = await cloudflareRequest(
      `/zones/${zoneId}/dns_records?name=${fullDomain}`,
      "GET"
    );

    if (!response.result || response.result.length === 0) {
      return {
        success: false,
        error: "DNS record not found",
      };
    }

    // Return the first matching record (typically there should only be one)
    const record = response.result[0];

    return {
      success: true,
      record: {
        id: record.id,
        name: record.name,
        type: record.type,
        content: record.content,
        proxied: record.proxied,
        ttl: record.ttl,
        createdOn: record.created_on,
        modifiedOn: record.modified_on,
        comment: record.comment,
      },
    };
  } catch (error) {
    console.error("Failed to get Cloudflare DNS record:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Update a DNS record (change IP address or other properties)
 *
 * @param {string} recordId - DNS record ID
 * @param {object} updates - Properties to update
 * @param {string} updates.ip - New IP address
 * @param {boolean} updates.proxied - Whether to proxy through Cloudflare
 * @param {number} updates.ttl - TTL in seconds
 * @param {string} updates.comment - Comment for the record
 * @returns {Promise<object>} - Updated DNS record details
 *
 * @example
 * const updated = await updateDnsRecord('abc123', { ip: '192.168.1.2' });
 */
export async function updateDnsRecord(recordId, updates) {
  try {
    if (!recordId) {
      throw new Error("DNS record ID is required");
    }

    if (!updates || Object.keys(updates).length === 0) {
      throw new Error("No updates provided");
    }

    const zoneId = await getZoneId();

    // First, get the current record to preserve fields we're not updating
    const currentResponse = await cloudflareRequest(
      `/zones/${zoneId}/dns_records/${recordId}`,
      "GET"
    );

    const currentRecord = currentResponse.result;

    const requestData = {
      type: currentRecord.type,
      name: currentRecord.name,
      content: updates.ip || currentRecord.content,
      ttl: updates.ttl !== undefined ? updates.ttl : currentRecord.ttl,
      proxied: updates.proxied !== undefined ? updates.proxied : currentRecord.proxied,
    };

    if (updates.comment !== undefined) {
      requestData.comment = updates.comment;
    }

    const response = await cloudflareRequest(
      `/zones/${zoneId}/dns_records/${recordId}`,
      "PUT",
      requestData
    );

    return {
      success: true,
      record: {
        id: response.result.id,
        name: response.result.name,
        type: response.result.type,
        content: response.result.content,
        proxied: response.result.proxied,
        ttl: response.result.ttl,
        modifiedOn: response.result.modified_on,
        comment: response.result.comment,
      },
    };
  } catch (error) {
    console.error("Failed to update Cloudflare DNS record:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * List all DNS records for the zone
 *
 * @param {object} filters - Filter options
 * @param {string} filters.type - Record type (e.g., 'A', 'CNAME')
 * @param {string} filters.name - Record name
 * @returns {Promise<object>} - List of DNS records
 *
 * @example
 * const records = await listDnsRecords({ type: 'A' });
 */
export async function listDnsRecords(filters = {}) {
  try {
    const zoneId = await getZoneId();

    const params = new URLSearchParams();
    if (filters.type) {
      params.append("type", filters.type);
    }
    if (filters.name) {
      params.append("name", filters.name);
    }

    const endpoint = `/zones/${zoneId}/dns_records${params.toString() ? `?${params.toString()}` : ""}`;
    const response = await cloudflareRequest(endpoint, "GET");

    return {
      success: true,
      records: response.result.map(record => ({
        id: record.id,
        name: record.name,
        type: record.type,
        content: record.content,
        proxied: record.proxied,
        ttl: record.ttl,
        createdOn: record.created_on,
        modifiedOn: record.modified_on,
      })),
      meta: response.result_info,
    };
  } catch (error) {
    console.error("Failed to list Cloudflare DNS records:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Check if a subdomain is available (not already taken)
 *
 * @param {string} subdomain - Subdomain to check
 * @returns {Promise<boolean>} - True if available, false if taken
 *
 * @example
 * const available = await isSubdomainAvailable('cozy-peanut');
 */
export async function isSubdomainAvailable(subdomain) {
  try {
    const result = await getDnsRecord(subdomain);
    return !result.success; // Available if record doesn't exist
  } catch (error) {
    console.error("Failed to check subdomain availability:", error);
    return false;
  }
}

/**
 * Delete DNS record by subdomain name
 *
 * @param {string} subdomain - Subdomain name
 * @returns {Promise<object>} - Deletion result
 *
 * @example
 * const result = await deleteDnsRecordBySubdomain('cozy-peanut');
 */
export async function deleteDnsRecordBySubdomain(subdomain) {
  try {
    const recordResult = await getDnsRecord(subdomain);

    if (!recordResult.success) {
      return {
        success: false,
        error: "DNS record not found",
      };
    }

    return await deleteDnsRecord(recordResult.record.id);
  } catch (error) {
    console.error("Failed to delete DNS record by subdomain:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}
