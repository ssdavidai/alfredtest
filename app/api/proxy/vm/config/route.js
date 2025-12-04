import { NextResponse } from "next/server";
import { auth } from "@/libs/auth";
import connectMongo from "@/libs/mongoose";
import User from "@/models/User";

// Helper function to get user's VM URL
async function getUserVmUrl(userId) {
  await connectMongo();
  const user = await User.findById(userId);

  if (!user) {
    throw new Error("User not found");
  }

  // Check if user has a provisioned VM
  if (!user.vmSubdomain) {
    throw new Error("VM not provisioned yet. Please complete setup first.");
  }

  // Check VM status - allow 'ready' or 'provisioning' states
  if (user.vmStatus === 'pending') {
    throw new Error("VM provisioning has not started. Please complete setup first.");
  }

  if (user.vmStatus === 'error') {
    throw new Error("VM provisioning failed. Please contact support.");
  }

  // Construct VM URL from subdomain
  const vmDomain = process.env.VM_BASE_DOMAIN || 'alfredos.site';
  return `https://${user.vmSubdomain}.${vmDomain}`;
}

// GET: Retrieve config status from user's VM (returns masked key status)
export async function GET() {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  try {
    const vmUrl = await getUserVmUrl(session.user.id);

    // Proxy the request to the user's VM
    const response = await fetch(`${vmUrl}/api/config`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        // TODO: Add authentication header for VM in Phase 2
        // "Authorization": `Bearer ${signedJWT}`
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("VM API error:", errorText);
      return NextResponse.json(
        { error: "Failed to fetch config from VM" },
        { status: response.status }
      );
    }

    const config = await response.json();
    return NextResponse.json(config);
  } catch (e) {
    console.error("Error fetching config:", e);
    return NextResponse.json(
      { error: e?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: Save config to user's VM (anthropic_api_key)
export async function POST(req) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  try {
    const body = await req.json();

    // Validate anthropic_api_key
    if (!body.anthropic_api_key) {
      return NextResponse.json(
        { error: "Missing required field: anthropic_api_key" },
        { status: 400 }
      );
    }

    // Validate API key format (must start with sk-ant-)
    if (!body.anthropic_api_key.startsWith("sk-ant-")) {
      return NextResponse.json(
        { error: "Invalid API key format. Must start with 'sk-ant-'" },
        { status: 400 }
      );
    }

    // Basic length validation
    if (body.anthropic_api_key.length < 20) {
      return NextResponse.json(
        { error: "API key appears to be too short" },
        { status: 400 }
      );
    }

    const vmUrl = await getUserVmUrl(session.user.id);

    // Proxy the request to the user's VM
    const response = await fetch(`${vmUrl}/api/config`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // TODO: Add authentication header for VM in Phase 2
        // "Authorization": `Bearer ${signedJWT}`
      },
      body: JSON.stringify({
        anthropic_api_key: body.anthropic_api_key,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("VM API error:", errorData);
      return NextResponse.json(
        { error: errorData.error || "Failed to save config to VM" },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result, { status: 200 });
  } catch (e) {
    console.error("Error saving config:", e);
    return NextResponse.json(
      { error: e?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
