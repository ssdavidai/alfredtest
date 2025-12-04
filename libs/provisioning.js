/**
 * VM Provisioning Orchestrator
 * Handles the full provisioning flow for Alfred VMs
 */

import { generateCloudInit } from "./cloudinit";
import crypto from "crypto";
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

    // Update user status to provisioning
    user.vmStatus = 'provisioning';
    user.vmSubdomain = subdomain;
    await user.save();

    console.log(`Starting VM provisioning for user ${userId} with subdomain ${subdomain}`);

    // Call main provisioning function
    const result = await provisionVMWithOptions({
      subdomain,
      userId: userId.toString(),
      provider: 'hetzner',
      region: 'fsn1',
      size: 'cx21'
    });

    // Update user with provisioning results
    if (result.success) {
      user.vmStatus = 'ready';
      user.vmIp = result.ipAddress;
      user.vmHetznerId = result.vmId;
      user.vmProvisionedAt = new Date();
      await user.save();
      console.log(`VM provisioning completed successfully for user ${userId}`);
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
 * @param {string} options.provider - Cloud provider (e.g., 'hetzner', 'aws', 'gcp')
 * @param {string} options.region - Region for VM deployment
 * @param {string} options.size - VM size/type
 * @returns {Promise<Object>} Provisioning result
 */
async function provisionVMWithOptions({
  subdomain,
  userId,
  provider = "hetzner",
  region = "fsn1",
  size = "cx21",
}) {
  // Generate auth secret for this VM
  const authSecret = generateAuthSecret();

  // Generate cloud-init configuration
  const cloudInitConfig = generateCloudInit(subdomain, authSecret);

  // Provisioning steps
  const provisioningSteps = [
    { step: "validate", status: "pending" },
    { step: "create_vm", status: "pending" },
    { step: "configure_dns", status: "pending" },
    { step: "wait_for_ready", status: "pending" },
    { step: "verify_services", status: "pending" },
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
    });
    provisioningSteps[1].status = "completed";

    // Step 3: Configure DNS
    provisioningSteps[2].status = "running";
    await configureDNS({
      subdomain,
      ipAddress: vmResult.ipAddress,
    });
    provisioningSteps[2].status = "completed";

    // Step 4: Wait for VM to be ready
    provisioningSteps[3].status = "running";
    await waitForVMReady(vmResult.ipAddress);
    provisioningSteps[3].status = "completed";

    // Step 5: Verify services are running
    provisioningSteps[4].status = "running";
    await verifyServices(vmResult.ipAddress);
    provisioningSteps[4].status = "completed";

    return {
      success: true,
      vmId: vmResult.vmId,
      ipAddress: vmResult.ipAddress,
      subdomain,
      authSecret,
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
async function createVM({ provider, region, size, cloudInitConfig, subdomain }) {
  // This would integrate with cloud provider APIs
  // For now, return a placeholder implementation
  console.log(`Creating VM on ${provider} in ${region} with size ${size}`);

  // In production, this would call:
  // - Hetzner Cloud API
  // - AWS EC2 API
  // - GCP Compute Engine API
  // - DigitalOcean API

  return {
    vmId: `vm-${crypto.randomBytes(8).toString("hex")}`,
    ipAddress: "0.0.0.0", // Placeholder - would be actual IP from provider
  };
}

/**
 * Configure DNS for the subdomain
 */
async function configureDNS({ subdomain, ipAddress }) {
  // This would integrate with DNS provider (e.g., Cloudflare, Route53)
  console.log(`Configuring DNS: ${subdomain} -> ${ipAddress}`);

  // In production, this would:
  // 1. Create A record for subdomain
  // 2. Create AAAA record if IPv6 available
  // 3. Configure SSL/TLS settings
}

/**
 * Wait for VM to be ready and accepting connections
 */
async function waitForVMReady(ipAddress, maxAttempts = 30, interval = 10000) {
  console.log(`Waiting for VM at ${ipAddress} to be ready...`);

  // In production, this would poll the VM until it responds
  // to health checks on expected ports

  return true;
}

/**
 * Verify all required services are running on the VM
 */
async function verifyServices(ipAddress) {
  console.log(`Verifying services on ${ipAddress}...`);

  // In production, this would check:
  // 1. Docker is running
  // 2. async-agent container is healthy
  // 3. postgres is accepting connections
  // 4. caddy is serving HTTPS

  return true;
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
