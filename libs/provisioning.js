/**
 * VM Provisioning Orchestrator
 * Handles the full provisioning flow for Alfred VMs
 */

import { generateCloudInit } from "./cloudinit";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import connectMongo from "./mongoose";
import User from "@/models/User";

/**
 * Generate a secure auth secret for VM authentication
 * @returns {string} Base64-encoded random secret
 */
export function generateAuthSecret() {
  return crypto.randomBytes(32).toString("base64");
}

/**
 * Generate a random subdomain (adjective-noun combination)
 * @returns {string} Random subdomain like 'cozy-peanut'
 */
function generateRandomSubdomain() {
  const adjectives = [
    'agile', 'azure', 'bold', 'brave', 'bright', 'calm', 'clear', 'clever',
    'cosmic', 'cozy', 'crisp', 'daring', 'deft', 'eager', 'epic', 'fair',
    'fancy', 'fast', 'fierce', 'fine', 'fleet', 'fluffy', 'fresh', 'gentle',
    'gleam', 'gold', 'grand', 'great', 'green', 'happy', 'hardy', 'hasty'
  ];
  const nouns = [
    'acorn', 'apple', 'arrow', 'badge', 'beach', 'bear', 'bee', 'bell',
    'berry', 'bird', 'bloom', 'boat', 'book', 'brook', 'bunny', 'cake',
    'candle', 'cave', 'cedar', 'cherry', 'cliff', 'cloud', 'clover', 'coral',
    'crane', 'creek', 'crown', 'daisy', 'dawn', 'deer', 'delta', 'dew'
  ];

  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${adjective}-${noun}`;
}

/**
 * Provision a new VM
 * Accepts either a userId string OR an options object for backwards compatibility
 *
 * @param {string|Object} userIdOrOptions - Either userId string or options object
 * @param {string} userIdOrOptions.subdomain - The subdomain for the VM (when using options)
 * @param {string} userIdOrOptions.userId - The user ID requesting the VM (when using options)
 * @param {string} userIdOrOptions.provider - Cloud provider (when using options)
 * @param {string} userIdOrOptions.region - Region for VM deployment (when using options)
 * @param {string} userIdOrOptions.size - VM size/type (when using options)
 * @returns {Promise<Object>} Provisioning result
 */
export async function provisionVM(userIdOrOptions) {
  // Handle string userId parameter (simple signature)
  if (typeof userIdOrOptions === 'string') {
    return await provisionVMForUser(userIdOrOptions);
  }

  // Handle options object parameter (detailed signature)
  return await provisionVMWithOptions(userIdOrOptions);
}

/**
 * Simplified provisioning function that accepts just a userId
 * @param {string} userId - The user ID
 * @returns {Promise<Object>} Provisioning result
 */
async function provisionVMForUser(userId) {
  try {
    await connectMongo();

    // Load user from database
    const user = await User.findById(userId);
    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }

    // Check if user already has a VM
    if (user.vmSubdomain) {
      console.log(`User ${userId} already has VM: ${user.vmSubdomain}`);
      return {
        success: false,
        error: 'User already has a provisioned VM',
        subdomain: user.vmSubdomain
      };
    }

    // Generate a unique subdomain
    const subdomain = generateRandomSubdomain();

    // Generate auth secret and hash it
    const authSecret = generateAuthSecret();
    const authSecretHash = await bcrypt.hash(authSecret, 10);

    // Update user status to provisioning and store expected auth secret hash
    user.vmStatus = 'provisioning';
    user.vmSubdomain = subdomain;
    user.vmAuthSecretHash = authSecretHash; // Store hash so we can verify when VM registers
    await user.save();

    console.log(`Starting VM provisioning for user ${userId} with subdomain ${subdomain}`);

    // Call main provisioning function
    const result = await provisionVMWithOptions({
      subdomain,
      userId: userId.toString(),
      authSecret, // Pass the pre-generated auth secret
      provider: 'hetzner',
      region: 'hel1',      // Helsinki
      size: 'cx23',        // 2 vCPU, 4GB RAM
      volumeSize: 30,      // 30GB attached volume
    });

    // Update user with provisioning results
    // Note: vmStatus stays as 'provisioning' until the VM calls /api/vm/register
    if (result.success) {
      user.vmIp = result.ipAddress;
      user.vmHetznerId = result.vmId;
      await user.save();
      console.log(`VM created for user ${userId}, waiting for VM to register itself`);
    } else {
      user.vmStatus = 'error';
      await user.save();
      console.error(`VM provisioning failed for user ${userId}:`, result.error);
    }

    return result;
  } catch (error) {
    console.error(`Failed to provision VM for user ${userId}:`, error);

    // Try to update user status to error
    try {
      await connectMongo();
      const user = await User.findById(userId);
      if (user) {
        user.vmStatus = 'error';
        await user.save();
      }
    } catch (dbError) {
      console.error('Failed to update user status:', dbError);
    }

    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Provision a new VM with the specified configuration
 * @param {Object} options - Provisioning options
 * @param {string} options.subdomain - The subdomain for the VM
 * @param {string} options.userId - The user ID requesting the VM
 * @param {string} options.authSecret - Pre-generated auth secret for the VM
 * @param {string} options.provider - Cloud provider (e.g., 'hetzner', 'aws', 'gcp')
 * @param {string} options.region - Region for VM deployment
 * @param {string} options.size - VM size/type
 * @param {number} options.volumeSize - Size of attached volume in GB
 * @returns {Promise<Object>} Provisioning result
 */
async function provisionVMWithOptions({
  subdomain,
  userId,
  authSecret,
  provider = "hetzner",
  region = "hel1",
  size = "cx23",
  volumeSize = 30,
}) {
  // Use provided auth secret or generate a new one
  const vmAuthSecret = authSecret || generateAuthSecret();

  // Generate cloud-init configuration
  const cloudInitConfig = generateCloudInit(subdomain, vmAuthSecret);

  // Provisioning steps (VM will register itself when ready via /api/vm/register)
  const provisioningSteps = [
    { step: "validate", status: "pending" },
    { step: "create_vm", status: "pending" },
    { step: "configure_dns", status: "pending" },
  ];

  try {
    // Step 1: Validate inputs
    provisioningSteps[0].status = "running";
    validateProvisioningInputs({ subdomain, userId, provider, region, size });
    provisioningSteps[0].status = "completed";

    // Step 2: Create VM with cloud provider
    provisioningSteps[1].status = "running";
    const vmResult = await createVM({
      provider,
      region,
      size,
      cloudInitConfig,
      subdomain,
      volumeSize,
    });
    provisioningSteps[1].status = "completed";

    // Step 3: Configure DNS
    provisioningSteps[2].status = "running";
    await configureDNS({
      subdomain,
      ipAddress: vmResult.ipAddress,
    });
    provisioningSteps[2].status = "completed";

    // Note: We return success here. The VM will call /api/vm/register when it's
    // fully booted and services are running. This avoids Vercel function timeout.

    return {
      success: true,
      vmId: vmResult.vmId,
      ipAddress: vmResult.ipAddress,
      subdomain,
      authSecret: vmAuthSecret,
      provisioningSteps,
    };
  } catch (error) {
    const failedStep = provisioningSteps.find((s) => s.status === "running");
    if (failedStep) {
      failedStep.status = "failed";
      failedStep.error = error.message;
    }

    return {
      success: false,
      error: error.message,
      provisioningSteps,
    };
  }
}

/**
 * Validate provisioning inputs
 */
function validateProvisioningInputs({ subdomain, userId, provider, region, size }) {
  if (!subdomain || typeof subdomain !== "string") {
    throw new Error("Invalid subdomain");
  }
  if (!userId) {
    throw new Error("User ID is required");
  }
  if (!["hetzner", "aws", "gcp", "digitalocean"].includes(provider)) {
    throw new Error(`Unsupported provider: ${provider}`);
  }
  // Subdomain validation (alphanumeric and hyphens only)
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(subdomain)) {
    throw new Error("Subdomain must be alphanumeric with optional hyphens");
  }
}

/**
 * Create VM with cloud provider
 * @returns {Promise<Object>} VM creation result with vmId and ipAddress
 */
async function createVM({ provider, region, size, cloudInitConfig, subdomain, volumeSize = 30 }) {
  console.log(`Creating VM on ${provider} in ${region} with size ${size}, volume ${volumeSize}GB`);

  if (provider !== "hetzner") {
    throw new Error(`Provider ${provider} not yet implemented`);
  }

  const HETZNER_API_TOKEN = process.env.HETZNER_API_TOKEN;
  if (!HETZNER_API_TOKEN) {
    throw new Error("HETZNER_API_TOKEN environment variable is required");
  }

  // Step 1: Create volume first
  console.log(`Creating ${volumeSize}GB volume in ${region}...`);
  const volumeResponse = await fetch("https://api.hetzner.cloud/v1/volumes", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${HETZNER_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: `alfred-${subdomain}-data`,
      size: volumeSize,
      location: region,
      format: "ext4",
      labels: {
        service: "alfred",
        subdomain: subdomain,
      },
    }),
  });

  if (!volumeResponse.ok) {
    const error = await volumeResponse.json();
    throw new Error(`Hetzner Volume API error: ${error.error?.message || volumeResponse.statusText}`);
  }

  const volumeData = await volumeResponse.json();
  const volumeId = volumeData.volume.id;
  console.log(`Volume created: ${volumeId}`);

  // Step 2: Create VM via Hetzner Cloud API with IPv4, IPv6, and attached volume
  const response = await fetch("https://api.hetzner.cloud/v1/servers", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${HETZNER_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: `alfred-${subdomain}`,
      server_type: size,
      location: region,
      image: "ubuntu-24.04",
      user_data: cloudInitConfig,
      volumes: [volumeId],
      public_net: {
        enable_ipv4: true,
        enable_ipv6: true,
      },
      labels: {
        service: "alfred",
        subdomain: subdomain,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    // If server creation fails, try to delete the volume we just created
    console.log(`Server creation failed, cleaning up volume ${volumeId}...`);
    try {
      await fetch(`https://api.hetzner.cloud/v1/volumes/${volumeId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${HETZNER_API_TOKEN}` },
      });
    } catch (cleanupError) {
      console.error(`Failed to cleanup volume: ${cleanupError.message}`);
    }
    throw new Error(`Hetzner API error: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();
  const server = data.server;

  // Wait for server to have an IP (may take a few seconds)
  let ipAddress = server.public_net?.ipv4?.ip;
  let ipv6Address = server.public_net?.ipv6?.ip;
  if (!ipAddress) {
    // Poll for IP address
    for (let i = 0; i < 30; i++) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const statusResponse = await fetch(`https://api.hetzner.cloud/v1/servers/${server.id}`, {
        headers: { "Authorization": `Bearer ${HETZNER_API_TOKEN}` },
      });
      const statusData = await statusResponse.json();
      ipAddress = statusData.server?.public_net?.ipv4?.ip;
      ipv6Address = statusData.server?.public_net?.ipv6?.ip;
      if (ipAddress) break;
    }
  }

  if (!ipAddress) {
    throw new Error("Failed to obtain IP address for VM");
  }

  console.log(`VM created: ${server.id} with IPv4 ${ipAddress}, IPv6 ${ipv6Address || 'pending'}, volume ${volumeId}`);

  return {
    vmId: server.id.toString(),
    ipAddress,
    ipv6Address,
    volumeId: volumeId.toString(),
  };
}

/**
 * Configure DNS for the subdomain
 */
async function configureDNS({ subdomain, ipAddress }) {
  console.log(`Configuring DNS: ${subdomain}.alfredos.site -> ${ipAddress}`);

  const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
  const CLOUDFLARE_ZONE_ID = process.env.CLOUDFLARE_ZONE_ID;

  if (!CLOUDFLARE_API_TOKEN) {
    throw new Error("CLOUDFLARE_API_TOKEN environment variable is required");
  }
  if (!CLOUDFLARE_ZONE_ID) {
    throw new Error("CLOUDFLARE_ZONE_ID environment variable is required");
  }

  // Create A record for subdomain.alfredos.site
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/dns_records`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${CLOUDFLARE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "A",
        name: subdomain,
        content: ipAddress,
        ttl: 60,
        proxied: false, // Direct connection for WebSocket support
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    // If record already exists, try to update it
    if (error.errors?.[0]?.code === 81057) {
      console.log(`DNS record exists, updating...`);
      return await updateDNSRecord({ subdomain, ipAddress });
    }
    throw new Error(`Cloudflare API error: ${error.errors?.[0]?.message || response.statusText}`);
  }

  const data = await response.json();
  console.log(`DNS record created: ${data.result.id}`);

  return data.result;
}

/**
 * Update existing DNS record
 */
async function updateDNSRecord({ subdomain, ipAddress }) {
  const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
  const CLOUDFLARE_ZONE_ID = process.env.CLOUDFLARE_ZONE_ID;

  // First, find the existing record
  const listResponse = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/dns_records?name=${subdomain}.alfredos.site&type=A`,
    {
      headers: { "Authorization": `Bearer ${CLOUDFLARE_API_TOKEN}` },
    }
  );

  const listData = await listResponse.json();
  if (!listData.result?.length) {
    throw new Error(`DNS record not found for ${subdomain}`);
  }

  const recordId = listData.result[0].id;

  // Update the record
  const updateResponse = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/dns_records/${recordId}`,
    {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${CLOUDFLARE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "A",
        name: subdomain,
        content: ipAddress,
        ttl: 60,
        proxied: false,
      }),
    }
  );

  if (!updateResponse.ok) {
    const error = await updateResponse.json();
    throw new Error(`Cloudflare update error: ${error.errors?.[0]?.message || updateResponse.statusText}`);
  }

  const data = await updateResponse.json();
  console.log(`DNS record updated: ${data.result.id}`);

  return data.result;
}

/**
 * Wait for VM to be ready and accepting connections
 */
async function waitForVMReady(ipAddress, maxAttempts = 30, interval = 10000) {
  console.log(`Waiting for VM at ${ipAddress} to be ready...`);

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      // Try to connect to the async-agent health endpoint
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`http://${ipAddress}:80/health`, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        console.log(`VM is ready after ${attempt + 1} attempts`);
        return true;
      }
    } catch {
      // Connection failed, wait and retry
      console.log(`Attempt ${attempt + 1}/${maxAttempts}: VM not ready yet...`);
    }

    await new Promise(resolve => setTimeout(resolve, interval));
  }

  throw new Error(`VM at ${ipAddress} did not become ready after ${maxAttempts} attempts`);
}

/**
 * Verify all required services are running on the VM
 */
async function verifyServices(ipAddress) {
  console.log(`Verifying services on ${ipAddress}...`);

  const services = [
    { name: "async-agent", path: "/health", port: 80 },
    { name: "librechat", path: "/chat", port: 80 },
    { name: "nocodb", path: "/db", port: 80 },
  ];

  const results = [];

  for (const service of services) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`http://${ipAddress}:${service.port}${service.path}`, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      results.push({
        name: service.name,
        healthy: response.ok || response.status === 302, // 302 redirect is OK for web apps
      });

      console.log(`Service ${service.name}: ${response.ok ? "healthy" : response.status}`);
    } catch (error) {
      results.push({ name: service.name, healthy: false, error: error.message });
      console.log(`Service ${service.name}: not responding`);
    }
  }

  // At minimum, async-agent must be healthy
  const asyncAgentHealthy = results.find(r => r.name === "async-agent")?.healthy;
  if (!asyncAgentHealthy) {
    throw new Error("async-agent service is not healthy");
  }

  return results;
}

/**
 * Deprovision/destroy a VM
 */
export async function deprovisionVM({ vmId, provider }) {
  console.log(`Deprovisioning VM ${vmId} on ${provider}`);

  // In production, this would:
  // 1. Stop all services
  // 2. Backup data if needed
  // 3. Remove DNS records
  // 4. Destroy VM instance

  return { success: true, vmId };
}

/**
 * Get provisioning status for a VM
 */
export async function getProvisioningStatus(vmId) {
  // In production, this would query the database or cloud provider
  // for the current provisioning status

  return {
    vmId,
    status: "unknown",
    steps: [],
  };
}
