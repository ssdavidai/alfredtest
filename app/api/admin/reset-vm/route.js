import { NextResponse } from "next/server";
import connectMongo from "@/libs/mongoose";
import User from "@/models/User";

/**
 * POST /api/admin/reset-vm
 * Reset a user's VM status to allow re-provisioning
 * Protected by E2E_TEST_SECRET
 */
export async function POST(req) {
  try {
    const { email, secret } = await req.json();

    // Verify admin secret
    if (secret !== process.env.E2E_TEST_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    await connectMongo();

    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Reset VM fields to allow re-provisioning
    user.vmStatus = "error"; // This allows the "Retry Setup" button to appear
    user.vmSubdomain = null;
    user.vmIp = null;
    user.vmHetznerId = null;
    user.vmAuthSecretHash = null;
    user.vmPublicKey = null;
    user.vmProvisionedAt = null;
    await user.save();

    console.log(`[Admin] Reset VM status for user ${email}`);

    return NextResponse.json({
      success: true,
      message: `VM status reset for ${email}`,
      vmStatus: user.vmStatus
    });
  } catch (error) {
    console.error("[Admin] Reset VM error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
