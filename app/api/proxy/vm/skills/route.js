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

// GET: List all skills from user's VM
export async function GET() {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  try {
    const vmUrl = await getUserVmUrl(session.user.id);

    // Proxy the request to the user's VM
    const response = await fetch(`${vmUrl}/api/skills`, {
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
        { error: "Failed to fetch skills from VM" },
        { status: response.status }
      );
    }

    const skills = await response.json();
    return NextResponse.json(skills);
  } catch (e) {
    console.error("Error fetching skills:", e);
    return NextResponse.json(
      { error: e?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: Create a new skill on user's VM
export async function POST(req) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  try {
    const body = await req.json();

    // Validate required fields
    if (!body.name || !body.description || !body.trigger_type || !body.steps) {
      return NextResponse.json(
        {
          error: "Missing required fields: name, description, trigger_type, steps"
        },
        { status: 400 }
      );
    }

    // Validate trigger type
    if (!["manual", "schedule", "webhook"].includes(body.trigger_type)) {
      return NextResponse.json(
        {
          error: "Invalid trigger_type. Must be: manual, schedule, or webhook"
        },
        { status: 400 }
      );
    }

    // Validate steps array
    if (!Array.isArray(body.steps) || body.steps.length === 0) {
      return NextResponse.json(
        { error: "Steps must be a non-empty array" },
        { status: 400 }
      );
    }

    // Validate each step has required fields
    for (let i = 0; i < body.steps.length; i++) {
      const step = body.steps[i];
      if (!step.id || !step.prompt) {
        return NextResponse.json(
          {
            error: `Step ${i + 1} is missing required fields: id, prompt`
          },
          { status: 400 }
        );
      }
    }

    // Validate trigger config for schedule and webhook types
    if (body.trigger_type === "schedule" && body.trigger_config?.cron) {
      // Basic cron validation (just check it's not empty)
      if (typeof body.trigger_config.cron !== "string" || !body.trigger_config.cron.trim()) {
        return NextResponse.json(
          { error: "schedule trigger requires valid trigger_config.cron" },
          { status: 400 }
        );
      }
    }

    const vmUrl = await getUserVmUrl(session.user.id);

    // Proxy the request to the user's VM
    const response = await fetch(`${vmUrl}/api/skills`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // TODO: Add authentication header for VM in Phase 2
        // "Authorization": `Bearer ${signedJWT}`
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("VM API error:", errorData);
      return NextResponse.json(
        { error: errorData.error || "Failed to create skill on VM" },
        { status: response.status }
      );
    }

    const skill = await response.json();
    return NextResponse.json(skill, { status: 201 });
  } catch (e) {
    console.error("Error creating skill:", e);
    return NextResponse.json(
      { error: e?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
