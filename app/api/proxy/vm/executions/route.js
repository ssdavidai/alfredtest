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

  // TODO: In Phase 2, this will come from user.vm_subdomain
  // Example: return `https://${user.vm_subdomain}.alfredos.site`;

  const vmUrl = process.env.USER_VM_URL;
  if (!vmUrl) {
    throw new Error("VM not provisioned yet. Please complete setup first.");
  }

  return vmUrl;
}

// GET: List executions from user's VM with pagination and filtering
export async function GET(req) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);
    const status = searchParams.get("status") || "all";
    const skillId = searchParams.get("skillId");

    if (page < 1 || pageSize < 1 || pageSize > 100) {
      return NextResponse.json(
        { error: "Invalid pagination parameters" },
        { status: 400 }
      );
    }

    if (status !== "all" && !["running", "completed", "failed"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status filter" },
        { status: 400 }
      );
    }

    const vmUrl = await getUserVmUrl(session.user.id);
    const queryParams = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
    });

    if (status !== "all") {
      queryParams.append("status", status);
    }

    if (skillId) {
      queryParams.append("skillId", skillId);
    }

    const response = await fetch(`${vmUrl}/api/executions?${queryParams.toString()}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("VM API error:", errorText);
      return NextResponse.json(
        { error: "Failed to fetch executions from VM" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (e) {
    console.error("Error fetching executions:", e);
    return NextResponse.json(
      { error: e?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
