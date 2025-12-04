import { NextResponse } from "next/server";
import { auth } from "@/libs/auth";
import connectMongo from "@/libs/mongoose";
import User from "@/models/User";
import { provisionVM } from "@/libs/provisioning";

/**
 * POST /api/vm/provision
 * Manually trigger VM provisioning for users who have access but no VM yet
 */
export async function POST() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    await connectMongo();
    const user = await User.findById(session.user.id);

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if user has subscription access
    if (!user.hasAccess) {
      return NextResponse.json(
        { error: "Subscription required. Please subscribe first." },
        { status: 403 }
      );
    }

    // Check if VM is already provisioned or in progress
    if (user.vmStatus === 'ready') {
      return NextResponse.json(
        { error: "VM already provisioned", subdomain: user.vmSubdomain },
        { status: 400 }
      );
    }

    if (user.vmStatus === 'provisioning') {
      return NextResponse.json(
        { error: "VM provisioning already in progress", subdomain: user.vmSubdomain },
        { status: 400 }
      );
    }

    // Trigger VM provisioning
    console.log(`[Provision API] Starting VM provisioning for user ${user._id}`);

    // Start provisioning asynchronously and return immediately
    provisionVM(user._id.toString()).catch(err => {
      console.error(`[Provision API] VM provisioning failed for user ${user._id}:`, err);
    });

    return NextResponse.json({
      success: true,
      message: "VM provisioning started",
      vmStatus: 'provisioning',
    });

  } catch (error) {
    console.error("[Provision API] Error:", error);
    return NextResponse.json(
      { error: "Failed to start provisioning", message: error.message },
      { status: 500 }
    );
  }
}
