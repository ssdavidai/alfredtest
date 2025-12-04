import { NextResponse } from "next/server";
import { auth } from "@/libs/auth";
import connectMongo from "@/libs/mongoose";
import User from "@/models/User";
import { provisionVM } from "@/libs/provisioning";

// Extend timeout for provisioning (max 60s on Vercel Pro, 10s on Hobby)
export const maxDuration = 60;

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

    // If retrying from error, reset VM fields
    if (user.vmStatus === 'error') {
      console.log(`[Provision API] Resetting error state for user ${user._id}`);
      user.vmSubdomain = null;
      user.vmIp = null;
      user.vmHetznerId = null;
      user.vmStatus = 'pending';
      await user.save();
    }

    // Trigger VM provisioning synchronously
    console.log(`[Provision API] Starting VM provisioning for user ${user._id}`);

    // Run provisioning synchronously so it completes before function ends
    const result = await provisionVM(user._id.toString());

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "VM provisioning completed",
        vmStatus: 'provisioning', // Still provisioning until VM registers itself
        subdomain: result.subdomain,
        ipAddress: result.ipAddress,
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error || "Provisioning failed",
        vmStatus: 'error',
      }, { status: 500 });
    }

  } catch (error) {
    console.error("[Provision API] Error:", error);
    return NextResponse.json(
      { error: "Failed to start provisioning", message: error.message },
      { status: 500 }
    );
  }
}
